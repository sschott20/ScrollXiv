import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ArxivPaper, PaperSummary, SearchQuery, PaperFigure, SelectedFigure, DeepSummary } from "@/types";
import * as fs from "fs";
import * as path from "path";

type AIProvider = "claude" | "openai";

// Load .env file explicitly to override system env vars
function loadEnvFile(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), ".env");
  const envVars: Record<string, string> = {};

  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key && valueParts.length > 0) {
            let value = valueParts.join("=").trim();
            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            envVars[key.trim()] = value;
          }
        }
      }
    }
  } catch (error) {
    console.warn("[AI] Could not read .env file, falling back to process.env");
  }

  return envVars;
}

const envFile = loadEnvFile();

// Get env var, preferring .env file over system env
function getEnv(key: string): string | undefined {
  return envFile[key] || process.env[key];
}

function getProvider(): AIProvider {
  const provider = getEnv("AI_PROVIDER")?.toLowerCase() || "claude";
  return provider === "openai" ? "openai" : "claude";
}

const SUMMARIZE_PROMPT = `You are an expert computer science researcher. Produce a concise technical summary of this research paper for a graduate-level audience.

Paper Title: {title}
Authors: {authors}
Abstract: {abstract}
Categories: {categories}

Respond ONLY with valid JSON (no markdown):
{
  "hook": "One precise sentence stating the paper's core contribution and why it matters - be specific about the technical advance, avoid hype",
  "keyConcepts": ["technical concept 1", "technical concept 2", "technical concept 3"],
  "summary": "2-3 sentences explaining: (1) the problem addressed, (2) the proposed approach, (3) key results or claims. Be technically precise.",
  "whyMatters": "1-2 sentences on research implications: how this advances the field, enables new capabilities, or addresses known limitations in prior work"
}

Guidelines:
- Be concise but technically precise
- Avoid vague language and marketing speak
- State what is genuinely new versus incremental
- Assume the reader has a strong CS background`;

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
  const apiKey = getEnv("ANTHROPIC_API_KEY");
  console.log(`[AI] Using Claude with key from .env: ${apiKey ? apiKey.slice(0, 10) + "..." + apiKey.slice(-4) : "NOT SET"}`);

  const client = new Anthropic({
    apiKey,
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
  const apiKey = getEnv("OPENAI_API_KEY");
  console.log(`[AI] Using OpenAI with key from .env: ${apiKey ? apiKey.slice(0, 10) + "..." + apiKey.slice(-4) : "NOT SET"}`);

  const client = new OpenAI({
    apiKey,
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
    if (!getEnv("OPENAI_API_KEY")) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    return callOpenAI(prompt, maxTokens);
  } else {
    if (!getEnv("ANTHROPIC_API_KEY")) {
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

const DEEP_SUMMARY_PROMPT = `You are an expert computer science researcher and technical writer. Produce a rigorous, in-depth summary of this research paper for a graduate-level audience.

Paper Title: {title}
Authors: {authors}
Abstract: {abstract}
Categories: {categories}

Available Figures:
{figures}

Analyze this paper and respond ONLY with valid JSON (no markdown):
{
  "category": "Paper type (e.g., 'Novel architecture', 'Empirical benchmark', 'Theoretical analysis', 'Systems paper', 'Survey', 'Method application')",
  "problem": "2-3 sentences: What problem does this paper address? Why does it matter? What gap in prior work motivates this research?",
  "contributions": [
    "Core contribution 1 - be specific about what is technically new",
    "Core contribution 2 - explain how it differs from prior approaches",
    "Core contribution 3 (if applicable)"
  ],
  "technicalApproach": "3-4 sentences explaining the proposed method in detail. Describe model architectures, algorithms, system design, or theoretical formulations. Be precise about assumptions, inputs, outputs, and constraints.",
  "priorWork": "2-3 sentences situating this paper within existing literature. What is genuinely new versus adapted or combined from earlier work?",
  "evaluation": "2-3 sentences on experimental setup: datasets, benchmarks, baselines, metrics. Summarize key quantitative results and what ablations or analyses support the claims.",
  "strengths": [
    "What the paper does particularly well (novelty, rigor, empirical evidence)",
    "Another strength (if applicable)"
  ],
  "limitations": [
    "Weakness, missing experiment, or questionable assumption",
    "Scalability issue or case where method may fail",
    "Another limitation (if apparent)"
  ],
  "implications": "2-3 sentences on how this work could influence future research or real-world systems. Suggest plausible extensions or follow-up experiments.",
  "figureAnalysis": [
    {
      "figureIndex": 1,
      "description": "What this figure shows technically",
      "significance": "Why this figure is important for understanding the paper's contribution"
    }
  ]
}

Guidelines:
- Be concise but thorough. Avoid hype and vague language.
- Do not merely restate section headings; synthesize and interpret.
- Assume the reader has a strong CS background but has not read the paper.
- For figureAnalysis, only include figures that appear significant (max 3-4).
- If information is unclear from the abstract, make reasonable inferences and note uncertainty.`;

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
    return !!getEnv("OPENAI_API_KEY");
  }
  return !!getEnv("ANTHROPIC_API_KEY");
}

export function getConfiguredProvider(): AIProvider | null {
  if (getEnv("ANTHROPIC_API_KEY")) return "claude";
  if (getEnv("OPENAI_API_KEY")) return "openai";
  return null;
}
