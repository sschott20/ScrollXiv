import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Paper } from "@/types";
import { exportToJSON, exportToCSV, exportToBibTeX, exportToMarkdown, getExportFilename } from "@/lib/export";

function toPaper(dbPaper: any): Paper {
  return {
    id: dbPaper.id,
    arxivId: dbPaper.arxivId,
    title: dbPaper.title,
    authors: JSON.parse(dbPaper.authors),
    abstract: dbPaper.abstract,
    categories: JSON.parse(dbPaper.categories),
    publishedDate: new Date(dbPaper.publishedDate),
    pdfUrl: dbPaper.pdfUrl,
    hook: dbPaper.hook,
    keyConcepts: dbPaper.keyConcepts ? JSON.parse(dbPaper.keyConcepts) : null,
    summary: dbPaper.summary,
    whyMatters: dbPaper.whyMatters,
    deepSummary: dbPaper.deepSummary ? JSON.parse(dbPaper.deepSummary) : null,
    figures: dbPaper.figures ? JSON.parse(dbPaper.figures) : null,
    selectedFigure: dbPaper.selectedFigure ? JSON.parse(dbPaper.selectedFigure) : null,
    figuresError: dbPaper.figuresError,
    createdAt: new Date(dbPaper.createdAt),
    updatedAt: new Date(dbPaper.updatedAt),
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";
    const collectionId = searchParams.get("collection");
    const tagId = searchParams.get("tag");

    // Build where clause for filtering
    const whereClause: any = {};

    // Get saved papers with optional filters
    let paperWhere: any = {};

    // Filter by collection
    if (collectionId) {
      paperWhere.collections = {
        some: {
          collectionId: collectionId,
        },
      };
    }

    // Filter by tag
    if (tagId) {
      paperWhere.tags = {
        some: {
          tagId: tagId,
        },
      };
    }

    const savedPapers = await prisma.savedPaper.findMany({
      where: Object.keys(paperWhere).length > 0 ? { paper: paperWhere } : {},
      include: {
        paper: true,
      },
    });
    const papers = savedPapers.map((sp: any) => toPaper(sp.paper));

    if (papers.length === 0) {
      return NextResponse.json(
        { error: "No papers found to export" },
        { status: 404 }
      );
    }

    // Generate export based on format
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case "csv":
        content = exportToCSV(papers);
        mimeType = "text/csv";
        extension = "csv";
        break;
      case "bibtex":
        content = exportToBibTeX(papers);
        mimeType = "text/plain";
        extension = "bib";
        break;
      case "markdown":
        content = exportToMarkdown(papers);
        mimeType = "text/markdown";
        extension = "md";
        break;
      case "json":
      default:
        content = exportToJSON(papers);
        mimeType = "application/json";
        extension = "json";
        break;
    }

    const filename = getExportFilename(extension);

    // Return file as download
    return new NextResponse(content, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export papers" },
      { status: 500 }
    );
  }
}
