import { NextRequest, NextResponse } from "next/server";
import { parseArxivIds, parseBibTeX, importFromJSON, deduplicatePapers } from "@/lib/import";
import { fetchPaperById } from "@/services/arxiv";
import { upsertPapers, savePaper } from "@/services/papers";
import { ArxivPaper } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, saveToLibrary = true } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing type or data" },
        { status: 400 }
      );
    }

    let papersToImport: ArxivPaper[] = [];

    switch (type) {
      case "arxiv": {
        // Parse arXiv IDs from text or array
        const ids = Array.isArray(data) ? data : parseArxivIds(data);

        if (ids.length === 0) {
          return NextResponse.json(
            { error: "No valid arXiv IDs found" },
            { status: 400 }
          );
        }

        // Fetch papers from arXiv API
        const papers = await Promise.all(
          ids.map(async (id) => {
            try {
              return await fetchPaperById(id);
            } catch (error) {
              console.error(`Error fetching paper ${id}:`, error);
              return null;
            }
          })
        );

        papersToImport = papers.filter((p): p is ArxivPaper => p !== null);
        break;
      }

      case "bibtex": {
        // Parse BibTeX and extract arXiv IDs
        const ids = parseBibTeX(data);

        if (ids.length === 0) {
          return NextResponse.json(
            { error: "No arXiv IDs found in BibTeX" },
            { status: 400 }
          );
        }

        // Fetch papers from arXiv API
        const papers = await Promise.all(
          ids.map(async (id) => {
            try {
              return await fetchPaperById(id);
            } catch (error) {
              console.error(`Error fetching paper ${id}:`, error);
              return null;
            }
          })
        );

        papersToImport = papers.filter((p): p is ArxivPaper => p !== null);
        break;
      }

      case "json": {
        // Import from JSON backup
        try {
          const importedPapers = importFromJSON(data);

          // Convert to ArxivPaper format for upsert
          papersToImport = importedPapers.map((p) => ({
            arxivId: p.arxivId,
            title: p.title,
            authors: p.authors,
            abstract: p.abstract,
            categories: p.categories,
            publishedDate: p.publishedDate,
            pdfUrl: p.pdfUrl,
          }));
        } catch (error) {
          return NextResponse.json(
            { error: error instanceof Error ? error.message : "Invalid JSON format" },
            { status: 400 }
          );
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid import type. Use: arxiv, bibtex, or json" },
          { status: 400 }
        );
    }

    if (papersToImport.length === 0) {
      return NextResponse.json(
        { error: "No papers could be imported" },
        { status: 400 }
      );
    }

    // Deduplicate papers
    const uniquePapers = deduplicatePapers(papersToImport);

    // Upsert papers into database
    const insertedPapers = await upsertPapers(uniquePapers);

    // Optionally save to library
    if (saveToLibrary) {
      await Promise.all(
        insertedPapers.map((paper) => savePaper(paper.id).catch((err) => {
          console.error(`Error saving paper ${paper.id}:`, err);
        }))
      );
    }

    return NextResponse.json({
      success: true,
      count: insertedPapers.length,
      papers: insertedPapers,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import papers" },
      { status: 500 }
    );
  }
}
