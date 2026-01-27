"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Paper } from "@/types";
import { PaperCard } from "./PaperCard";

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

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(`/api/feed?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPapers((prev) => [...prev, ...data.papers]);
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

  return (
    <div
      ref={containerRef}
      className="h-dvh overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
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
            isActive={index === activeIndex}
          />
        </div>
      ))}

      {isLoading && (
        <div className="h-dvh flex items-center justify-center bg-slate-900">
          <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
}
