import { parseStringPromise } from "xml2js";
import { ArxivPaper, DEFAULT_CATEGORIES } from "@/types";

const ARXIV_API_BASE = "http://export.arxiv.org/api/query";

interface ArxivEntry {
  id: string[];
  title: string[];
  summary: string[];
  author: Array<{ name: string[] }>;
  published: string[];
  category: Array<{ $: { term: string } }>;
  link: Array<{ $: { href: string; title?: string } }>;
}

interface ArxivResponse {
  feed: {
    entry?: ArxivEntry[];
    "opensearch:totalResults"?: string[];
  };
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractArxivId(url: string): string {
  const match = url.match(/abs\/(.+)$/);
  return match ? match[1] : url;
}

function parseEntry(entry: ArxivEntry): ArxivPaper {
  const id = entry.id[0];
  const arxivId = extractArxivId(id);

  const pdfLink = entry.link.find((l) => l.$.title === "pdf");
  const pdfUrl = pdfLink ? pdfLink.$.href : `https://arxiv.org/pdf/${arxivId}`;

  return {
    arxivId,
    title: cleanText(entry.title[0]),
    authors: entry.author.map((a) => a.name[0]),
    abstract: cleanText(entry.summary[0]),
    categories: entry.category.map((c) => c.$.term),
    publishedDate: new Date(entry.published[0]),
    pdfUrl,
  };
}

export async function fetchFromArxiv(
  categories: string[] = DEFAULT_CATEGORIES,
  maxResults: number = 20,
  start: number = 0,
  sortBy: "submittedDate" | "relevance" = "submittedDate"
): Promise<{ papers: ArxivPaper[]; total: number }> {
  const categoryQuery = categories.map((cat) => `cat:${cat}`).join("+OR+");
  const searchQuery = `(${categoryQuery})`;

  const params = new URLSearchParams({
    search_query: searchQuery,
    start: start.toString(),
    max_results: maxResults.toString(),
    sortBy: sortBy,
    sortOrder: "descending",
  });

  const response = await fetch(`${ARXIV_API_BASE}?${params}`);
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status}`);
  }

  const xml = await response.text();
  const result = (await parseStringPromise(xml)) as ArxivResponse;

  const entries = result.feed.entry || [];
  const total = parseInt(result.feed["opensearch:totalResults"]?.[0] || "0");

  return {
    papers: entries.map(parseEntry),
    total,
  };
}

export async function searchArxiv(
  query: string,
  categories?: string[],
  maxResults: number = 20,
  sortBy: "submittedDate" | "relevance" = "relevance"
): Promise<{ papers: ArxivPaper[]; total: number }> {
  let searchQuery = `all:${query.replace(/\s+/g, "+")}`;

  if (categories && categories.length > 0) {
    const categoryQuery = categories.map((cat) => `cat:${cat}`).join("+OR+");
    searchQuery = `(${searchQuery})+AND+(${categoryQuery})`;
  }

  const params = new URLSearchParams({
    search_query: searchQuery,
    start: "0",
    max_results: maxResults.toString(),
    sortBy: sortBy,
    sortOrder: "descending",
  });

  const response = await fetch(`${ARXIV_API_BASE}?${params}`);
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status}`);
  }

  const xml = await response.text();
  const result = (await parseStringPromise(xml)) as ArxivResponse;

  const entries = result.feed.entry || [];
  const total = parseInt(result.feed["opensearch:totalResults"]?.[0] || "0");

  return {
    papers: entries.map(parseEntry),
    total,
  };
}

export async function fetchPaperById(
  arxivId: string
): Promise<ArxivPaper | null> {
  const params = new URLSearchParams({
    id_list: arxivId,
  });

  const response = await fetch(`${ARXIV_API_BASE}?${params}`);
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status}`);
  }

  const xml = await response.text();
  const result = (await parseStringPromise(xml)) as ArxivResponse;

  const entries = result.feed.entry || [];
  if (entries.length === 0) {
    return null;
  }

  return parseEntry(entries[0]);
}
