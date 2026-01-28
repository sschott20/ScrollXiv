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
  category: string; // Type of paper: measurement, analysis, prototype, survey, etc.
  contributions: string[]; // Main contributions (2-4 items)
  methodology: string; // How the research was conducted
  findings: string[]; // Key findings/results (3-5 items)
  limitations: string[]; // Assumptions, limitations, potential issues
  context: string; // How this fits in the broader field
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
