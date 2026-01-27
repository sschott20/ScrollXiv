import { NextRequest, NextResponse } from "next/server";
import { summarizePaper, isAIConfigured } from "@/services/ai";
import { getPaperById, updatePaperSummary } from "@/services/papers";

export async function POST(request: NextRequest) {
  try {
    const { paperId } = await request.json();

    if (!paperId) {
      return NextResponse.json(
        { error: "Paper ID is required" },
        { status: 400 }
      );
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: "AI provider is not configured" },
        { status: 503 }
      );
    }

    const paper = await getPaperById(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Check if already summarized
    if (paper.hook && paper.summary) {
      return NextResponse.json({ paper, cached: true });
    }

    // Generate summary
    const summary = await summarizePaper({
      arxivId: paper.arxivId,
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract,
      categories: paper.categories,
      publishedDate: paper.publishedDate,
      pdfUrl: paper.pdfUrl,
    });

    // Update paper with summary
    const updatedPaper = await updatePaperSummary(paperId, summary);

    return NextResponse.json({ paper: updatedPaper, cached: false });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      { error: "Failed to summarize paper" },
      { status: 500 }
    );
  }
}
