# ScrollXiv Implementation Plan (No Additional Costs)

## Overview
This plan implements all improvements that don't require paid services beyond existing AI API calls.

## What We're Building (All Free!)

### ✅ Phase 1: Mobile-First Features
- PWA with service worker (offline support)
- Pull-to-refresh gesture
- Swipe-to-save/discard on cards
- Enhanced touch gestures
- Next.js Image optimization (built-in)
- Better loading states

### ✅ Phase 2: Paper Management
- Library view for saved papers
- Collections & tags (SQLite tables)
- Search within saved papers
- Export to JSON, CSV, BibTeX, Markdown
- Import from arXiv IDs, BibTeX, JSON
- Reading progress tracking

### ✅ Phase 3: Enhanced Content
- Multi-figure display
- Figure OCR with Tesseract.js (free, client-side)
- Better figure analysis
- Enhanced AI summaries (streaming)
- Citation graph (using Semantic Scholar free API)
- Related papers suggestions

### ✅ Phase 4: Reading Experience
- PDF viewer with PDF.js (free)
- Annotations & highlights (SQLite)
- Note-taking with markdown
- Citation formatting (BibTeX, APA, etc.)
- Reading progress tracking

### ✅ Phase 5: Discovery
- Advanced search filters
- Saved searches
- Basic recommendations (content-based, no ML models)
- Reading statistics dashboard

### ✅ Phase 6: Polish
- Light/dark/sepia themes
- Font size controls
- Accessibility improvements
- Keyboard navigation

### ❌ NOT Implementing (Requires Paid Services)
- Cross-device sync (needs cloud database)
- User authentication (would need cloud)
- CDN for images (keep local caching)
- Monitoring services (use console logging)
- Email notifications (needs email service)

## Git Workflow & Branching Strategy

### Branch Structure
```
main (production-ready)
├── develop (integration branch)
    ├── feature/pwa-setup
    ├── feature/library-view
    ├── feature/collections-tags
    ├── feature/pdf-viewer
    ├── feature/enhanced-gestures
    └── ...
```

### Naming Conventions
- **Features:** `feature/brief-description` (e.g., `feature/pwa-setup`)
- **Bugfixes:** `fix/brief-description` (e.g., `fix/figure-loading`)
- **Refactoring:** `refactor/brief-description` (e.g., `refactor/api-routes`)
- **Documentation:** `docs/brief-description` (e.g., `docs/update-readme`)

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Examples:**
```
feat(pwa): add service worker with offline support

- Implement service worker for caching
- Add manifest.json with app icons
- Enable offline mode for viewed papers

Closes #1
```

```
feat(library): add saved papers library view

- Create library page with grid/list layout
- Add search and filter functionality
- Implement sort by date/relevance

Closes #2
```

## Implementation Sequence

### Sprint 1 (Features 1-3)
**Branch:** `feature/pwa-setup`
1. Add PWA manifest
2. Create service worker
3. Implement offline caching
4. Add install prompt

**Branch:** `feature/enhanced-gestures`
5. Pull-to-refresh on feed
6. Swipe gestures on cards (save/discard)
7. Haptic feedback

**Branch:** `feature/mobile-optimizations`
8. Convert to Next.js Image
9. Add skeleton loading states
10. Optimize bundle size

### Sprint 2 (Features 4-6)
**Branch:** `feature/library-view`
11. Create library page
12. Add grid/list toggle
13. Implement search in library
14. Add filters and sorting

**Branch:** `feature/collections-tags`
15. Database schema for collections/tags
16. Collection creation UI
17. Tag management
18. Drag-drop papers to collections

**Branch:** `feature/export-import`
19. Export to JSON/CSV/BibTeX/Markdown
20. Import from arXiv IDs
21. Import from BibTeX/JSON
22. Bulk operations

### Sprint 3 (Features 7-9)
**Branch:** `feature/enhanced-figures`
23. Multi-figure carousel in cards
24. Figure OCR with Tesseract.js
25. Figure categorization
26. Better figure selection

**Branch:** `feature/citations-network`
27. Integrate Semantic Scholar API
28. Citation graph visualization
29. Related papers widget
30. Paper genealogy view

**Branch:** `feature/enhanced-summaries`
31. Streaming summary responses (SSE)
32. Customizable summary depth
33. Better prompts per paper type
34. Summary quality improvements

### Sprint 4 (Features 10-12)
**Branch:** `feature/pdf-viewer`
35. Integrate PDF.js
36. Create PDF viewer component
37. Side-by-side view (desktop)
38. PDF navigation

**Branch:** `feature/annotations`
39. Database schema for annotations
40. Highlight text in PDF
41. Add sticky notes
42. Save/load annotations

**Branch:** `feature/notes-highlights`
43. Rich text note editor (markdown)
44. Link notes to papers
45. Search across notes
46. Export notes

### Sprint 5 (Features 13-15)
**Branch:** `feature/citation-manager`
47. Citation formatters (APA, MLA, Chicago, IEEE, BibTeX)
48. Copy citation to clipboard
49. Generate bibliography
50. Export citations

**Branch:** `feature/advanced-search`
51. Advanced search filters
52. Saved searches
53. Search history
54. Search within library

