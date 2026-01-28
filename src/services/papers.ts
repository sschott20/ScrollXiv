import { prisma } from "@/lib/prisma";
import { Paper as PrismaPaper } from "@prisma/client";
import { ArxivPaper, Paper, PaperSummary, PaperFigure, SelectedFigure, DeepSummary } from "@/types";

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

export async function upsertPaper(arxivPaper: ArxivPaper): Promise<Paper> {
  const dbPaper = await prisma.paper.upsert({
    where: { arxivId: arxivPaper.arxivId },
    update: {
      title: arxivPaper.title,
      authors: JSON.stringify(arxivPaper.authors),
      abstract: arxivPaper.abstract,
      categories: JSON.stringify(arxivPaper.categories),
      publishedDate: arxivPaper.publishedDate,
      pdfUrl: arxivPaper.pdfUrl,
    },
    create: {
      arxivId: arxivPaper.arxivId,
      title: arxivPaper.title,
      authors: JSON.stringify(arxivPaper.authors),
      abstract: arxivPaper.abstract,
      categories: JSON.stringify(arxivPaper.categories),
      publishedDate: arxivPaper.publishedDate,
      pdfUrl: arxivPaper.pdfUrl,
    },
  });

  return toPaper(dbPaper);
}

export async function upsertPapers(arxivPapers: ArxivPaper[]): Promise<Paper[]> {
  const results = await Promise.all(arxivPapers.map(upsertPaper));
  return results;
}

export async function getPaperById(id: string): Promise<Paper | null> {
  const dbPaper = await prisma.paper.findUnique({
    where: { id },
  });
  return dbPaper ? toPaper(dbPaper) : null;
}

export async function getPaperByArxivId(arxivId: string): Promise<Paper | null> {
  const dbPaper = await prisma.paper.findUnique({
    where: { arxivId },
  });
  return dbPaper ? toPaper(dbPaper) : null;
}

export async function updatePaperSummary(
  id: string,
  summary: PaperSummary
): Promise<Paper> {
  const dbPaper = await prisma.paper.update({
    where: { id },
    data: {
      hook: summary.hook,
      keyConcepts: JSON.stringify(summary.keyConcepts),
      summary: summary.summary,
      whyMatters: summary.whyMatters,
    },
  });
  return toPaper(dbPaper);
}

export async function getFeedPapers(
  cursor?: string,
  limit: number = 10,
  excludeSeen: boolean = true
): Promise<{ papers: Paper[]; nextCursor?: string }> {
  // Get IDs of seen papers to exclude
  const seenIds = excludeSeen ? await getSeenPaperIds() : [];

  const papers = await prisma.paper.findMany({
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { publishedDate: "desc" },
    skip: cursor ? 1 : 0,
    where: excludeSeen && seenIds.length > 0
      ? { id: { notIn: seenIds } }
      : undefined,
  });

  const hasMore = papers.length > limit;
  const resultPapers = hasMore ? papers.slice(0, limit) : papers;
  const nextCursor = hasMore ? resultPapers[resultPapers.length - 1].id : undefined;

  return {
    papers: resultPapers.map(toPaper),
    nextCursor,
  };
}

export async function savePaper(paperId: string): Promise<void> {
  await prisma.savedPaper.upsert({
    where: { paperId },
    update: {},
    create: { paperId },
  });
}

export async function unsavePaper(paperId: string): Promise<void> {
  await prisma.savedPaper.deleteMany({
    where: { paperId },
  });
}

export async function getSavedPapers(): Promise<Paper[]> {
  const saved = await prisma.savedPaper.findMany({
    include: { paper: true },
    orderBy: { createdAt: "desc" },
  });
  return saved.map((s) => toPaper(s.paper));
}

export async function isPaperSaved(paperId: string): Promise<boolean> {
  const saved = await prisma.savedPaper.findUnique({
    where: { paperId },
  });
  return !!saved;
}

export async function updatePaperFigures(
  id: string,
  figures: PaperFigure[],
  selectedFigure: SelectedFigure | null,
  error?: string
): Promise<Paper> {
  const dbPaper = await prisma.paper.update({
    where: { id },
    data: {
      figures: JSON.stringify(figures),
      selectedFigure: selectedFigure ? JSON.stringify(selectedFigure) : null,
      figuresError: error || null,
    },
  });
  return toPaper(dbPaper);
}

export async function updatePaperDeepSummary(
  id: string,
  deepSummary: DeepSummary
): Promise<Paper> {
  const dbPaper = await prisma.paper.update({
    where: { id },
    data: {
      deepSummary: JSON.stringify(deepSummary),
    },
  });
  return toPaper(dbPaper);
}

export async function markPaperAsSeen(paperId: string): Promise<void> {
  await prisma.seenPaper.upsert({
    where: { paperId },
    update: {},
    create: { paperId, discarded: false },
  });
}

export async function markPaperAsDiscarded(paperId: string): Promise<void> {
  await prisma.seenPaper.upsert({
    where: { paperId },
    update: { discarded: true },
    create: { paperId, discarded: true },
  });
}

export async function unmarkPaperAsSeen(paperId: string): Promise<void> {
  await prisma.seenPaper.deleteMany({
    where: { paperId },
  });
}

export async function isPaperSeen(paperId: string): Promise<boolean> {
  const seen = await prisma.seenPaper.findUnique({
    where: { paperId },
  });
  return !!seen;
}

export async function isPaperDiscarded(paperId: string): Promise<boolean> {
  const seen = await prisma.seenPaper.findUnique({
    where: { paperId },
  });
  return seen?.discarded ?? false;
}

export async function getSeenPaperIds(): Promise<string[]> {
  const seen = await prisma.seenPaper.findMany({
    select: { paperId: true },
  });
  return seen.map((s) => s.paperId);
}
