# ScrollXiv Improvement Plan

**Last Updated:** 2026-02-16

## Executive Summary

ScrollXiv is a TikTok-style interface for browsing arXiv papers with AI-powered summaries. This plan outlines improvements across mobile accessibility, paper management, content analysis, and user experience.

---

## Current Architecture Analysis

### Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Prisma ORM + SQLite (local file)
- **AI:** Claude (Anthropic) or OpenAI GPT-4
- **Data Sources:** arXiv API + ar5iv for figures

### Current Features
✅ Infinite scroll feed with snap-to-card
✅ Two-tier AI summaries (quick + deep dive)
✅ Figure extraction and AI-selected highlights
✅ Natural language search
✅ Save/discard papers
✅ Prefetching (next 2 papers)
✅ Mobile-optimized swipe gestures
✅ Responsive desktop layout

### Current Limitations
❌ No PWA/offline support
❌ No cross-device sync (SQLite is local)
❌ No saved papers library view
❌ No organization (tags, folders, collections)
❌ No in-app PDF viewer
❌ No annotations or note-taking
❌ No user authentication
❌ Limited figure analysis
❌ No reading progress tracking
❌ No recommendations engine

---

## Improvement Roadmap

### Phase 1: Mobile-First Enhancements (Priority: HIGH)

#### 1.1 Progressive Web App (PWA)
**Impact:** High | **Effort:** Medium

- **Add PWA manifest** (`manifest.json`)
  - App name, icons (192x192, 512x512)
  - Display mode: standalone
  - Theme color, background color
  - Start URL, scope

- **Service Worker for offline support**
  - Cache static assets (JS, CSS, images)
  - Cache API responses with stale-while-revalidate
  - Offline fallback page
  - Background sync for save/discard actions

- **Install prompt**
  - Detect if not installed
  - Show native install banner (iOS/Android)
  - Add "Install App" button in settings

- **Offline indicators**
  - Show network status badge
  - Queue actions when offline (save/discard)
  - Sync when connection restored

**Files to modify:**
- `public/manifest.json` (new)
- `public/sw.js` (new service worker)
- `src/app/layout.tsx` (add manifest link)
- `next.config.ts` (enable PWA plugin)

**Dependencies needed:**
```json
"next-pwa": "^5.6.0"
```

---

#### 1.2 Enhanced Touch Gestures
**Impact:** Medium | **Effort:** Low

- **Pull-to-refresh** on feed
  - Detect swipe-down at top of feed
  - Show loading indicator
  - Fetch latest papers

- **Swipe actions on cards** (horizontal swipe)
  - Swipe left → Discard (X icon)
  - Swipe right → Save (heart icon)
  - Visual feedback with icon reveal

- **Haptic feedback** (mobile devices)
  - Vibrate on save/discard
  - Vibrate on swipe thresholds

- **Pinch-to-zoom on figures**
  - Native pinch gesture on images
  - Smooth zoom with bounds

**Files to modify:**
- `src/components/ScrollFeed.tsx`
- `src/components/PaperCard.tsx`
- `src/components/PaperDetail.tsx`

---

#### 1.3 Mobile Optimizations
**Impact:** High | **Effort:** Medium

- **Image lazy loading improvements**
  - Use Next.js Image component
  - Blur placeholder for figures
  - Responsive srcset for different screen sizes
  - WebP format with fallback

- **Reduce initial bundle size**
  - Code splitting for detail view
  - Lazy load search modal
  - Tree-shake unused AI SDK code

- **Better loading states**
  - Skeleton screens for cards
  - Progressive image loading
  - Streaming deep summaries (word-by-word)

- **iOS Safari fixes**
  - Fix 100vh issues (use dvh units) ✅ (already done)
  - Prevent rubber-band scrolling interference
  - Fix touch-action for gestures

**Files to modify:**
- `src/components/PaperCard.tsx`
- `src/components/PaperDetail.tsx`
- `src/app/layout.tsx`
- `next.config.ts`

---

### Phase 2: Paper Management & Organization (Priority: HIGH)

#### 2.1 Saved Papers Library
**Impact:** High | **Effort:** Medium

- **Dedicated "Library" view**
  - New route: `/library` or bottom nav tab
  - Grid/list toggle for viewing saved papers
  - Sort by: date saved, date published, relevance
  - Filter by: categories, tags, date range