**Branch:** `feature/recommendations`
55. Content-based recommendations (keyword matching)
56. Similar papers by category
57. Same author papers
58. Reading history based suggestions

### Sprint 6 (Features 16-18)
**Branch:** `feature/reading-progress`
59. Track reading progress per paper
60. Resume reading functionality
61. Progress indicators
62. Reading statistics

**Branch:** `feature/themes`
63. Light/dark theme toggle
64. Sepia reading mode
65. Font size controls
66. Layout customization

**Branch:** `feature/accessibility`
67. ARIA labels for screen readers
68. Keyboard navigation
69. Focus indicators
70. High contrast mode

## Database Schema Additions

All new tables use SQLite (no additional cost):

```prisma
// Collections
model Collection {
  id          String   @id @default(cuid())
  name        String
  description String?
  color       String?
  icon        String?
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

// Tags
model Tag {
  id        String     @id @default(cuid())
  name      String     @unique
  color     String?
  createdAt DateTime   @default(now())
  papers    PaperTag[]
}

model PaperTag {
  id      String @id @default(cuid())
  paperId String
  tagId   String
  paper   Paper  @relation(fields: [paperId], references: [id], onDelete: Cascade)
  tag     Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@unique([paperId, tagId])
}

// Notes & Annotations
model Note {
  id        String   @id @default(cuid())
  paperId   String
  paper     Paper    @relation(fields: [paperId], references: [id], onDelete: Cascade)
  content   String   // Markdown content
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Annotation {
  id         String   @id @default(cuid())
  paperId    String
  paper      Paper    @relation(fields: [paperId], references: [id], onDelete: Cascade)
  type       String   // "highlight", "note"
  pageNumber Int?
  position   String?  // JSON: {x, y, width, height}
  content    String?
  color      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// Reading Progress
model ReadingProgress {
  id            String   @id @default(cuid())
  paperId       String   @unique
  paper         Paper    @relation(fields: [paperId], references: [id], onDelete: Cascade)
  pageNumber    Int      @default(1)
  scrollPercent Float    @default(0)
  totalPages    Int?
  lastReadAt    DateTime @updatedAt
  completedAt   DateTime?
}

// Saved Searches
model SavedSearch {
  id          String   @id @default(cuid())
  name        String
  query       String   // JSON search parameters
  createdAt   DateTime @default(now())
  lastUsedAt  DateTime @updatedAt
}

// Add to SavedPaper model
model SavedPaper {
  id        String   @id @default(cuid())
  paperId   String
  paper     Paper    @relation(fields: [paperId], references: [id])
  notes     String?  // User notes
  createdAt DateTime @default(now())
  @@unique([paperId])
}
```

## New Dependencies (All Free)

```json
{
  "dependencies": {
    "next-pwa": "^5.6.0",              // PWA support
    "react-pdf": "^7.5.1",              // PDF viewer
    "pdfjs-dist": "^3.11.174",          // PDF.js
    "tesseract.js": "^5.0.0",           // OCR (client-side, free!)
    "katex": "^0.16.9",                 // Math rendering
    "react-katex": "^3.0.1",            // React wrapper
    "swr": "^2.2.4",                    // Client-side caching
    "zustand": "^4.4.7",                // State management
    "react-markdown": "^9.0.1",         // Markdown rendering
    "remark-gfm": "^4.0.0",             // GitHub Flavored Markdown
    "d3": "^7.8.5",                     // Citation graph visualization
    "react-force-graph": "^1.43.0",     // Graph component
    "export-to-csv": "^1.2.1",          // CSV export
    "papaparse": "^5.4.1"               // CSV parsing
  },
  "devDependencies": {
    "@types/react-pdf": "^7.0.0",
    "@types/d3": "^7.4.3",
    "@types/papaparse": "^5.3.12"
  }
}
```

## Quality Checklist (Per Feature)

Before merging each feature branch:

- [ ] Code works locally
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Mobile responsive (test on iPhone/Android viewport)
- [ ] Desktop functional
- [ ] Accessibility basics (keyboard nav, ARIA)
- [ ] Loading states implemented
- [ ] Error handling in place
- [ ] Database migrations tested
- [ ] No console errors
- [ ] Git commits are clean and semantic
- [ ] README updated if needed

## Next Steps

1. Create `develop` branch from `main`
2. Start with Sprint 1, Feature 1: PWA setup
3. Follow git workflow for each feature
4. Test thoroughly before merging to develop
5. Merge develop to main after each sprint

## Estimated Timeline

- Sprint 1: 1-2 weeks (PWA, gestures, optimizations)
- Sprint 2: 2-3 weeks (Library, collections, export)
- Sprint 3: 2-3 weeks (Figures, citations, summaries)
- Sprint 4: 2-3 weeks (PDF viewer, annotations, notes)
- Sprint 5: 1-2 weeks (Citations, search, recommendations)
- Sprint 6: 1-2 weeks (Progress tracking, themes, accessibility)

**Total: ~12-18 weeks** for all features

## Cost Summary

- Infrastructure: $0 (SQLite + Vercel free tier)
- AI API: Existing cost only
- CDN: $0 (local caching, no external CDN)
- Database: $0 (SQLite)
- Monitoring: $0 (console logging)
- Auth: $0 (no user accounts)

**Total Additional Cost: $0** 🎉
