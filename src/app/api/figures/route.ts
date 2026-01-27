import { NextRequest, NextResponse } from "next/server";
import { extractFiguresFromAr5iv } from "@/services/figures";
import { selectBestFigure, isAIConfigured } from "@/services/ai";
import { getPaperById, updatePaperFigures } from "@/services/papers";

export async function POST(request: NextRequest) {
  try {
    const { paperId } = await request.json();

    if (!paperId) {
      return NextResponse.json(
        { error: "Paper ID is required" },
        { status: 400 }
      );
    }

    const paper = await getPaperById(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Check if already processed
    if (paper.figures !== null || paper.figuresError !== null) {
      return NextResponse.json({
        paper,
        cached: true,
      });
    }

    // Extract figures from ar5iv
    const { figures, error } = await extractFiguresFromAr5iv(paper.arxivId);

    if (error) {
      const updatedPaper = await updatePaperFigures(paper.id, [], null, error);
      return NextResponse.json({ paper: updatedPaper, error });
    }

    // If we have figures and AI is configured, select the best one
    let selectedFigure = null;
    if (figures.length > 0 && isAIConfigured()) {
      try {
        selectedFigure = await selectBestFigure(
          {
            arxivId: paper.arxivId,
            title: paper.title,
            authors: paper.authors,
            abstract: paper.abstract,
            categories: paper.categories,
            publishedDate: paper.publishedDate,
            pdfUrl: paper.pdfUrl,
          },
          figures
        );
      } catch (aiError) {
        console.error("AI figure selection failed:", aiError);
        // Fall back to first figure
        selectedFigure = figures[0]
          ? { ...figures[0], reason: "First figure" }
          : null;
      }
    } else if (figures.length > 0) {
      // No AI configured, use first figure
      selectedFigure = { ...figures[0], reason: "First figure" };
    }

    const updatedPaper = await updatePaperFigures(
      paper.id,
      figures,
      selectedFigure
    );

    return NextResponse.json({ paper: updatedPaper, cached: false });
  } catch (error) {
    console.error("Figures error:", error);
    return NextResponse.json(
      { error: "Failed to extract figures" },
      { status: 500 }
    );
  }
}
