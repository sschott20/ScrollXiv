"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Paper } from "@/types";
import { PaperCard } from "./PaperCard";
import { triggerHaptic } from "@/lib/haptics";

interface ScrollFeedProps {
  initialPapers: Paper[];
  onExpandPaper: (paper: Paper) => void;
}

export function ScrollFeed({ initialPapers, onExpandPaper }: ScrollFeedProps) {
  const [papers, setPapers] = useState<Paper[]>(initialPapers);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const touchStartScrollTop = useRef(0);
  const PULL_THRESHOLD = 80;

  // Reset feed when initialPapers changes (e.g., Home button refresh)
  useEffect(() => {
    setPapers(initialPapers);
    setCursor(undefined);
    setHasMore(true);
    setActiveIndex(0);
  }, [initialPapers]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(`/api/feed?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Deduplicate papers by id when appending
        setPapers((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPapers = data.papers.filter((p: Paper) => !existingIds.has(p.id));
          return [...prev, ...newPapers];
        });
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to load more papers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, hasMore, isLoading]);

  // Set up intersection observer for active card detection
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = parseInt(entry.target.getAttribute("data-index") || "0");
            setActiveIndex(index);
          }
        });
      },
      {
        threshold: 0.5,
        root: containerRef.current,
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Observe card refs
  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;

    cardRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      cardRefs.current.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, [papers]);

  // Load more when near the end
  useEffect(() => {
    if (activeIndex >= papers.length - 3 && hasMore && !isLoading) {
      loadMore();
    }
  }, [activeIndex, papers.length, hasMore, isLoading, loadMore]);

  const setCardRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(index, el);
    } else {
      cardRefs.current.delete(index);
    }
  }, []);

  const handleDiscard = useCallback((paper: Paper) => {
    setPapers((prev) => prev.filter((p) => p.id !== paper.id));
  }, []);

  // Pull to refresh functionality
  const refreshFeed = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    triggerHaptic('medium');

    try {
      const response = await fetch('/api/feed');
      if (response.ok) {
        const data = await response.json();
        setPapers(data.papers);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
        setActiveIndex(0);
        triggerHaptic('success');
      }
    } catch (error) {
      console.error('Failed to refresh feed:', error);
      triggerHaptic('error');
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [isRefreshing]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    touchStartY.current = e.touches[0].clientY;
    touchStartScrollTop.current = container.scrollTop;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Only allow pull to refresh when at the top of the scroll
    if (touchStartScrollTop.current === 0 && deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, PULL_THRESHOLD * 1.5);
      setPullDistance(distance);
    }
  }, [isRefreshing, PULL_THRESHOLD]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD) {
      refreshFeed();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, PULL_THRESHOLD, refreshFeed]);

  // Add touch event listeners for pull to refresh
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (papers.length === 0) {
    return (
      <div className="h-dvh flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading papers...</p>
        </div>
      </div>
    );
  }

  // Calculate pull indicator properties
  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const spinnerRotation = pullProgress * 360;

  return (
    <div className="relative h-dvh">
      {/* Pull to refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center transition-opacity"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div
          className="text-blue-400 transition-transform"
          style={{
            transform: `rotate(${spinnerRotation}deg) scale(${0.5 + pullProgress * 0.5})`,
          }}
        >
          {isRefreshing ? (
            <div className="animate-spin h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-dvh overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{
          transform: isRefreshing ? `translateY(${PULL_THRESHOLD}px)` : `translateY(${pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {papers.map((paper, index) => (
        <div
          key={paper.id}
          data-index={index}
          ref={(el) => setCardRef(index, el)}
        >
          <PaperCard
            paper={paper}
            onExpand={onExpandPaper}
            onDiscard={handleDiscard}
            isActive={index === activeIndex}
            shouldPrefetch={index > activeIndex && index <= activeIndex + 2}
          />
        </div>
      ))}

        {isLoading && (
          <div className="h-dvh flex items-center justify-center bg-slate-900">
            <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}
