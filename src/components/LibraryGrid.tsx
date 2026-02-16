"use client";

import { Paper, CATEGORY_LABELS } from "@/types";

interface LibraryGridProps {
  papers: Paper[];
  viewMode: "grid" | "list";
  onPaperClick: (paper: Paper) => void;
  isLoading?: boolean;
}

export function LibraryGrid({
  papers,
  viewMode,
  onPaperClick,
  isLoading = false,
}: LibraryGridProps) {
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

  if (isLoading) {
    return (
      <div className="p-4">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800 rounded-lg overflow-hidden animate-pulse"
              >
                <div className="h-40 bg-slate-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-slate-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800 rounded-lg p-4 flex gap-4 animate-pulse"
              >
                <div className="w-32 h-24 bg-slate-700 rounded flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-slate-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <svg
          className="w-20 h-20 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="text-lg font-medium mb-1">No saved papers</h3>
        <p className="text-sm">Papers you save will appear here</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper) => (
            <button
              key={paper.id}
              onClick={() => onPaperClick(paper)}
              className="bg-slate-800 rounded-lg overflow-hidden hover:bg-slate-700 transition-all hover:scale-[1.02] text-left group"
            >
              {/* Figure */}
              {paper.selectedFigure ? (
                <div className="relative h-40 bg-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paper.selectedFigure.url}
                    alt={paper.selectedFigure.caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                </div>
              ) : (
                <div className="h-40 bg-slate-700 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {/* Categories */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {paper.categories.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300 rounded"
                    >
                      {getCategoryLabel(cat)}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {paper.title}
                </h3>

                {/* Authors */}
                <p className="text-xs text-slate-400 mb-2 line-clamp-1">
                  {paper.authors.slice(0, 2).join(", ")}
                  {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
                </p>

                {/* Hook or abstract preview */}
                {paper.hook && (
                  <p className="text-sm text-slate-300 mb-2 line-clamp-2">
                    {paper.hook}
                  </p>
                )}

                {/* Date */}
                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
                  <span>Published {formatDate(paper.publishedDate)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-4">
      <div className="space-y-3">
        {papers.map((paper) => (
          <button
            key={paper.id}
            onClick={() => onPaperClick(paper)}
            className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-all w-full text-left group flex gap-4"
          >
            {/* Figure */}
            {paper.selectedFigure ? (
              <div className="relative w-32 h-24 bg-slate-700 rounded flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={paper.selectedFigure.url}
                  alt={paper.selectedFigure.caption}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            ) : (
              <div className="w-32 h-24 bg-slate-700 rounded flex-shrink-0 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Categories */}
              <div className="flex flex-wrap gap-1 mb-2">
                {paper.categories.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300 rounded"
                  >
                    {getCategoryLabel(cat)}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
                {paper.title}
              </h3>

              {/* Authors */}
              <p className="text-xs text-slate-400 mb-2 line-clamp-1">
                {paper.authors.slice(0, 3).join(", ")}
                {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
              </p>

              {/* Hook or abstract preview */}
              {paper.hook ? (
                <p className="text-sm text-slate-300 line-clamp-2">
                  {paper.hook}
                </p>
              ) : (
                <p className="text-sm text-slate-400 line-clamp-2">
                  {paper.abstract}
                </p>
              )}

              {/* Date */}
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span>Published {formatDate(paper.publishedDate)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
