import { NextRequest, NextResponse } from "next/server";
import { searchArxiv } from "@/services/arxiv";
import { interpretSearch, isAIConfigured } from "@/services/ai";
import { upsertPapers } from "@/services/papers";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    let searchQuery = query;
    let categories: string[] | undefined;
    let sortBy: "relevance" | "submittedDate" = "relevance";
    let explanation: string | undefined;

    // Use AI to interpret the search if configured
    if (isAIConfigured()) {
      try {
        const interpreted = await interpretSearch(query);
        searchQuery = interpreted.searchQuery;
        categories = interpreted.categories;
        sortBy = interpreted.sortBy;
        explanation = interpreted.explanation;
      } catch (aiError) {
        console.warn("AI interpretation failed, using direct search:", aiError);
      }
    }

    // Search arXiv
    const { papers: arxivPapers, total } = await searchArxiv(
      searchQuery,
      categories,
      20,
      sortBy
    );

    // Store in database
    const papers = await upsertPapers(arxivPapers);

    return NextResponse.json({
      papers,
      total,
      interpretation: explanation
        ? {
            query: searchQuery,
            categories,
            sortBy,
            explanation,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search papers" },
      { status: 500 }
    );
  }
}
