import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Paper as PrismaPaper } from "@prisma/client";
import { Paper, PaperFigure, SelectedFigure, DeepSummary } from "@/types";

function toPaper(dbPaper: PrismaPaper): Paper {
  return {
    id: dbPaper.id,
    arxivId: dbPaper.arxivId,
    title: dbPaper.title,
    authors: JSON.parse(dbPaper.authors) as string[],
    abstract: dbPaper.abstract,
    categories: JSON.parse(dbPaper.categories) as string[],
    publishedDate: dbPaper.publishedDate,
    pdfUrl: dbPaper.pdfUrl,
    hook: dbPaper.hook,
    keyConcepts: dbPaper.keyConcepts
      ? (JSON.parse(dbPaper.keyConcepts) as string[])
      : null,
    summary: dbPaper.summary,
    whyMatters: dbPaper.whyMatters,
    deepSummary: dbPaper.deepSummary
      ? (JSON.parse(dbPaper.deepSummary) as DeepSummary)
      : null,
    figures: dbPaper.figures
      ? (JSON.parse(dbPaper.figures) as PaperFigure[])
      : null,
    selectedFigure: dbPaper.selectedFigure
      ? (JSON.parse(dbPaper.selectedFigure) as SelectedFigure)
      : null,
    figuresError: dbPaper.figuresError,
    createdAt: dbPaper.createdAt,
    updatedAt: dbPaper.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "dateSaved";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    // Search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { abstract: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category) {
      whereClause.categories = {
        contains: category,
      };
    }

    // Build orderBy clause
    let orderBy: any;
    switch (sort) {
      case "dateSaved":
        orderBy = { createdAt: "desc" };
        break;
      case "datePublished":
        orderBy = { publishedDate: "desc" };
        break;
      case "title":
        orderBy = { title: "asc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    // Build the where clause for savedPaper with nested paper filter
    const savedPaperWhereClause: any = {};
    if (Object.keys(whereClause).length > 0) {
      savedPaperWhereClause.paper = whereClause;
    }

    // Get saved papers with pagination
    const [savedPapers, totalCount] = await Promise.all([
      prisma.savedPaper.findMany({
        where: savedPaperWhereClause,
        include: {
          paper: true,
        },
        orderBy:
          sort === "dateSaved"
            ? { createdAt: "desc" }
            : undefined,
        take: limit,
        skip,
      }),
      prisma.savedPaper.count({
        where: savedPaperWhereClause,
      }),
    ]);

    // Map to papers with savedAt
    const papers = savedPapers.map((sp) => ({
      ...toPaper(sp.paper),
      savedAt: sp.createdAt,
    }));

    // Sort papers if not sorted by dateSaved (which is handled by Prisma)
    if (sort !== "dateSaved") {
      papers.sort((a, b) => {
        switch (sort) {
          case "datePublished":
            return b.publishedDate.getTime() - a.publishedDate.getTime();
          case "title":
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
    }

    // Get category counts
    const allSavedPapers = await prisma.savedPaper.findMany({
      include: { paper: true },
    });

    const categoryCounts: Record<string, number> = {};
    allSavedPapers.forEach((sp) => {
      const cats = JSON.parse(sp.paper.categories) as string[];
      cats.forEach((cat) => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });

    return NextResponse.json({
      papers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + papers.length < totalCount,
      },
      counts: {
        total: totalCount,
        byCategory: categoryCounts,
      },
    });
  } catch (error) {
    console.error("Library error:", error);
    return NextResponse.json(
      { error: "Failed to fetch library" },
      { status: 500 }
    );
  }
}
