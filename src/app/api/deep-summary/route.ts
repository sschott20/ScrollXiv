import { NextRequest, NextResponse } from "next/server";
import { generateDeepSummary, isAIConfigured } from "@/services/ai";
import { getPaperById, updatePaperDeepSummary } from "@/services/papers";

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
        { error: "AI is not configured" },
        { status: 503 }
      );
    }

    const paper = await getPaperById(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Return cached deep summary if available
    if (paper.deepSummary) {
      return NextResponse.json({
        paper,
        cached: true,
      });
    }

    // Generate deep summary
    const deepSummary = await generateDeepSummary(
      {
        arxivId: paper.arxivId,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        categories: paper.categories,
        publishedDate: paper.publishedDate,
        pdfUrl: paper.pdfUrl,
      },
      paper.figures || []
    );

    const updatedPaper = await updatePaperDeepSummary(paper.id, deepSummary);

    return NextResponse.json({ paper: updatedPaper, cached: false });
  } catch (error) {
    console.error("Deep summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate deep summary" },
      { status: 500 }
    );
  }
}
