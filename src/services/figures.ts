import { PaperFigure } from "@/types";

const AR5IV_BASE = "https://ar5iv.labs.arxiv.org/html";

interface FigureExtractionResult {
  figures: PaperFigure[];
  error?: string;
}

export async function extractFiguresFromAr5iv(
  arxivId: string
): Promise<FigureExtractionResult> {
  // Clean arxivId (remove version suffix if present, e.g., "2401.12345v1" -> "2401.12345")
  const cleanId = arxivId.replace(/v\d+$/, "");
  const ar5ivUrl = `${AR5IV_BASE}/${cleanId}`;

  try {
    const response = await fetch(ar5ivUrl, {
      headers: {
        "User-Agent": "ScrollXiv/1.0 (Academic paper browser)",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { figures: [], error: "ar5iv rendering not available" };
      }
      return { figures: [], error: `ar5iv returned ${response.status}` };
    }

    const html = await response.text();
    const figures = parseFiguresFromHtml(html, cleanId);

    return { figures };
  } catch (error) {
    return {
      figures: [],
      error: error instanceof Error ? error.message : "Failed to fetch ar5iv",
    };
  }
}

function parseFiguresFromHtml(html: string, arxivId: string): PaperFigure[] {
  const figures: PaperFigure[] = [];

  // Match <figure> elements containing images
  // ar5iv uses <figure class="ltx_figure"> with <img> inside
  const figureRegex =
    /<figure[^>]*class="[^"]*ltx_figure[^"]*"[^>]*>([\s\S]*?)<\/figure>/gi;
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*>/i;
  const captionRegex = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i;

  let match;
  let index = 1;

  while ((match = figureRegex.exec(html)) !== null) {
    const figureHtml = match[1];

    const imgMatch = figureHtml.match(imgRegex);
    const captionMatch = figureHtml.match(captionRegex);

    if (imgMatch) {
      let imgUrl = imgMatch[1];

      // Handle relative URLs
      if (imgUrl.startsWith("/")) {
        imgUrl = `https://ar5iv.labs.arxiv.org${imgUrl}`;
      } else if (!imgUrl.startsWith("http")) {
        imgUrl = `https://ar5iv.labs.arxiv.org/html/${arxivId}/${imgUrl}`;
      }

      // Clean caption HTML
      const caption = captionMatch
        ? stripHtml(captionMatch[1])
        : `Figure ${index}`;

      figures.push({
        url: imgUrl,
        caption: caption.trim(),
        index,
        alt: imgMatch[2] || undefined,
      });

      index++;
    }
  }

  return figures;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getAr5ivUrl(arxivId: string): string {
  const cleanId = arxivId.replace(/v\d+$/, "");
  return `${AR5IV_BASE}/${cleanId}`;
}
