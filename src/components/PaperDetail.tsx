"use client";

import { Paper, CATEGORY_LABELS, PaperFigure } from "@/types";
import { useEffect, useState, useRef } from "react";

interface PaperDetailProps {
  paper: Paper;
  onClose: () => void;
}

export function PaperDetail({ paper, onClose }: PaperDetailProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [displayPaper, setDisplayPaper] = useState(paper);
  const [isLoadingDeepSummary, setIsLoadingDeepSummary] = useState(false);
  const [lightboxFigure, setLightboxFigure] = useState<PaperFigure | null>(null);

  // Swipe to dismiss state (left-to-right)
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    // Auto-load deep summary when component mounts
    if (!displayPaper.deepSummary && !isLoadingDeepSummary) {
      loadDeepSummary();
    }
  }, []);

  async function loadDeepSummary() {
    if (displayPaper.deepSummary || isLoadingDeepSummary) {
      return;
    }

    setIsLoadingDeepSummary(true);
    try {
      const response = await fetch("/api/deep-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper.id }),
      });

      if (response.ok) {
        const { paper: updatedPaper } = await response.json();
        setDisplayPaper((prev) => ({ ...prev, ...updatedPaper }));
      }
    } catch (error) {
      console.error("Failed to load deep summary:", error);
    } finally {
      setIsLoadingDeepSummary(false);
    }
  }

  function getFigureByIndex(index: number): PaperFigure | undefined {
    return displayPaper.figures?.find((f) => f.index === index);
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

  // Swipe to dismiss handlers (left-to-right)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = Math.abs(currentY - touchStartY.current);

    // Only respond to horizontal swipes (more horizontal than vertical)
    // and only swipe right (positive X direction)
    if (diffX > 0 && diffX > diffY) {
      setDragX(diffX);
    }
  }

  function handleTouchEnd() {
    if (!isDragging) return;
    setIsDragging(false);
    // If dragged more than 100px to the right, close
    if (dragX > 100) {
      onClose();
    } else {
      setDragX(0);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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

            {/* Abstract */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Abstract</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {paper.abstract}
              </p>
            </div>

            {/* Deep Summary */}
            <div className="bg-gradient-to-b from-indigo-900/50 to-slate-800 rounded-xl p-4 sm:p-6 mb-6 border border-indigo-500/30">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>🔬</span> Deep Dive
                </h2>

                {isLoadingDeepSummary ? (
                  <div className="flex items-center gap-2 text-indigo-400">
                    <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full"></div>
                    <span>Analyzing paper in depth...</span>
                  </div>
                ) : displayPaper.deepSummary ? (
                  <div className="space-y-5">
                    {/* Paper Category */}
                    <div className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                      {displayPaper.deepSummary.category}
                    </div>

                    {/* Problem & Motivation */}
                    {displayPaper.deepSummary.problem && (
                      <div>
                        <h3 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                          Problem & Motivation
                        </h3>
                        <p className="text-slate-300">{displayPaper.deepSummary.problem}</p>
                      </div>
                    )}

                    {/* Core Contributions */}
                    <div>
                      <h3 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                        Core Contributions
                      </h3>
                      <ul className="space-y-2">
                        {displayPaper.deepSummary.contributions.map((contribution, i) => (
                          <li key={i} className="text-slate-200 flex items-start gap-2">
                            <span className="text-indigo-400 font-bold">{i + 1}.</span>
                            <span>{contribution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Technical Approach */}
                    {displayPaper.deepSummary.technicalApproach && (
                      <div>
                        <h3 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                          Technical Approach
                        </h3>
                        <p className="text-slate-300">{displayPaper.deepSummary.technicalApproach}</p>
                      </div>
                    )}

                    {/* Relation to Prior Work */}
                    {displayPaper.deepSummary.priorWork && (
                      <div>
                        <h3 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                          Relation to Prior Work
                        </h3>
                        <p className="text-slate-300">{displayPaper.deepSummary.priorWork}</p>
                      </div>
                    )}

                    {/* Evaluation & Results */}
                    {displayPaper.deepSummary.evaluation && (
                      <div>
                        <h3 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                          Evaluation & Results
                        </h3>
                        <p className="text-slate-300">{displayPaper.deepSummary.evaluation}</p>
                      </div>
                    )}

                    {/* Figure Analysis */}
                    {displayPaper.deepSummary.figureAnalysis?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
                          Key Figures
                        </h3>
                        <div className="space-y-4">
                          {displayPaper.deepSummary.figureAnalysis.map((figAnalysis, i) => {
                            const figure = getFigureByIndex(figAnalysis.figureIndex);
                            return (
                              <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                                {figure && (
                                  <div className="mb-3">
                                    <button
                                      onClick={() => setLightboxFigure(figure)}
                                      className="relative w-full h-48 rounded overflow-hidden bg-slate-700 cursor-zoom-in group"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={figure.url}
                                        alt={figure.caption}
                                        className="w-full h-full object-contain"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-70 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                    </button>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Figure {figure.index}: {figure.caption}
                                    </p>
                                  </div>
                                )}
                                <p className="text-sm text-slate-300 mb-1">
                                  <span className="text-indigo-400">What it shows:</span> {figAnalysis.description}
                                </p>
                                <p className="text-sm text-slate-400">
                                  <span className="text-indigo-400">Significance:</span> {figAnalysis.significance}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Strengths */}
                    {displayPaper.deepSummary.strengths?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                          Strengths
                        </h3>
                        <ul className="space-y-1">
                          {displayPaper.deepSummary.strengths.map((strength, i) => (
                            <li key={i} className="text-slate-300 flex items-start gap-2 text-sm">
                              <span className="text-green-400">+</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Limitations */}
                    {displayPaper.deepSummary.limitations?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                          Limitations & Open Questions
                        </h3>
                        <ul className="space-y-1">
                          {displayPaper.deepSummary.limitations.map((limitation, i) => (
                            <li key={i} className="text-slate-400 flex items-start gap-2 text-sm">
                              <span className="text-amber-500">-</span>
                              <span>{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Implications & Extensions */}
                    {displayPaper.deepSummary.implications && (
                      <div className="pt-3 border-t border-slate-700">
                        <h3 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                          Implications & Future Directions
                        </h3>
                        <p className="text-slate-300">{displayPaper.deepSummary.implications}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400">Failed to load deep summary.</p>
                )}
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

      {/* Figure Lightbox Modal */}
      {lightboxFigure && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxFigure(null)}
        >
          <button
            onClick={() => setLightboxFigure(null)}
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
              src={lightboxFigure.url}
              alt={lightboxFigure.caption}
              className="max-w-full max-h-[80vh] object-contain rounded-lg cursor-pointer"
              onClick={() => setLightboxFigure(null)}
            />
            <p className="mt-4 text-sm text-slate-300 text-center max-w-2xl px-4">
              Figure {lightboxFigure.index}: {lightboxFigure.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
