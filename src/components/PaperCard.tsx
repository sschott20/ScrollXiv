"use client";

import { Paper, CATEGORY_LABELS } from "@/types";
import { useState, useEffect } from "react";

interface PaperCardProps {
  paper: Paper;
  onExpand: (paper: Paper) => void;
  onDiscard?: (paper: Paper) => void;
  isActive: boolean;
  shouldPrefetch?: boolean; // True for next 2 cards to prefetch content
}

export function PaperCard({ paper, onExpand, onDiscard, isActive, shouldPrefetch = false }: PaperCardProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizedPaper, setSummarizedPaper] = useState(paper);
  const [isSaved, setIsSaved] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isFetchingFigures, setIsFetchingFigures] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    setSummarizedPaper(paper);
    setImageError(false);
  }, [paper]);

  useEffect(() => {
    // Auto-summarize when card becomes active OR should prefetch
    if ((isActive || shouldPrefetch) && !summarizedPaper.hook && !isSummarizing) {
      summarizePaper();
    }
  }, [isActive, shouldPrefetch, summarizedPaper.hook]);

  useEffect(() => {
    // Fetch figures when card becomes active OR should prefetch
    if (
      (isActive || shouldPrefetch) &&
      !summarizedPaper.selectedFigure &&
      !summarizedPaper.figuresError &&
      !isFetchingFigures
    ) {
      fetchFigures();
    }
  }, [isActive, shouldPrefetch, summarizedPaper.selectedFigure, summarizedPaper.figuresError]);

  async function summarizePaper() {
    if (summarizedPaper.hook || isSummarizing) return;

    setIsSummarizing(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper.id }),
      });

      if (response.ok) {
        const { paper: updatedPaper } = await response.json();
        setSummarizedPaper(updatedPaper);
      }
    } catch (error) {
      console.error("Failed to summarize:", error);
    } finally {
      setIsSummarizing(false);
    }
  }

  async function fetchFigures() {
    if (
      summarizedPaper.selectedFigure ||
      summarizedPaper.figuresError ||
      isFetchingFigures
    )
      return;

    setIsFetchingFigures(true);
    try {
      const response = await fetch("/api/figures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper.id }),
      });

      if (response.ok) {
        const { paper: updatedPaper } = await response.json();
        setSummarizedPaper((prev) => ({ ...prev, ...updatedPaper }));
      }
    } catch (error) {
      console.error("Failed to fetch figures:", error);
    } finally {
      setIsFetchingFigures(false);
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

  async function discardPaper() {
    if (isDiscarding) return;
    setIsDiscarding(true);
    try {
      const response = await fetch(`/api/papers/${paper.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discard" }),
      });

      if (response.ok && onDiscard) {
        onDiscard(paper);
      }
    } catch (error) {
      console.error("Failed to discard paper:", error);
    } finally {
      setIsDiscarding(false);
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getCategoryLabel(cat: string): string {
    return CATEGORY_LABELS[cat] || cat;
  }

  const displayPaper = summarizedPaper;

  return (
    <div className="h-dvh w-full snap-start flex relative bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Main content area - clickable to expand */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 pb-20 cursor-pointer"
        onClick={() => onExpand(paper)}
      >
        {/* Centered container for desktop */}
        <div className="max-w-3xl mx-auto lg:flex lg:gap-8">
          {/* Figure on RIGHT side for desktop, hidden here on mobile (shown below) */}
          {displayPaper.selectedFigure && !imageError && (
            <div className="hidden lg:block lg:flex-shrink-0 lg:w-80 lg:order-last">
              <button
                onClick={(e) => { e.stopPropagation(); setShowLightbox(true); }}
                className="relative w-full h-56 rounded-lg overflow-hidden bg-slate-700 cursor-zoom-in group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayPaper.selectedFigure.url}
                  alt={displayPaper.selectedFigure.caption}
                  className="w-full h-full object-contain"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-70 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </button>
              <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                {displayPaper.selectedFigure.caption}
              </p>
            </div>
          )}

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Category tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {paper.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full"
                >
                  {getCategoryLabel(cat)}
                </span>
              ))}
            </div>

            {/* Hook line */}
            <div className="mb-3 min-h-[2.5rem]">
              {isSummarizing ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <div className="animate-spin h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Generating summary...</span>
                </div>
              ) : displayPaper.hook ? (
                <p className="text-lg sm:text-xl font-bold text-amber-400 leading-tight">
                  {displayPaper.hook}
                </p>
              ) : null}
            </div>

            {/* Figure display for mobile only */}
            {displayPaper.selectedFigure && !imageError && (
              <div className="mb-3 lg:hidden">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowLightbox(true); }}
                  className="relative w-full h-36 sm:h-44 rounded-lg overflow-hidden bg-slate-700 cursor-zoom-in group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayPaper.selectedFigure.url}
                    alt={displayPaper.selectedFigure.caption}
                    className="w-full h-full object-contain"
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-70 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </button>
                <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                  {displayPaper.selectedFigure.caption}
                </p>
              </div>
            )}

            {/* Loading state for figures */}
            {isFetchingFigures && (
              <div className="mb-3 flex items-center gap-2 text-slate-400">
                <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                <span className="text-sm">Loading figure...</span>
              </div>
            )}

            {/* Title and meta */}
            <div className="mb-3">
              <h2 className="text-base sm:text-lg font-semibold mb-1 leading-tight line-clamp-2">
                {paper.title}
              </h2>
              <p className="text-xs text-slate-400">
                {paper.authors.slice(0, 3).join(", ")}
                {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                <span className="mx-2">•</span>
                {formatDate(paper.publishedDate)}
              </p>
            </div>

            {/* Key concepts */}
            {displayPaper.keyConcepts && displayPaper.keyConcepts.length > 0 && (
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <span>📌</span> Key Concepts
                </h3>
                <ul className="space-y-0.5">
                  {displayPaper.keyConcepts.slice(0, 3).map((concept, i) => (
                    <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span className="line-clamp-1">{concept}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Why it matters */}
            {displayPaper.whyMatters && (
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <span>💡</span> Why It Matters
                </h3>
                <p className="text-sm text-slate-300 line-clamp-2">
                  {displayPaper.whyMatters}
                </p>
              </div>
            )}

            {/* Abstract preview (if no AI summary yet) */}
            {!displayPaper.hook && !isSummarizing && (
              <div className="mb-3">
                <p className="text-sm text-slate-300 line-clamp-4">
                  {paper.abstract}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side action buttons - TikTok style */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-4 items-center">
        <button
          onClick={(e) => { e.stopPropagation(); toggleSave(); }}
          className={`p-3 rounded-full transition-all shadow-lg ${
            isSaved
              ? "bg-pink-500 text-white"
              : "bg-slate-800/90 text-slate-300 hover:text-pink-400"
          }`}
          title="Save paper"
        >
          <svg
            className="w-7 h-7"
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

        <button
          onClick={(e) => { e.stopPropagation(); discardPaper(); }}
          disabled={isDiscarding}
          className="p-3 bg-slate-800/90 text-slate-300 hover:text-red-400 rounded-full transition-all shadow-lg disabled:opacity-50"
          title="Not interested"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <a
          href={paper.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-3 bg-slate-800/90 text-slate-300 hover:text-blue-400 rounded-full transition-all shadow-lg"
          title="Download PDF"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </a>
      </div>

      {/* Figure Lightbox Modal */}
      {showLightbox && displayPaper.selectedFigure && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-full max-h-full flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayPaper.selectedFigure.url}
              alt={displayPaper.selectedFigure.caption}
              className="max-w-full max-h-[80vh] object-contain rounded-lg cursor-pointer"
              onClick={() => setShowLightbox(false)}
            />
            <p className="mt-4 text-sm text-slate-300 text-center max-w-2xl px-4">
              {displayPaper.selectedFigure.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