- **Search within saved papers**
  - Full-text search across titles, abstracts, summaries
  - Highlight matching terms
  - Search suggestions

- **Bulk actions**
  - Select multiple papers
  - Batch delete, batch tag, batch export

**Files to create:**
- `src/app/library/page.tsx` (new library view)
- `src/components/LibraryGrid.tsx` (new component)
- `src/components/LibraryFilters.tsx` (new component)

**API endpoints to create:**
- `GET /api/library` (fetch saved papers with filters)

**Database changes:**
```prisma
// Add to SavedPaper model
model SavedPaper {
  // ... existing fields
  notes      String?   // User notes
  tags       String?   // JSON array of tags
  readingProgress Float? @default(0) // 0-100%
  lastReadAt DateTime?
}
```

---

#### 2.2 Collections & Tags
**Impact:** High | **Effort:** Medium

- **Collections (folders)**
  - Create custom collections (e.g., "Transformers", "RL Papers")
  - Drag-and-drop papers into collections
  - Collection descriptions
  - Share collections (export as JSON/URL)

- **Tag system**
  - Add custom tags to papers
  - Auto-suggest tags based on content
  - Tag cloud visualization
  - Filter library by tags

- **Smart collections** (auto-populate)
  - Rules-based: "All NLP papers from 2025"
  - Topic-based: "Contains 'diffusion models'"
  - Author-based: "Papers by Yann LeCun"

**Database schema:**
```prisma
model Collection {
  id          String   @id @default(cuid())
  name        String
  description String?
  color       String?  // hex color for UI
  icon        String?  // emoji or icon name
  isSmartCollection Boolean @default(false)
  rules       String?  // JSON rules for smart collections
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  papers      PaperCollection[]
}

model PaperCollection {
  id           String     @id @default(cuid())
  paperId      String
  collectionId String
  paper        Paper      @relation(fields: [paperId], references: [id])
  collection   Collection @relation(fields: [collectionId], references: [id])
  addedAt      DateTime   @default(now())

  @@unique([paperId, collectionId])
}

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String?
  createdAt DateTime @default(now())
  papers    PaperTag[]
}

model PaperTag {
  id      String @id @default(cuid())
  paperId String
  tagId   String
  paper   Paper  @relation(fields: [paperId], references: [id])
  tag     Tag    @relation(fields: [tagId], references: [id])

  @@unique([paperId, tagId])
}
```

**Files to create:**
- `src/components/CollectionManager.tsx`
- `src/components/TagInput.tsx`
- `src/app/api/collections/route.ts`
- `src/app/api/tags/route.ts`

---

#### 2.3 Export & Import
**Impact:** Medium | **Effort:** Low

- **Export formats**
  - JSON (full data with summaries)
  - CSV (metadata only)
  - BibTeX (citations)
  - Markdown (reading list)
  - PDF (saved papers report)

- **Import**
  - Import from arXiv ID list
  - Import from BibTeX
  - Import from JSON backup

- **Cloud backup**
  - Export entire library to cloud storage
  - Restore from backup

**Files to create:**
- `src/lib/export.ts` (export utilities)
- `src/lib/import.ts` (import utilities)
- `src/app/api/export/route.ts`
- `src/app/api/import/route.ts`

---

#### 2.4 Cross-Device Sync
**Impact:** High | **Effort:** High

**Option A: Add User Authentication + Cloud Database**
- Add NextAuth.js for authentication
- Migrate from SQLite to PostgreSQL (Supabase/Railway)
- Associate papers/collections/tags with user accounts
- Real-time sync via WebSockets or polling

**Option B: File-Based Sync (No Auth)**
- Export/import JSON to sync manually
- iCloud/Google Drive integration (via file system)
- Local-first approach with conflict resolution

**Recommended: Option A** for better UX

**Dependencies:**
```json
"next-auth": "^5.0.0",
"@prisma/client": "^5.22.0", // update
"pg": "^8.11.0" // PostgreSQL driver
```

**Database migration:**
- Add `User` model
- Add `userId` to Paper, SavedPaper, Collection, Tag models
- Add `Session` and `Account` models (NextAuth)

