"use client";

import { useState } from "react";
import { Paper } from "@/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper: (paper: Paper) => void;
}

interface SearchInterpretation {
  query: string;
  categories: string[];
  sortBy: string;
  explanation: string;
}

export function SearchModal({ isOpen, onClose, onSelectPaper }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Paper[]>([]);
  const [interpretation, setInterpretation] = useState<SearchInterpretation | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.papers);
        setInterpretation(data.interpretation || null);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectPaper(paper: Paper) {
    onSelectPaper(paper);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="h-full overflow-y-auto">
        <div className="min-h-full bg-slate-900 text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <h1 className="text-xl font-bold">Search Papers</h1>
              </div>

              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search with natural language... (e.g., 'papers about protein folding with transformers')"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !query.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-3xl mx-auto p-4">
            {/* AI Interpretation */}
            {interpretation && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">✨</span>
                  <div>
                    <p className="text-sm text-blue-300">{interpretation.explanation}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Searching: &quot;{interpretation.query}&quot; in {interpretation.categories.join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {hasSearched && results.length === 0 && !isSearching && (
              <div className="text-center py-12 text-slate-500">
                <p>No papers found. Try a different search query.</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">{results.length} papers found</p>
                {results.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => handleSelectPaper(paper)}
                    className="w-full text-left p-4 bg-slate-800 hover:bg-slate-750 rounded-lg transition-colors border border-slate-700 hover:border-slate-600"
                  >
                    <div className="flex flex-wrap gap-2 mb-2">
                      {paper.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-medium mb-1 line-clamp-2">{paper.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-1">
                      {paper.authors.slice(0, 3).join(", ")}
                      {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Initial state */}
            {!hasSearched && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold mb-2">AI-Powered Search</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                  Use natural language to find papers. Try queries like:
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    "Large language models for code generation",
                    "Vision transformers for medical imaging",
                    "Reinforcement learning robotics",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setQuery(example)}
                      className="block w-full max-w-sm mx-auto px-4 py-2 text-sm bg-slate-800 hover:bg-slate-750 rounded-lg transition-colors text-left"
                    >
                      &quot;{example}&quot;
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
