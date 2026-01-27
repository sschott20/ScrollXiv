"use client";

import { useEffect, useState, useCallback } from "react";
import { ScrollFeed } from "@/components/ScrollFeed";
import { PaperDetail } from "@/components/PaperDetail";
import { SearchModal } from "@/components/SearchModal";
import { Paper } from "@/types";

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const loadInitialPapers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/feed?refresh=true");
      if (!response.ok) {
        throw new Error("Failed to load papers");
      }

      const data = await response.json();
      setPapers(data.papers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialPapers();
  }, [loadInitialPapers]);

  function handleExpandPaper(paper: Paper) {
    setSelectedPaper(paper);
  }

  function handleClosePaper() {
    setSelectedPaper(null);
  }

  function handleSearchSelect(paper: Paper) {
    // Add paper to the beginning of the feed if not already there
    setPapers((prev) => {
      const exists = prev.some((p) => p.id === paper.id);
      if (exists) {
        return prev;
      }
      return [paper, ...prev];
    });
    setSelectedPaper(paper);
  }

  if (isLoading) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin h-12 w-12 border-4 border-blue-400 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-400">Loading latest papers from arXiv...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-slate-400 mb-4 text-center">{error}</p>
        <button
          onClick={loadInitialPapers}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="relative">
      {/* Main scroll feed */}
      <ScrollFeed initialPapers={papers} onExpandPaper={handleExpandPaper} />

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-700">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          <button
            onClick={loadInitialPapers}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs">Home</span>
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-xs">Search</span>
          </button>

          <a
            href="https://arxiv.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span className="text-xs">arXiv</span>
          </a>
        </div>
      </nav>

      {/* Paper detail modal */}
      {selectedPaper && (
        <PaperDetail paper={selectedPaper} onClose={handleClosePaper} />
      )}

      {/* Search modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPaper={handleSearchSelect}
      />
    </main>
  );
}
