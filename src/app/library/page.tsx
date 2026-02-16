"use client";

import { useEffect, useState, useCallback } from "react";
import { LibraryGrid } from "@/components/LibraryGrid";
import { PaperDetail } from "@/components/PaperDetail";
import { Paper, CATEGORY_LABELS } from "@/types";
import Link from "next/link";

type ViewMode = "grid" | "list";
type SortOption = "dateSaved" | "datePublished" | "title";

interface LibraryResponse {
  papers: Paper[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  counts: {
    total: number;
    byCategory: Record<string, number>;
  };
}

export default function LibraryPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("dateSaved");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const [counts, setCounts] = useState<LibraryResponse["counts"]>({
    total: 0,
    byCategory: {},
  });
  const [pagination, setPagination] = useState<LibraryResponse["pagination"]>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });

  const loadLibrary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        sort: sortBy,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(`/api/library?${params}`);
      if (!response.ok) {
        throw new Error("Failed to load library");
      }

      const data: LibraryResponse = await response.json();
      setPapers(data.papers);
      setPagination(data.pagination);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, searchQuery, selectedCategory, pagination.page, pagination.limit]);

  useEffect(() => {
    loadLibrary();
  }, [sortBy, selectedCategory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        setPagination((prev) => ({ ...prev, page: 1 }));
        loadLibrary();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
  }

  function handleCategoryFilter(category: string) {
    setSelectedCategory(category === selectedCategory ? "" : category);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  function handlePaperClick(paper: Paper) {
    setSelectedPaper(paper);
  }

  function handleClosePaper() {
    setSelectedPaper(null);
    // Refresh library in case paper was unsaved
    loadLibrary();
  }

  const topCategories = Object.entries(counts.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (error) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-slate-400 mb-4 text-center">{error}</p>
        <button
          onClick={loadLibrary}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-900 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Library</h1>
                <p className="text-xs text-slate-400">
                  {counts.total} saved {counts.total === 1 ? "paper" : "papers"}
                </p>
              </div>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Grid view"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                title="List view"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="px-4 pb-4 space-y-3">
            {/* Search bar */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search saved papers..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
              />
            </div>

            {/* Sort and filter buttons */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="dateSaved">Date Saved</option>
                <option value="datePublished">Date Published</option>
                <option value="title">Title</option>
              </select>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                  showFilters || selectedCategory
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filters
                {selectedCategory && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-500 rounded text-xs">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Category filters */}
            {showFilters && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700">
                {topCategories.map(([category, count]) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryFilter(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {CATEGORY_LABELS[category] || category} ({count})
                  </button>
                ))}
                {selectedCategory && (
                  <button
                    onClick={() => handleCategoryFilter("")}
                    className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Papers grid/list */}
      <div className="max-w-7xl mx-auto">
        <LibraryGrid
          papers={papers}
          viewMode={viewMode}
          onPaperClick={handlePaperClick}
          isLoading={isLoading}
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-center gap-2">
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            Previous
          </button>
          <span className="text-slate-400 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={!pagination.hasMore}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Paper detail modal */}
      {selectedPaper && (
        <PaperDetail paper={selectedPaper} onClose={handleClosePaper} />
      )}

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-700">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs">Home</span>
          </Link>

          <Link
            href="/library"
            className="flex flex-col items-center gap-1 text-blue-400 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-xs">Library</span>
          </Link>

          <a
            href="https://arxiv.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
    </main>
  );
}
