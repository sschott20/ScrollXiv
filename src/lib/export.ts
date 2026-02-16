import { Paper } from "@/types";
import Papa from "papaparse";

export interface ExportMetadata {
  exportDate: string;
  version: string;
  totalPapers: number;
}

export interface JSONExport {
  metadata: ExportMetadata;
  papers: Paper[];
}

/**
 * Export papers to JSON format with full data and metadata
 */
export function exportToJSON(papers: Paper[]): string {
  const exportData: JSONExport = {
    metadata: {
      exportDate: new Date().toISOString(),
      version: "1.0",
      totalPapers: papers.length,
    },
    papers: papers.map((paper) => ({
      ...paper,
      publishedDate: paper.publishedDate.toISOString(),
      createdAt: paper.createdAt.toISOString(),
      updatedAt: paper.updatedAt.toISOString(),
    })) as any,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export papers to CSV format with metadata only
 */
export function exportToCSV(papers: Paper[]): string {
  const csvData = papers.map((paper) => ({
    title: paper.title,
    authors: paper.authors.join("; "),
    arxivId: paper.arxivId,
    categories: paper.categories.join("; "),
    publishedDate: paper.publishedDate.toISOString().split("T")[0],
    pdfUrl: paper.pdfUrl,
    abstract: paper.abstract.replace(/\n/g, " "),
  }));

  return Papa.unparse(csvData);
}

/**
 * Export papers to BibTeX format for citations
 */
export function exportToBibTeX(papers: Paper[]): string {
  return papers
    .map((paper) => {
      const year = paper.publishedDate.getFullYear();
      const authors = paper.authors.join(" and ");
      const key = `${paper.authors[0]?.split(" ").pop() || "Unknown"}${year}`;

      return `@article{${key},
  title = {${paper.title}},
  author = {${authors}},
  year = {${year}},
  journal = {arXiv preprint arXiv:${paper.arxivId}},
  url = {https://arxiv.org/abs/${paper.arxivId}},
  abstract = {${paper.abstract.replace(/\n/g, " ")}}
}`;
    })
    .join("\n\n");
}

/**
 * Export papers to Markdown format as a reading list
 */
export function exportToMarkdown(papers: Paper[]): string {
  const lines: string[] = [
    "# ScrollXiv Reading List",
    "",
    `Generated on ${new Date().toLocaleDateString()}`,
    "",
    `Total papers: ${papers.length}`,
    "",
  ];

  // Group by category
  const papersByCategory: Record<string, Paper[]> = {};
  papers.forEach((paper) => {
    paper.categories.forEach((cat) => {
      if (!papersByCategory[cat]) {
        papersByCategory[cat] = [];
      }
      if (!papersByCategory[cat].includes(paper)) {
        papersByCategory[cat].push(paper);
      }
    });
  });

  Object.entries(papersByCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([category, categoryPapers]) => {
      lines.push(`## ${category} (${categoryPapers.length})`);
      lines.push("");

      categoryPapers.forEach((paper) => {
        lines.push(`### [${paper.title}](https://arxiv.org/abs/${paper.arxivId})`);
        lines.push("");
        lines.push(`**Authors:** ${paper.authors.join(", ")}`);
        lines.push("");
        lines.push(`**Published:** ${paper.publishedDate.toLocaleDateString()}`);
        lines.push("");

        if (paper.hook) {
          lines.push(`**Hook:** ${paper.hook}`);
          lines.push("");
        }

        if (paper.summary) {
          lines.push(`**Summary:** ${paper.summary}`);
          lines.push("");
        }

        lines.push(`[PDF](${paper.pdfUrl}) | [arXiv](https://arxiv.org/abs/${paper.arxivId})`);
        lines.push("");
        lines.push("---");
        lines.push("");
      });
    });

  return lines.join("\n");
}

/**
 * Get filename for export with timestamp
 */
export function getExportFilename(format: string): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `scrollxiv-export-${timestamp}.${format}`;
}

/**
 * Trigger browser download of exported data
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