**Files to modify:**
- `prisma/schema.prisma`
- `src/app/api/auth/[...nextauth]/route.ts` (new)
- All API routes (add user filtering)

---

### Phase 3: Enhanced Content Analysis (Priority: MEDIUM)

#### 3.1 Improved Figure Extraction & Analysis
**Impact:** High | **Effort:** Medium

- **Multi-figure display in cards**
  - Show carousel of top 3 figures (not just 1)
  - Swipe through figures on card
  - Thumbnail grid in detail view

- **Figure OCR & text extraction**
  - Extract text from diagrams/charts
  - Make figures searchable by text content
  - Use Google Cloud Vision or Tesseract

- **Figure categorization**
  - Classify: architecture diagram, chart, table, equation, photo
  - Different rendering for different types
  - Filter by figure type

- **Interactive figures**
  - Zoom and pan
  - Click hotspots on architecture diagrams
  - Extract data from charts (if possible)

**Files to modify:**
- `src/services/figures.ts`
- `src/components/PaperCard.tsx`
- `src/components/PaperDetail.tsx`

**New dependencies:**
```json
"tesseract.js": "^5.0.0" // OCR
```

---

#### 3.2 Table & Equation Extraction
**Impact:** Medium | **Effort:** High

- **Table extraction from ar5iv HTML**
  - Parse HTML tables
  - Convert to structured JSON
  - Display in detail view
  - Make searchable

- **Equation extraction**
  - Extract LaTeX from arXiv source (if available)
  - Render with KaTeX or MathJax
  - Show key equations in summary
  - Copy-paste LaTeX code

**Files to create:**
- `src/services/tables.ts`
- `src/services/equations.ts`
- `src/components/EquationRenderer.tsx`

**New dependencies:**
```json
"katex": "^0.16.9",
"react-katex": "^3.0.1"
```

---

#### 3.3 Enhanced AI Summaries
**Impact:** High | **Effort:** Medium

- **Customizable summary depth**
  - Quick, Medium, Deep modes
  - User preference saved
  - Adjust prompt templates

- **Multi-language summaries**
  - Translate summaries to other languages
  - Language selector in settings

- **Summary quality improvements**
  - Better prompts for specific paper types (theory, empirical, survey)
  - Include code snippets if paper has code
  - Link to referenced papers
  - Glossary of technical terms

- **Incremental summary loading**
  - Stream tokens as they're generated (SSE)
  - Show sections as they complete
  - Better loading experience

**Files to modify:**
- `src/services/ai.ts`
- `src/app/api/summarize/route.ts`
- `src/app/api/deep-summary/route.ts`

---

#### 3.4 Citation Graph & Related Papers
**Impact:** High | **Effort:** High

- **Citation network**
  - Fetch citations from Semantic Scholar API
  - Show papers that cite this work
  - Show papers cited by this work
  - Interactive graph visualization

- **Related papers recommendations**
  - Similar content (embedding-based)
  - Same authors
  - Same topic cluster
  - "People who saved this also saved..."

- **Paper genealogy**
  - Show evolution of ideas over time
  - Timeline view of related work

**APIs to integrate:**
- Semantic Scholar API (citations)
- arXiv recommender API (if exists)

**Files to create:**
- `src/services/citations.ts`
- `src/components/CitationGraph.tsx`
- `src/components/RelatedPapers.tsx`
- `src/app/api/citations/route.ts`

---

### Phase 4: Reading Experience (Priority: MEDIUM)

#### 4.1 In-App PDF Viewer
**Impact:** High | **Effort:** High

- **Embedded PDF viewer**
  - PDF.js integration
  - Scroll through PDF pages
  - Zoom, search within PDF
  - Thumbnail sidebar

- **Side-by-side view (desktop)**
  - Summary on left, PDF on right
  - Synchronized scrolling (link figure mentions to PDF pages)

- **PDF annotations**
  - Highlight text
  - Add sticky notes
  - Drawing tools
  - Save annotations to database

- **Reading progress**
  - Track page number/scroll position
  - "Resume reading" from where left off
  - Progress bar

**New dependencies:**
```json
"react-pdf": "^7.5.1",
"pdfjs-dist": "^3.11.174"
```

