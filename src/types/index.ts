export interface ArxivPaper {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  publishedDate: Date;
  pdfUrl: string;
}

export interface PaperSummary {
  hook: string;
  keyConcepts: string[];
  summary: string;
  whyMatters: string;
}

export interface PaperFigure {
  url: string;
  caption: string;
  index: number;
  alt?: string;
}

export interface SelectedFigure extends PaperFigure {
  reason: string;
}

export interface FigureAnalysis {
  figureIndex: number;
  description: string;
  significance: string;
}

export interface DeepSummary {
  category: string; // Type of paper: novel architecture, benchmark study, theoretical, etc.
  problem: string; // Problem addressed and why it matters
  contributions: string[]; // Core contributions and how they differ from prior work
  technicalApproach: string; // Detailed method explanation: architectures, algorithms, formulations
  priorWork: string; // Relation to existing literature, what's new vs adapted
  evaluation: string; // Datasets, benchmarks, metrics, key quantitative results
  strengths: string[]; // What the paper does particularly well
  limitations: string[]; // Weaknesses, missing experiments, questionable assumptions
  implications: string; // Future research directions and real-world impact
  figureAnalysis: FigureAnalysis[]; // Analysis of key figures
}

export interface Paper extends ArxivPaper {
  id: string;
  hook?: string | null;
  keyConcepts?: string[] | null;
  summary?: string | null;
  whyMatters?: string | null;
  deepSummary?: DeepSummary | null;
  figures?: PaperFigure[] | null;
  selectedFigure?: SelectedFigure | null;
  figuresError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchQuery {
  searchQuery: string;
  categories: string[];
  sortBy: "relevance" | "submittedDate";
  explanation: string;
}

export interface FeedResponse {
  papers: Paper[];
  nextCursor?: string;
  hasMore: boolean;
}

export const DEFAULT_CATEGORIES = [
  "cs.AI",
  "cs.LG",
  "cs.CL",
  "cs.CV",
  "stat.ML",
];

export const CATEGORY_LABELS: Record<string, string> = {
  "cs.AI": "AI",
  "cs.LG": "Machine Learning",
  "cs.CL": "NLP",
  "cs.CV": "Computer Vision",
  "stat.ML": "Statistics ML",
  "cs.NE": "Neural/Evolutionary",
  "cs.RO": "Robotics",
  "cs.HC": "Human-Computer",
};
