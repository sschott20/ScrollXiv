import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ArxivPaper, PaperSummary, SearchQuery, PaperFigure, SelectedFigure } from "@/types";

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

async function callClaude(prompt: string): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}

async function callOpenAI(prompt: string): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
  });

  return response.choices[0]?.message?.content || "";
}

async function callAI(prompt: string): Promise<string> {
  const provider = getProvider();

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    return callOpenAI(prompt);
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    return callClaude(prompt);
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
