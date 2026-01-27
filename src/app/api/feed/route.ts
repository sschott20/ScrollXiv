import { NextRequest, NextResponse } from "next/server";
import { fetchFromArxiv } from "@/services/arxiv";
import { upsertPapers, getFeedPapers } from "@/services/papers";
import { DEFAULT_CATEGORIES } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor") || undefined;
    const refresh = searchParams.get("refresh") === "true";
    const categories = searchParams.get("categories")?.split(",") || DEFAULT_CATEGORIES;

    // If refresh is requested or no cursor (initial load), fetch from arXiv
    if (refresh || !cursor) {
      const { papers: arxivPapers } = await fetchFromArxiv(
        categories,
        20,
        0,
        "submittedDate"
      );

      // Store in database
      await upsertPapers(arxivPapers);
    }

    // Get papers from database
    const { papers, nextCursor } = await getFeedPapers(cursor, 10);

    return NextResponse.json({
      papers,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
