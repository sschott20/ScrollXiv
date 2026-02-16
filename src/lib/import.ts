import { Paper, ArxivPaper } from "@/types";
import { JSONExport } from "./export";

/**
 * Parse arXiv IDs from various input formats
 */
export function parseArxivIds(input: string): string[] {
  const ids: string[] = [];

  // Match arXiv IDs in various formats:
  // - 2301.12345
  // - arXiv:2301.12345
  // - https://arxiv.org/abs/2301.12345
  // - https://arxiv.org/pdf/2301.12345.pdf
  const patterns = [
    /\b(\d{4}\.\d{4,5}(?:v\d+)?)\b/g,
    /arxiv:(\d{4}\.\d{4,5}(?:v\d+)?)/gi,
    /arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/gi,
  ];

  patterns.forEach((pattern) => {
    const matches = input.matchAll(pattern);
    for (const match of matches) {
      const id = match[1];
      if (id && !ids.includes(id)) {
        ids.push(id);
      }
    }
  });

  return ids;
}

/**
 * Import papers from arXiv IDs
 */
export async function importFromArxivIds(ids: string[]): Promise<ArxivPaper[]> {
  const papers: ArxivPaper[] = [];

  // Fetch papers in batches to avoid overloading the API
  const batchSize = 10;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const idList = batch.join(",");

    try {
      const response = await fetch(`/api/papers/fetch?ids=${encodeURIComponent(idList)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch papers: ${response.statusText}`);
      }

      const data = await response.json();
      papers.push(...data.papers);
    } catch (error) {
      console.error(`Error fetching batch ${i / batchSize + 1}:`, error);
      throw error;
    }
  }

  return papers;
}

/**
 * Parse BibTeX entries and extract arXiv IDs
 */
export function parseBibTeX(bibtex: string): string[] {
  const ids: string[] = [];

  // Extract arXiv IDs from various BibTeX fields
  // Common patterns: journal={arXiv preprint arXiv:2301.12345}, eprint={2301.12345}, url={https://arxiv.org/abs/2301.12345}
  const patterns = [
    /journal\s*=\s*\{[^}]*arXiv:(\d{4}\.\d{4,5}(?:v\d+)?)/gi,
    /eprint\s*=\s*\{(\d{4}\.\d{4,5}(?:v\d+)?)\}/gi,
    /url\s*=\s*\{[^}]*arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/gi,
    /archivePrefix\s*=\s*\{arXiv\}\s*,\s*eprint\s*=\s*\{(\d{4}\.\d{4,5}(?:v\d+)?)\}/gi,
  ];

  patterns.forEach((pattern) => {
    const matches = bibtex.matchAll(pattern);
    for (const match of matches) {
      const id = match[1];
      if (id && !ids.includes(id)) {
        ids.push(id);
      }
    }
  });

  return ids;
}

/**
 * Import papers from BibTeX and fetch from arXiv
 */
export async function importFromBibTeX(bibtex: string): Promise<ArxivPaper[]> {
  const ids = parseBibTeX(bibtex);
  if (ids.length === 0) {
    throw new Error("No arXiv IDs found in BibTeX");
  }
  return importFromArxivIds(ids);
}

/**
 * Import papers from JSON backup
 */
export function importFromJSON(json: string): Paper[] {
  try {
    const data = JSON.parse(json) as JSONExport;

    if (!data.papers || !Array.isArray(data.papers)) {
      throw new Error("Invalid JSON format: missing papers array");
    }

    // Restore Date objects
    return data.papers.map((paper) => ({
      ...paper,
      publishedDate: new Date(paper.publishedDate),
      createdAt: new Date(paper.createdAt),
      updatedAt: new Date(paper.updatedAt),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
    throw new Error("Failed to parse JSON");
  }
}

/**
 * Validate paper data before import
 */
export function validatePaper(paper: Partial<Paper>): boolean {
  return !!(
    paper.arxivId &&
    paper.title &&
    paper.authors &&
    paper.authors.length > 0 &&
    paper.abstract &&
    paper.categories &&
    paper.categories.length > 0 &&
    paper.pdfUrl
  );
}

/**
 * Deduplicate papers by arXiv ID
 */
export function deduplicatePapers(papers: ArxivPaper[]): ArxivPaper[] {
  const seen = new Set<string>();
  return papers.filter((paper) => {
    if (seen.has(paper.arxivId)) {
      return false;
    }
    seen.add(paper.arxivId);
    return true;
  });
}
