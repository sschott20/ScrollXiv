# Changelog

All notable changes to ScrollXiv will be documented in this file.

## [2.0.0] - 2026-02-16

### 🎉 Major Features Added

#### Progressive Web App (PWA)
- **Install as App**: ScrollXiv can now be installed on your home screen (iOS/Android)
- **Offline Support**: Browse previously viewed papers without internet connection
- **Smart Caching**:
  - arXiv API responses cached for 7 days
  - Figure images cached for 30 days
  - AI summaries cached for 30 days (immutable)
  - Feed data cached for 1 hour with network-first strategy
- **Install Prompt**: Auto-appears after 30 seconds (can be dismissed)

#### Enhanced Touch Gestures
- **Pull-to-Refresh**: Swipe down at top of feed to reload latest papers
- **Swipe on Cards**:
  - Swipe right → Save paper (heart icon)
  - Swipe left → Discard paper (X icon)
- **Haptic Feedback**: Tactile confirmation on supported devices
- **Visual Feedback**: Icons reveal and scale based on swipe progress

#### Library & Organization
- **Library View**:
  - Grid/list layout toggle (responsive: 1/2/3 columns)
  - Full-text search across titles and abstracts
  - Sort by date saved, date published, or title
  - Filter by category
  - Pagination (12 papers per page)
  - Click to open full paper details

- **Collections System**:
  - Create custom collections to organize papers
  - 15 icon options (📚, 📖, 📝, 🔖, ⭐, etc.)
  - 11 color options for visual organization
  - Add/remove papers from multiple collections
  - Edit and delete collections
  - Paper count tracking per collection

- **Tags System**:
  - Autocomplete tag input with inline creation
  - Add/remove multiple tags per paper
  - Color-coded tags
  - Usage count tracking
  - Search and filter by tags

#### Export & Import
- **Export Formats**:
  - **JSON**: Full backup with all metadata and AI summaries
  - **CSV**: Lightweight metadata (title, authors, arxivId, etc.)
  - **BibTeX**: Academic citation format for reference managers
  - **Markdown**: Human-readable reading list organized by category
- **Import Sources**:
  - **arXiv IDs**: Flexible parsing (URLs, plain IDs, comma/line-separated)
  - **BibTeX**: Automatic arXiv ID extraction from citations
  - **JSON**: Full restoration from backup
- **Features**:
  - Filter by collection or tag before export
  - Automatic deduplication
  - Optional automatic save to library
  - Batch processing

#### Theme System
- **3 Themes**:
  - **Dark**: Default slate 900/800 palette (easy on the eyes)
  - **Light**: Clean white/slate with high contrast
  - **Sepia**: Warm beige tones for comfortable long reading
- **4 Font Sizes**: Small, Medium, Large, Extra Large
- **Persistent**: Preferences saved in localStorage
- **Smooth Transitions**: Instant theme changes without reload

### 🗄️ Database Enhancements
- **New Tables**:
  - `Collection`: Custom paper collections
  - `PaperCollection`: Many-to-many paper-collection relation
  - `Tag`: Custom tags with colors
  - `PaperTag`: Many-to-many paper-tag relation
  - `Note`: Markdown notes for papers
  - `Annotation`: PDF annotations with position data
  - `ReadingProgress`: Track reading position and completion
  - `SavedSearch`: Save and reuse search queries

### 🎨 UI/UX Improvements
- **Bottom Navigation**: Added Library and Theme tabs
- **Collection Manager**: Modal for managing collections
- **Tag Input**: Autocomplete with real-time suggestions
- **Theme Settings**: Modal for theme and font size selection
- **Export/Import Modal**: Tabbed interface for data management
- **Loading States**: Skeleton loaders and progress indicators throughout
- **Empty States**: Helpful messages when no content available
- **Error Handling**: User-friendly error messages with retry options

### 🏗️ Technical Improvements
- **API Routes**: 15+ new endpoints for collections, tags, library, export/import
- **Service Functions**: Helper functions in `papers.ts` for common operations
- **TypeScript Types**: Added Tag and Collection interfaces
- **Utilities**:
  - `haptics.ts`: Haptic feedback utility with 6 feedback types
  - `export.ts`: Export formatters for all supported formats
  - `import.ts`: Import parsers with validation
- **Context**: ThemeContext for global theme state
- **Dependencies**: Added next-pwa, papaparse, export-to-csv

### 📝 Documentation
- Created comprehensive improvement plan
- Added implementation plan (zero-cost features)
- Updated README with new features (pending)
- Added CHANGELOG.md (this file)

### 🔧 Configuration
- **PWA Config**: next-pwa with runtime caching strategies
- **Manifest**: App manifest for home screen installation
- **Icons**: SVG app icon with PNG fallbacks (placeholder)
- **CSS Variables**: Theme-aware color system

### Git Workflow
- Proper feature branching (feature/*, develop, main)
- Semantic commit messages (feat, fix, docs, etc.)
- No-fast-forward merges for clean history
- Comprehensive commit descriptions

---

## [1.0.0] - 2025-01-XX (Previous Version)

### Initial Features
- TikTok-style scrolling interface
- AI-powered summaries (quick + deep dive)
- Figure extraction from ar5iv
- Natural language search
- Save/discard papers
- Paper detail view
- Prefetching for smooth browsing
- Mobile-optimized layout
- Desktop responsive design

---

## Future Roadmap

### Planned Features
- **Enhanced Figures**: OCR text extraction, multi-figure carousel, categorization
- **Citation Network**: Integration with Semantic Scholar API for citation graphs
- **PDF Viewer**: In-app PDF viewing with annotations and highlights
- **Recommendations**: AI-based paper recommendations
- **Advanced Search**: More filters (date range, author, citation count)
- **Reading Analytics**: Personal stats and visualizations
- **Sharing**: Share papers and collections with others

### Considered but Not Implemented (Require Paid Services)
- Cross-device sync (requires cloud database)
- User authentication (would need cloud service)
- Email notifications (requires email service)
- CDN for images (keeping local caching)
- External monitoring (using console logging instead)
