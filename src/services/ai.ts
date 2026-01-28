import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ArxivPaper, PaperSummary, SearchQuery, PaperFigure, SelectedFigure, DeepSummary } from "@/types";

type AIProvider = "claude" | "openai";

function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || "claude";
  return provider === "openai" ? "openai" : "claude";
}

const SUMMARIZE_PROMPT = `You are an expert science communicator. Given this arXiv paper, create engaging content for a social-media style feed.

Paper Title: {title}
Authors: {authors}
Abstract: {abstract}
Categories: {categories}

Create the following (respond ONLY with valid JSON, no markdown):
{
  "hook": "A single attention-grabbing sentence that makes someone want to learn more (think Twitter/TikTok hook)",
  "keyConcepts": ["concept 1", "concept 2", "concept 3"],
  "summary": "2-3 sentence summary accessible to someone with a CS degree",
  "whyMatters": "1-2 sentences on real-world significance and implications"
}

Keep it engaging but accurate. No hype, just clear communication.`;

const SEARCH_PROMPT = `Convert this natural language search into an arXiv API query.

User query: "{query}"

ArXiv categories reference:
- cs.AI: Artificial Intelligence
- cs.LG: Machine Learning
- cs.CL: Computation and Language (NLP)
- cs.CV: Computer Vision
- cs.NE: Neural and Evolutionary Computing
- stat.ML: Machine Learning (Statistics)
- cs.RO: Robotics
- cs.CR: Cryptography and Security

Respond ONLY with valid JSON (no markdown):
{
  "searchQuery": "keywords to search for (space-separated)",
  "categories": ["relevant", "category", "codes"],
  "sortBy": "relevance" or "submittedDate",
  "explanation": "brief explanation of why these parameters match user intent"
}`;

async function callClaude(prompt: string, maxTokens: number = 1024): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}

async function callOpenAI(prompt: string, maxTokens: number = 1024): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
  });

  return response.choices[0]?.message?.content || "";
}

async function callAI(prompt: string, maxTokens: number = 1024): Promise<string> {
  const provider = getProvider();

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    return callOpenAI(prompt, maxTokens);
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    return callClaude(prompt, maxTokens);
  }
}

function parseJSON<T>(text: string): T {
  // Remove markdown code blocks if present
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function summarizePaper(paper: ArxivPaper): Promise<PaperSummary> {
  const prompt = SUMMARIZE_PROMPT.replace("{title}", paper.title)
    .replace("{authors}", paper.authors.join(", "))
    .replace("{abstract}", paper.abstract)
    .replace("{categories}", paper.categories.join(", "));

  const response = await callAI(prompt);
  return parseJSON<PaperSummary>(response);
}

export async function interpretSearch(query: string): Promise<SearchQuery> {
  const prompt = SEARCH_PROMPT.replace("{query}", query);
  const response = await callAI(prompt);
  return parseJSON<SearchQuery>(response);
}

const SELECT_FIGURE_PROMPT = `You are selecting the most visually compelling figure from an arXiv paper for a TikTok-style feed.

Paper Title: {title}
Paper Abstract: {abstract}

Available Figures:
{figures}

Select the BEST figure for social media engagement. Consider:
1. Visual impact - diagrams, charts, and results are more engaging than tables or equations
2. Comprehensibility - figures that convey key findings without reading the paper
3. "Wow factor" - surprising results, clear comparisons, interesting visualizations

Respond ONLY with valid JSON (no markdown):
{
  "selectedIndex": <1-based figure index>,
  "reason": "Brief explanation of why this figure best represents the paper's key contribution"
}

If no figures are suitable (all are tables, equations, or low quality), respond:
{
  "selectedIndex": 0,
  "reason": "No suitable visual figures found"
}`;

export async function selectBestFigure(
  paper: ArxivPaper,
  figures: PaperFigure[]
): Promise<SelectedFigure | null> {
  if (figures.length === 0) {
    return null;
  }

  const figuresText = figures
    .map((f) => `Figure ${f.index}: "${f.caption}"`)
    .join("\n");

  const prompt = SELECT_FIGURE_PROMPT.replace("{title}", paper.title)
    .replace("{abstract}", paper.abstract.substring(0, 1000))
    .replace("{figures}", figuresText);

  const response = await callAI(prompt);
  const result = parseJSON<{ selectedIndex: number; reason: string }>(response);

  if (result.selectedIndex === 0 || result.selectedIndex > figures.length) {
    return null;
  }

  const selectedFigure = figures[result.selectedIndex - 1];
  return {
    ...selectedFigure,
    reason: result.reason,
  };
}

const DEEP_SUMMARY_PROMPT = `You are an expert research paper analyst. Provide a detailed "second pass" summary of this paper - deeper than a quick skim but more accessible than reading the full paper.

Paper Title: {title}
Authors: {authors}
Abstract: {abstract}
Categories: {categories}

Available Figures:
{figures}

Analyze this paper and respond ONLY with valid JSON (no markdown):
{
  "category": "What type of paper is this? (e.g., 'Novel architecture proposal', 'Empirical benchmark study', 'Theoretical analysis', 'System implementation', 'Survey/review', 'Application of existing methods')",
  "contributions": [
    "Main contribution 1 - be specific about what's new",
    "Main contribution 2",
    "Main contribution 3 (if applicable)"
  ],
  "methodology": "2-3 sentences describing HOW the research was conducted - the approach, techniques, datasets, or theoretical framework used",
  "findings": [
    "Key finding 1 - specific results or insights",
    "Key finding 2 - include numbers/metrics when available from abstract",
    "Key finding 3",
    "Key finding 4 (if applicable)"
  ],
  "limitations": [
    "Potential limitation, assumption, or scope constraint 1",
    "Potential limitation 2 (if apparent from abstract)"
  ],
  "context": "1-2 sentences on how this work fits into the broader research landscape - what problem space it addresses and why it matters to the field",
  "figureAnalysis": [
    {
      "figureIndex": 1,
      "description": "What this figure shows",
      "significance": "Why this figure matters for understanding the paper"
    }
  ]
}

Guidelines:
- Be specific and technical, but accessible to someone with a CS background
- For figureAnalysis, only include figures that appear significant based on their captions (max 3-4 figures)
- If you can't determine something from the abstract, make reasonable inferences but note uncertainty
- Focus on what would help a reader decide if they want to read the full paper`;

export async function generateDeepSummary(
  paper: ArxivPaper,
  figures: PaperFigure[]
): Promise<DeepSummary> {
  const figuresText =
    figures.length > 0
      ? figures.map((f) => `Figure ${f.index}: "${f.caption}"`).join("\n")
      : "No figures available";

  const prompt = DEEP_SUMMARY_PROMPT.replace("{title}", paper.title)
    .replace("{authors}", paper.authors.join(", "))
    .replace("{abstract}", paper.abstract)
    .replace("{categories}", paper.categories.join(", "))
    .replace("{figures}", figuresText);

  const response = await callAI(prompt, 2048);
  return parseJSON<DeepSummary>(response);
}

export function isAIConfigured(): boolean {
  const provider = getProvider();
  if (provider === "openai") {
    return !!process.env.OPENAI_API_KEY;
  }
  return !!process.env.ANTHROPIC_API_KEY;
}

export function getConfiguredProvider(): AIProvider | null {
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}
