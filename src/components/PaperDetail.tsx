"use client";

import { Paper, CATEGORY_LABELS } from "@/types";
import { useEffect, useState } from "react";

interface PaperDetailProps {
  paper: Paper;
  onClose: () => void;
}

export function PaperDetail({ paper, onClose }: PaperDetailProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [displayPaper, setDisplayPaper] = useState(paper);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    // Fetch latest paper data with saved status
    async function fetchPaper() {
      try {
        const response = await fetch(`/api/papers/${paper.id}`);
        if (response.ok) {
          const data = await response.json();
          setDisplayPaper(data.paper);
          setIsSaved(data.saved);
        }
      } catch (error) {
        console.error("Failed to fetch paper:", error);
      }
    }

    fetchPaper();

    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [paper.id]);

  useEffect(() => {
    // Auto-summarize if not already summarized
    if (!displayPaper.hook && !isSummarizing) {
      summarizePaper();
    }
  }, [displayPaper.hook]);

  async function summarizePaper() {
    if (displayPaper.hook || isSummarizing) return;

    setIsSummarizing(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper.id }),
      });

      if (response.ok) {
        const { paper: updatedPaper } = await response.json();
        setDisplayPaper(updatedPaper);
      }
    } catch (error) {
      console.error("Failed to summarize:", error);
    } finally {
      setIsSummarizing(false);
    }
  }

  async function toggleSave() {
    try {
      const response = await fetch(`/api/papers/${paper.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isSaved ? "unsave" : "save" }),
      });

      if (response.ok) {
        setIsSaved(!isSaved);
      }
    } catch (error) {
      console.error("Failed to toggle save:", error);
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function getCategoryLabel(cat: string): string {
    return CATEGORY_LABELS[cat] || cat;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="h-full overflow-y-auto">
        <div className="min-h-full bg-slate-900 text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 p-4">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={toggleSave}
                  className={`p-2 rounded-full transition-colors ${
                    isSaved
                      ? "bg-pink-500/20 text-pink-400"
                      : "bg-slate-700 text-slate-400 hover:text-pink-400"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={isSaved ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>

                <a
                  href={paper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-20">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {paper.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full"
                >
                  {getCategoryLabel(cat)}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
              {paper.title}
            </h1>

            {/* Authors and date */}
            <div className="text-slate-400 mb-6">
              <p className="mb-1">{paper.authors.join(", ")}</p>
              <p className="text-sm">{formatDate(paper.publishedDate)}</p>
            </div>

            {/* arXiv ID */}
            <div className="mb-6">
              <a
                href={`https://arxiv.org/abs/${paper.arxivId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                arXiv:{paper.arxivId}
              </a>
            </div>

            {/* AI Summary */}
            {(displayPaper.hook || isSummarizing) && (
              <div className="bg-slate-800 rounded-xl p-4 sm:p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>✨</span> AI Summary
                </h2>

                {isSummarizing ? (
                  <div className="flex items-center gap-2 text-amber-400">
                    <div className="animate-spin h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full"></div>
                    <span>Generating summary...</span>
                  </div>
                ) : (
                  <>
                    {displayPaper.hook && (
                      <div className="mb-4">
                        <p className="text-xl font-bold text-amber-400">
                          {displayPaper.hook}
                        </p>
                      </div>
                    )}

                    {displayPaper.keyConcepts && displayPaper.keyConcepts.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2">
                          Key Concepts
                        </h3>
                        <ul className="space-y-1">
                          {displayPaper.keyConcepts.map((concept, i) => (
                            <li key={i} className="text-slate-200 flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>{concept}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {displayPaper.summary && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2">
                          Summary
                        </h3>
                        <p className="text-slate-200">{displayPaper.summary}</p>
                      </div>
                    )}

                    {displayPaper.whyMatters && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-400 mb-2">
                          Why It Matters
                        </h3>
                        <p className="text-slate-200">{displayPaper.whyMatters}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Abstract */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Abstract</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {paper.abstract}
              </p>
            </div>

            {/* PDF Link */}
            <div className="mt-8">
              <a
                href={paper.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
