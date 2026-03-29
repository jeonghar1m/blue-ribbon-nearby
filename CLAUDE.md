# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Blue Ribbon Nearby** is a Next.js 16 web application that helps users find nearby Blue Ribbon restaurants in South Korea. It supports two search modes:
1. **Zone-based search**: Search by location/zone name (e.g., "강남역", "광화문")
2. **GPS-based search**: Find restaurants near the user's real-time coordinates using the browser's Geolocation API

The app proxies requests to the Blue Ribbon API (`bluer.co.kr`) through Next.js Route Handlers to avoid CORS/403 issues.

## Quick Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Run ESLint
```

## Critical Architecture Notes

### Next.js 16 Breaking Changes
**IMPORTANT**: This project uses Next.js 16.2.1 with breaking changes from earlier versions. Before writing any code:
- Read relevant guides in `node_modules/next/dist/docs/` before implementing features
- Server Components are the default (async functions with `await params`)
- Dynamic route params are **Promises** that must be awaited:
  ```typescript
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```
- Route Handlers also receive `params` as a Promise (second parameter in context object)

See AGENTS.md for additional breaking change warnings.

## API Architecture

### Route Handlers as CORS Proxy

All external API calls to bluer.co.kr go through Next.js Route Handlers to bypass CORS/403 blocks. The pattern:
1. Client calls our `/api/...` endpoint
2. Route Handler fetches from bluer.co.kr with browser-mimicking headers (User-Agent, Referer, Accept-Language)
3. Route Handler processes response and returns JSON

**Key headers** in `app/_lib/constants.ts`:
```typescript
BLUERIBBON_HEADERS: {
  "User-Agent": "Mozilla/5.0 ...",
  Referer: "https://www.bluer.co.kr/search",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8"
}
```

### Endpoints

| Endpoint | Purpose | Pattern |
|----------|---------|---------|
| `GET /api/zones?query=...` | Search zones by name | HTML parsing + JSON response |
| `GET /api/restaurants?...` | Search restaurants (zone or GPS-based) | Query forwarding with bounding box calculation |
| `GET /api/restaurants/[id]` | Get single restaurant details | HTML parsing + JSON response |

## Code Organization

### `app/_lib/` - Core Utilities
- **types.ts**: TypeScript interfaces (`Zone`, `Restaurant`, `RestaurantDetail`, filters)
- **constants.ts**: API base URL, headers, filter options
- **geo.ts**: Geolocation helpers (`getBoundingBox`, `haversineDistance`)
- **scraper.ts**: HTML parsing for restaurant detail pages (regex-based, defensive)

### `app/api/` - Route Handlers
- **zones/route.ts**: Parses bluer.co.kr/search/zone HTML, returns zones with optional query filter
- **restaurants/route.ts**: Proxies restaurant search (zone or GPS mode)
- **restaurants/[id]/route.ts**: Proxies restaurant detail fetching

### `app/_components/` - UI Components
- **SearchSection.tsx** (Client): Main search UI—handles state, filters, GPS, results grid
- **RestaurantCard.tsx**: Restaurant card display with Link to detail page
- **RibbonBadge.tsx**: Ribbon icon rendering (1/2/3 ribbons with colors)

### `app/restaurants/[id]/` - Detail Page
- **page.tsx** (Server Component): Displays full restaurant details from scraper

### Root Layout & Styles
- **layout.tsx**: Korean lang, metadata
- **globals.css**: CSS custom properties for ribbon colors, Tailwind v4 config
- **page.tsx**: Home page with SearchSection

## Data Flow

### Search & Results
```
User input → SearchSection → /api/zones or /api/restaurants
  → Route Handler fetches bluer.co.kr
  → Response parsed/processed
  → JSON returned to client
  → Results sorted by haversine distance
  → RestaurantCard rendered (links to detail page)
```

### Detail Page
```
User clicks card → /restaurants/[id]
  → Server Component awaits params
  → fetchRestaurantDetail(id) calls scraper
  → Scraper fetches & parses HTML from bluer.co.kr
  → Detail page renders full restaurant info
```

## HTML Parsing Strategy

Restaurant detail pages (`bluer.co.kr/restaurants/{id}`) are server-rendered HTML with no JSON API. The scraper uses regex-based defensive parsing:
- Each field extraction wrapped with null fallback
- HTML entities decoded (`&amp;`, `&lt;`, etc.)
- Line breaks (`<br>`) converted to `\n`
- Missing fields result in `null` (not crashes)

Example pattern: `icon_location\.png"[^>]*\/>\s*<div\s+class="content">([\s\S]*?)<\/div>`

## Development Workflow

### Adding a New Search Filter
1. Add filter option to `app/_lib/constants.ts`
2. Add state to `SearchSection.tsx`
3. Pass filter param to `/api/restaurants` query
4. Update route handler logic in `app/api/restaurants/route.ts`

### Adding Restaurant Detail Fields
1. Add field to `RestaurantDetail` in `app/_lib/types.ts`
2. Add regex pattern in `scraper.ts` parseDetail function
3. Render field in detail page `app/restaurants/[id]/page.tsx`

### Testing API Endpoints
```bash
# Start dev server
npm run dev

# In another terminal, test zones API
curl "http://localhost:3000/api/zones?query=강남역"

# Test restaurant detail API
curl "http://localhost:3000/api/restaurants/27144"
```

## Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss`
- CSS custom properties for theme colors (in globals.css):
  - `--primary`, `--primary-light`: Primary blue
  - `--ribbon-gold`, `--ribbon-silver`, `--ribbon-bronze`: Ribbon colors
- No dark mode support
- Korean-friendly font stack (Apple SD Gothic Neo, Malgun Gothic)

## Key Files to Understand First

When working on this project, read these files in order:
1. `AGENTS.md` - Next.js 16 breaking changes
2. `app/_lib/types.ts` - All type definitions
3. `app/_lib/constants.ts` - API configuration
4. `app/api/restaurants/route.ts` - Core search logic
5. `app/_lib/scraper.ts` - HTML parsing pattern (if modifying detail fields)

## Commit Message Convention

Use the following prefixes in commit messages to categorize changes:

| Prefix | Usage | Example |
|--------|-------|---------|
| `feat:` | New feature | `feat: add restaurant detail page` |
| `fix:` | Bug fix | `fix: correct haversine distance calculation` |
| `refactor:` | Code refactoring (no feature/fix) | `refactor: extract scraper utilities` |
| `style:` | Styling changes (CSS, Tailwind) | `style: update ribbon badge colors` |
| `docs:` | Documentation updates | `docs: update API endpoint examples` |
| `chore:` | Maintenance, deps, config | `chore: update Next.js to 16.2.1` |
| `test:` | Add/update tests | `test: add restaurant search tests` |
| `perf:` | Performance improvements | `perf: optimize HTML parsing regex` |

**Format**: `<prefix>: <short description>`

Always set the commit author to:
- **Name**: `Jeong Harim`
- **Email**: `me@jeongharim.dev`

Always end with:
```
Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

## Common Pitfalls

1. **Forgetting `await params`**: Dynamic route params are Promises in Next.js 16
2. **Missing browser headers**: bluer.co.kr returns 403 without proper User-Agent/Referer
3. **Regex parsing fragility**: HTML structure can change; always provide null fallback
4. **CORS confusion**: All external API calls must go through Route Handlers, never from client
5. **Image proxying**: Restaurant images from bluer.co.kr may need CORS headers; currently using direct image URLs
