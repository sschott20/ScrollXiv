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

const DEEP_SUMMARY_PROMPT = `You are an expert computer science researcher. Produce an in-depth technical analysis focusing on HOW this paper works, not just WHAT it does.

Paper Title: {title}
Authors: {authors}
Abstract: {abstract}
Categories: {categories}

Available Figures:
{figures}

IMPORTANT: The reader has already seen the abstract. Do NOT repeat basic information like "this paper proposes X" or restate what the paper is about. Instead, go DEEPER into implementation specifics, technical mechanisms, and architectural choices.

Respond ONLY with valid JSON (no markdown):
{
  "category": "Paper type (e.g., 'Novel architecture', 'Empirical benchmark', 'Theoretical analysis', 'Systems paper', 'Survey')",
  "problem": "1-2 sentences on the specific technical challenge. Focus on WHY existing approaches fail, not just that a problem exists.",
  "contributions": [
    "Specific technical contribution with concrete details (e.g., 'Introduces cross-attention mechanism between X and Y that reduces complexity from O(n²) to O(n log n)')",
    "Another specific contribution with measurable claims",
    "Third contribution if applicable"
  ],
  "technicalApproach": "4-5 sentences on HOW the method actually works. Describe: specific architectural components, key algorithms or equations, training procedures, loss functions, inference pipelines. Use precise technical language. What are the inputs, intermediate representations, and outputs at each stage?",
  "priorWork": "2 sentences: What specific prior methods does this build on? What key technique or insight distinguishes this from those baselines?",
  "evaluation": "2-3 sentences with SPECIFIC numbers: What datasets (with sizes), what metrics, what baselines, what percentage improvements? Include actual reported numbers when inferable.",
  "strengths": [
    "Specific technical strength with evidence",
    "Another concrete strength"
  ],
  "limitations": [
    "Specific limitation or assumption that restricts applicability",
    "Another concrete limitation or open question"
  ],
  "implications": "2 sentences on concrete follow-up work or applications this enables.",
  "figureAnalysis": [
    {
      "figureIndex": 1,
      "description": "Technical content shown (architecture diagram, ablation results, etc.)",
      "significance": "What this reveals about the method that isn't obvious from text"
    }
  ]
}

Guidelines:
- NEVER repeat phrases from the abstract verbatim
- Focus on implementation SPECIFICS: architecture details, hyperparameters, training tricks, inference optimizations
- Include concrete numbers, dimensions, layer counts when inferable
- Explain the "secret sauce" - what makes this approach actually work
- For figureAnalysis, only include 2-3 most informative figures`;

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