**Database changes:**
```prisma
model ReadingProgress {
  id           String   @id @default(cuid())
  paperId      String
  paper        Paper    @relation(fields: [paperId], references: [id])
  pageNumber   Int      @default(1)
  scrollPercent Float   @default(0)
  lastReadAt   DateTime @updatedAt

  @@unique([paperId])
}

model Annotation {
  id        String   @id @default(cuid())
  paperId   String
  paper     Paper    @relation(fields: [paperId], references: [id])
  type      String   // "highlight", "note", "drawing"
  pageNumber Int
  position  String   // JSON: {x, y, width, height}
  content   String?  // text content or drawing data
  color     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Files to create:**
- `src/components/PDFViewer.tsx`
- `src/components/AnnotationLayer.tsx`
- `src/app/pdf/[id]/page.tsx` (dedicated PDF route)

---

#### 4.2 Note-Taking & Highlights
**Impact:** Medium | **Effort:** Medium

- **Rich text notes**
  - Markdown editor for notes
  - Attach notes to papers
  - Tag notes
  - Search across notes

- **Quote extraction**
  - Select text from abstract/summary
  - Save as highlight
  - Export quotes

- **Mind map / connections**
  - Link notes to other papers
  - Create concept maps
  - Visual knowledge graph

**Files to create:**
- `src/components/NoteEditor.tsx`
- `src/components/HighlightManager.tsx`
- `src/app/api/notes/route.ts`

**New dependencies:**
```json
"@tiptap/react": "^2.1.13",
"@tiptap/starter-kit": "^2.1.13"
```

---

#### 4.3 Citation Management
**Impact:** Medium | **Effort:** Low

- **Copy citation formats**
  - APA, MLA, Chicago, IEEE
  - BibTeX, RIS
  - Copy to clipboard button

- **Export to reference managers**
  - Zotero integration
  - Mendeley integration
  - EndNote export

- **Generate bibliography**
  - Select multiple saved papers
  - Generate formatted bibliography
  - Export as Word doc or PDF

**Files to create:**
- `src/lib/citations.ts` (citation formatters)
- `src/components/CitationCopier.tsx`

---

#### 4.4 Sharing & Collaboration
**Impact:** Medium | **Effort:** Medium

- **Share papers**
  - Generate shareable link (public or private)
  - Share to social media (Twitter, LinkedIn)
  - Email paper with summary
  - QR code for mobile sharing

- **Collaborative collections**
  - Invite others to view/edit collections
  - Comments on papers
  - Voting/ranking papers in collection

- **Discussion threads**
  - Comment section for each paper
  - Reply to comments
  - Upvote/downvote

**Database changes:**
```prisma
model SharedLink {
  id           String   @id @default(cuid())
  paperId      String?
  collectionId String?
  token        String   @unique
  expiresAt    DateTime?
  viewCount    Int      @default(0)
  createdAt    DateTime @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  paperId   String
  paper     Paper    @relation(fields: [paperId], references: [id])
  userId    String   // requires auth
  content   String
  parentId  String?  // for replies
  upvotes   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### Phase 5: Discovery & Personalization (Priority: LOW)

#### 5.1 Recommendation Engine
**Impact:** High | **Effort:** High

- **Personalized feed**
  - ML-based recommendations
  - Learn from saved/discarded papers
  - Topic clustering
  - Author preferences

- **Trending papers**
  - Most saved this week
  - Most cited recently
  - Rising stars (new papers gaining traction)

- **Daily digest**
  - Email summary of new papers in your topics
  - Push notifications (PWA)
  - Customizable frequency

**Approaches:**
- Collaborative filtering (user-based)
- Content-based filtering (embedding similarity)
- Hybrid approach

**Files to create:**
- `src/services/recommendations.ts`
- `src/lib/ml/embeddings.ts` (vector embeddings)
- `src/app/api/recommendations/route.ts`

**New dependencies:**
```json
"@xenova/transformers": "^2.6.0" // for embeddings
```

---

#### 5.2 Advanced Search & Filters
**Impact:** Medium | **Effort:** Medium

- **Advanced search filters**
  - Date range picker
  - Author search
  - Citation count threshold
  - Has code/dataset
  - Specific arXiv categories

- **Saved searches**
  - Save search queries
  - Create alerts for new matching papers
  - Auto-populate collections from searches

- **Search history**
  - View past searches
  - Re-run searches
  - Clear history

**Files to modify:**
- `src/components/SearchModal.tsx`
- `src/app/api/search/route.ts`

**Database changes:**
```prisma
model SavedSearch {
  id          String   @id @default(cuid())
  name        String
  query       String   // JSON search parameters
  alertEnabled Boolean @default(false)
  lastChecked DateTime?
  createdAt   DateTime @default(now())
}
```

---

#### 5.3 Reading Analytics
**Impact:** Low | **Effort:** Low

- **Personal stats**
  - Papers read this week/month/year
  - Reading time tracked
  - Favorite topics/authors
  - Reading streak

- **Visualizations**
  - Reading heatmap (calendar)
  - Topic distribution (pie chart)
  - Citations network graph
  - Timeline of saved papers

- **Achievements/badges**
  - "100 papers read"
  - "10-day streak"
  - "Topic explorer" (read papers from 5+ categories)

**Files to create:**
- `src/app/stats/page.tsx`
- `src/components/StatsCharts.tsx`
- `src/app/api/stats/route.ts`

---

### Phase 6: Performance & Scalability (Priority: MEDIUM)

#### 6.1 Database Migration
**Impact:** High | **Effort:** High

**Migrate from SQLite to PostgreSQL**
- Better for multi-user support
- Faster queries with indexing
- Full-text search capabilities
- JSON field querying
- Handle concurrent writes

**Hosting options:**
- Supabase (PostgreSQL + Auth + Storage)
- Railway
- Vercel Postgres
- AWS RDS

**Migration steps:**
1. Update Prisma schema (`provider = "postgresql"`)
2. Create PostgreSQL database
3. Update DATABASE_URL in `.env`
4. Run `npx prisma migrate dev`
5. Seed data from SQLite (export/import script)

---

#### 6.2 Caching Strategy
**Impact:** Medium | **Effort:** Medium

- **API response caching**
  - Cache arXiv API responses (Redis/Vercel KV)
  - Cache AI summaries (already in DB, but add in-memory cache)
  - Cache figure URLs (CDN)

- **Client-side caching**
  - SWR or TanStack Query for data fetching
  - Optimistic updates for save/discard
  - Prefetch next pages aggressively

- **Edge caching**
  - Deploy to Vercel Edge Functions
  - Cache static content on CDN
  - ISR (Incremental Static Regeneration) for popular papers

**New dependencies:**
```json
"@vercel/kv": "^1.0.0",
"swr": "^2.2.4"
```

---

#### 6.3 Image Optimization
**Impact:** Medium | **Effort:** Low

- **Use Next.js Image component**
  - Automatic WebP conversion
  - Responsive images
  - Lazy loading with blur placeholder

- **CDN for figures**
  - Store extracted figures on CDN (Cloudinary/Vercel Blob)
  - Faster loading times
  - Bandwidth savings

- **Thumbnail generation**
  - Generate small/medium/large versions
  - Serve appropriate size based on viewport

**Files to modify:**
- `src/components/PaperCard.tsx` (use next/image)
- `src/components/PaperDetail.tsx`
- `src/services/figures.ts` (upload to CDN)

---

#### 6.4 Rate Limiting & Error Handling
**Impact:** High | **Effort:** Medium

- **Rate limiting**
  - Limit API calls per user (prevent abuse)
  - Implement exponential backoff
  - Queue requests

- **Robust error handling**
  - Retry failed API calls
  - Graceful degradation (show cached content)
  - User-friendly error messages
  - Error logging (Sentry)

- **Monitoring**
  - Track API usage
  - Monitor AI costs
  - Alert on errors

**New dependencies:**
```json
"@sentry/nextjs": "^7.0.0",
"@upstash/ratelimit": "^1.0.0"
```

---

### Phase 7: Additional Features (Priority: LOW)

#### 7.1 Themes & Customization
**Impact:** Low | **Effort:** Low

- **Theme toggle**
  - Dark mode (current)
  - Light mode
  - Sepia mode (reading-friendly)
  - System preference detection

- **Font size adjustment**
  - Small, Medium, Large, Extra Large
  - Dyslexic-friendly fonts

- **Layout customization**
  - Compact vs. Comfortable card spacing
  - Hide/show elements (figures, categories, etc.)

**Files to modify:**
- `src/app/layout.tsx`
- `tailwind.config.ts`
- Add theme context provider

---

#### 7.2 Accessibility Improvements
**Impact:** Medium | **Effort:** Medium

- **ARIA labels**
  - Screen reader support
  - Keyboard navigation improvements
  - Focus indicators

- **Voice control**
  - Voice commands: "Next paper", "Save", "Read summary"
  - Text-to-speech for summaries

- **High contrast mode**
  - WCAG AA compliance
  - Color-blind friendly palettes

---

#### 7.3 Browser Extension
**Impact:** Medium | **Effort:** High

- **Chrome/Firefox extension**
  - Save papers from arXiv.org directly
  - Quick-add from any webpage
  - Show summary overlay on arXiv

**Tech stack:**
- Manifest V3
- React (shared components)
- Background service worker

---

## Implementation Priority Matrix

| Phase | Priority | Impact | Effort | ROI |
|-------|----------|--------|--------|-----|
| **Phase 1: Mobile-First** | HIGH | High | Medium | ⭐⭐⭐⭐⭐ |
| 1.1 PWA | HIGH | High | Medium | ⭐⭐⭐⭐⭐ |
| 1.2 Touch Gestures | HIGH | Medium | Low | ⭐⭐⭐⭐ |
| 1.3 Mobile Optimizations | HIGH | High | Medium | ⭐⭐⭐⭐ |
| **Phase 2: Paper Management** | HIGH | High | Medium-High | ⭐⭐⭐⭐⭐ |
| 2.1 Library View | HIGH | High | Medium | ⭐⭐⭐⭐⭐ |
| 2.2 Collections & Tags | HIGH | High | Medium | ⭐⭐⭐⭐ |
| 2.3 Export/Import | MEDIUM | Medium | Low | ⭐⭐⭐ |
| 2.4 Cross-Device Sync | HIGH | High | High | ⭐⭐⭐⭐ |
| **Phase 3: Content Analysis** | MEDIUM | High | Medium-High | ⭐⭐⭐⭐ |
| 3.1 Better Figures | MEDIUM | High | Medium | ⭐⭐⭐⭐ |
| 3.2 Tables & Equations | LOW | Medium | High | ⭐⭐ |
| 3.3 Enhanced Summaries | MEDIUM | High | Medium | ⭐⭐⭐⭐ |
| 3.4 Citations & Related | HIGH | High | High | ⭐⭐⭐⭐ |
| **Phase 4: Reading Experience** | MEDIUM | High | High | ⭐⭐⭐ |
| 4.1 PDF Viewer | MEDIUM | High | High | ⭐⭐⭐⭐ |
| 4.2 Notes & Highlights | MEDIUM | Medium | Medium | ⭐⭐⭐ |
| 4.3 Citations | MEDIUM | Medium | Low | ⭐⭐⭐ |
| 4.4 Sharing | LOW | Medium | Medium | ⭐⭐ |
| **Phase 5: Discovery** | LOW | Medium | High | ⭐⭐⭐ |
| 5.1 Recommendations | LOW | High | High | ⭐⭐⭐ |
| 5.2 Advanced Search | MEDIUM | Medium | Medium | ⭐⭐⭐ |
| 5.3 Analytics | LOW | Low | Low | ⭐⭐ |
| **Phase 6: Performance** | MEDIUM | High | Medium-High | ⭐⭐⭐⭐ |
| 6.1 PostgreSQL Migration | HIGH | High | High | ⭐⭐⭐⭐ |
| 6.2 Caching | MEDIUM | Medium | Medium | ⭐⭐⭐ |
| 6.3 Image Optimization | MEDIUM | Medium | Low | ⭐⭐⭐⭐ |
| 6.4 Error Handling | HIGH | High | Medium | ⭐⭐⭐⭐ |
| **Phase 7: Additional** | LOW | Low-Medium | Medium | ⭐⭐ |

---

## Recommended Implementation Order

### Sprint 1-2 (Weeks 1-4): Quick Wins
1. **PWA Setup** (1.1) - Installable app, offline support
2. **Pull-to-refresh** (1.2) - Better mobile UX
3. **Library View** (2.1) - Access saved papers
4. **Image Optimization** (6.3) - Use next/image
5. **Better Error Handling** (6.4) - Robustness

### Sprint 3-4 (Weeks 5-8): Core Features
1. **Collections & Tags** (2.2) - Organization system
2. **Enhanced Touch Gestures** (1.2) - Swipe to save/discard
3. **Export/Import** (2.3) - Data portability
4. **Mobile Optimizations** (1.3) - Performance

### Sprint 5-6 (Weeks 9-12): Database & Sync
1. **PostgreSQL Migration** (6.1) - Scalable database
2. **User Authentication** (2.4 prerequisite) - NextAuth
3. **Cross-Device Sync** (2.4) - Multi-device support
4. **Caching Strategy** (6.2) - Performance

### Sprint 7-8 (Weeks 13-16): Advanced Content
1. **Citation Graph** (3.4) - Related papers
2. **Better Figure Analysis** (3.1) - Multi-figure, OCR
3. **Enhanced Summaries** (3.3) - Streaming, quality
4. **Advanced Search** (5.2) - Filters, saved searches

### Sprint 9-10 (Weeks 17-20): Reading Tools
1. **PDF Viewer** (4.1) - In-app reading
2. **Notes & Highlights** (4.2) - Annotation system
3. **Citation Manager** (4.3) - BibTeX export
4. **Themes** (7.1) - Light/dark modes

### Future Sprints (Weeks 21+): Polish
1. **Recommendations** (5.1) - Personalized feed
2. **Reading Analytics** (5.3) - Stats dashboard
3. **Sharing & Collaboration** (4.4) - Social features
4. **Browser Extension** (7.3) - Cross-platform

---

## Technical Debt to Address

1. **Type Safety**
   - Add Zod schemas for API validation
   - Strict TypeScript mode
   - API contract testing

2. **Testing**
   - Add Jest + React Testing Library
   - E2E tests with Playwright
   - API route tests
   - Component tests

3. **Documentation**
   - API documentation (OpenAPI/Swagger)
   - Component Storybook
   - Architecture diagrams
   - Contributing guide

4. **Code Quality**
   - ESLint strict rules
   - Prettier formatting
   - Husky pre-commit hooks
   - Automated dependency updates

---

## Cost Considerations

### AI API Costs
- **Current:** ~$0.01-0.05 per paper (Claude/GPT-4)
- **Optimization:** Cache summaries, use cheaper models for quick summaries
- **Budget:** $100-500/month for 10K papers

### Infrastructure Costs
- **SQLite (current):** Free (local)
- **PostgreSQL:** $5-25/month (Railway/Supabase)
- **Vercel Hosting:** Free tier → $20/month (Pro)
- **CDN (images):** $5-20/month (Cloudinary/Vercel Blob)
- **Total:** ~$30-70/month

### Scaling Considerations
- 100 users: Current setup OK
- 1K users: Need PostgreSQL, caching
- 10K users: Need dedicated infrastructure, load balancing
- 100K+ users: Enterprise setup (multi-region, CDN, etc.)

---

## Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Papers viewed per session
- Time spent in app
- Return rate (7-day, 30-day)

### Feature Adoption
- % users who save papers
- % users who create collections
- % users who install PWA
- % users who use search

### Performance
- Time to First Contentful Paint (FCP)
- Time to Interactive (TTI)
- API response times
- Error rate

### Business Metrics
- User retention (weekly, monthly)
- User growth rate
- AI API costs per user
- Infrastructure costs per user

---

## Conclusion

This plan transforms ScrollXiv from a simple paper browser into a comprehensive research management platform. The phased approach ensures:

1. **Quick wins first** - PWA and library view provide immediate value
2. **Foundation before features** - Database migration before advanced features
3. **User-centric prioritization** - Focus on mobile, organization, and reading experience
4. **Sustainable growth** - Performance and scalability built in

**Key differentiators after implementation:**
- Mobile-first experience (PWA, gestures)
- Comprehensive paper organization (collections, tags, search)
- Deep AI analysis (summaries, figures, citations)
- Cross-device sync
- In-app reading tools (PDF viewer, annotations)
- Personalized recommendations

**Next Steps:**
1. Review and prioritize features with stakeholders
2. Set up project tracking (GitHub Projects/Linear)
3. Create technical specifications for Phase 1
4. Begin Sprint 1 implementation
