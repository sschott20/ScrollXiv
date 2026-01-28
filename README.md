# ScrollXiv

A TikTok-style interface for browsing arXiv papers. Scroll through the latest ML/AI research with AI-generated summaries, extracted figures, and deep-dive analysis.

## Features

### Infinite Scroll Feed
- Vertical swipe/scroll interface optimized for mobile and desktop
- Prefetches summaries and figures for the next 2 papers for seamless browsing
- Tap anywhere on a card to expand into the full detail view

### AI-Powered Summaries
Two-layer summary system for quick scanning and deep research:

**Quick Summary (Card View)**
- Attention-grabbing hook describing the core contribution
- Key technical concepts
- Brief problem/approach/results summary
- Why the research matters

**Deep Dive (Detail View)**
- Paper category classification (novel architecture, benchmark study, theoretical, etc.)
- Problem & motivation analysis
- Core contributions with comparison to prior work
- Technical approach breakdown
- Evaluation methodology and key results
- Strengths and limitations assessment
- Future research implications
- Figure analysis with significance explanations

### Paper Figures
- Automatically extracts figures from [ar5iv](https://ar5iv.labs.arxiv.org/) HTML renderings
- AI selects the most informative figure for each paper
- Click/tap figures to view full-size in a lightbox modal

### Smart Search
- Natural language search queries (e.g., "papers about vision transformers for medical imaging")
- AI interprets your intent and translates to arXiv API parameters
- Shows the AI's interpretation of your query

### Paper Management
- **Save**: Bookmark papers for later (heart icon)
- **Discard**: Mark papers as not interesting (X icon) - they won't appear again
- Seen papers are filtered from the feed automatically

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Prisma ORM with SQLite
- **AI**: Claude (Anthropic) or OpenAI GPT-4
- **Styling**: Tailwind CSS
- **Data Source**: arXiv API + ar5iv for figures

## Setup

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/sschott20/ScrollXiv.git
cd ScrollXiv

# Install dependencies
npm install

# Set up the database
npx prisma db push

# Start the development server
npm run dev
```

### Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# AI Provider: "claude" or "openai"
AI_PROVIDER="claude"

# API Keys (provide one based on AI_PROVIDER)
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
```

The app prioritizes API keys from `.env` over system environment variables.

## Usage

1. **Browse**: Scroll vertically through papers. Each card shows the AI-generated hook, key concepts, and a representative figure.

2. **Expand**: Tap/click a card to see the full detail view with the deep dive analysis, abstract, and all figures.

3. **Search**: Use the search icon to find papers by topic. Natural language queries work best.

4. **Save/Discard**: Use the heart to save interesting papers, X to remove uninteresting ones from your feed.

5. **Refresh**: Tap Home to fetch the latest papers from arXiv.

## Default Categories

The feed pulls from these arXiv categories by default:
- cs.AI (Artificial Intelligence)
- cs.LG (Machine Learning)
- cs.CL (Computation and Language / NLP)
- cs.CV (Computer Vision)
- stat.ML (Machine Learning - Statistics)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/feed` | GET | Get paginated paper feed |
| `/api/search` | POST | Natural language search |
| `/api/summarize` | POST | Generate quick summary |
| `/api/deep-summary` | POST | Generate deep dive analysis |
| `/api/figures` | POST | Extract and select figures |
| `/api/papers/[id]` | GET/POST | Get paper details, save/discard |

## License

MIT
