# Diaconescu Partners — Project Brief for AI assistants

## What this is
Single-page website for **Diaconescu Partners**, a Romanian law firm run by **Roxana-Elena Diaconescu**, Attorney at Law and Insolvency Practitioner based in Bucharest. The site is bilingual (RO/EN) and targets both Romanian and international business clients.

## Deployment
- **Host:** GitHub Pages (automatic deploy on push to `main`)
- **Repo:** `https://github.com/BogdanF89/diaconescu-partners.github.io.git`
- **Live URL:** `https://diaconescu-partners.github.io` (or custom domain when configured — see [`docs/domain-migration.md`](docs/domain-migration.md))
- **Workflows:**
  - `.github/workflows/deploy.yml` — pushes to `main` trigger automatic deploy
  - `.github/workflows/news.yml` — refreshes the legal-news feed every 6 hours (see [`docs/news.md`](docs/news.md))
- To deploy: `git add . && git commit -m "message" && git push origin main`

## Tech stack
- Pure HTML/CSS/JS — main site is the single file `index.html`, no build step, no framework
- The only Node dependency is `rss-parser`, used **only** by the news aggregator script (not the website itself)
- Fonts via Google Fonts: **EB Garamond** (display/titles), **Montserrat** (body/nav), **Cinzel** (text logo on service pages)
- Design tokens (colours, fonts, global reset) are centralized in `assets/css/tokens.css`, linked from every production page
- Page-specific CSS, HTML and JS still live inline in each page (deliberate choice for simplicity)

## Design system
Defined once in `assets/css/tokens.css`:
```
--navy:       #0d1b2a   (primary background)
--navy-mid:   #152238
--navy-light: #1e3a5f
--gold:       #b8975a   (accent)
--gold-light: #d4b483
--gold-pale:  #e8d5a8
--white:      #f5f2ec
--cream:      #ede8df
--gray:       #8a9bb0
--font-display / --font-title: 'EB Garamond', Georgia, serif
--font-body:                   'Montserrat', sans-serif
```
Note: the old silver/presentation-mode theme has been removed. There is no colour-scheme toggle.

## File structure
```
index.html                              — entire main site (inline CSS + HTML + JS)
news.json                               — legal-news feed data (auto-refreshed by news.yml)
package.json                            — Node manifest for the news script (rss-parser)
assets/
  css/
    tokens.css                          — shared design tokens + global reset (linked everywhere)
  js/
    site.js                             — shared RO/EN i18n engine for the legal pages
  icons/
    icon-avocat.svg                     — scales of justice icon
    icon-insolventa.svg                 — geometric phoenix icon
  images/
    DP_logo_white.png                   — nav logo (used on homepage, on dark nav)
    DP_logo_dark.png                    — dark logo variant
    DP_logo_transparent.png             — transparent logo variant
    hero-bg.jpeg                        — hero background photo (video fallback)
    roxana-diaconescu.jpg               — profile photo (~1000×1333px)
  video/
    HERO_VIDEO.mp4                       — hero background video (current)
    hero-bg.mp4                          — previous hero video (legacy)
services/
  cabinet-avocat.html                   — Cabinet de Avocat detail page
  cabinet-insolventa.html               — Cabinet Individual de Insolvență detail page
legal/
  gdpr.html
  politica-confidentialitate.html
  politica-cookies.html
  termeni-conditii.html
scripts/
  fetch-news.mjs                        — RSS aggregator → writes news.json
docs/
  services.md                           — service-page structure + practice areas
  publications.md                       — publications section editorial hierarchy
  news.md                               — news aggregator: sources, keywords, how to edit
  domain-migration.md                   — moving to a custom domain
dev/                                    — internal previews / content drafts (not deployed-facing)
.github/workflows/
  deploy.yml                            — GitHub Pages deploy
  news.yml                              — news feed refresh (cron, every 6h)
CLAUDE.md                               — this file
```

## Site sections (in order, index.html)
1. **Custom cursor** — dot + ring, trails mouse, enlarges on hover
2. **Nav** — `DP_logo_white.png` image logo, links with dropdowns (Servicii, Publicații), RO/EN toggle, hamburger (mobile)
3. **Hero** — full-height, background video (`HERO_VIDEO.mp4`, opacity ~0.45), gradient overlay, CTA buttons
4. **Split Cabinets** (`#cabinets`) — two split panels: Cabinet de Avocat (left) + Cabinet Individual de Insolvență (right). Each has a "Detalii servicii" link → respective service detail page
5. **Portfolio** (`#portfolio`) — placeholder ("coming soon")
6. **About** (`#about`) — profile photo + credentials / "Meet the Founder"
7. **Stats** — 4 animated counters (15+ years, 2 qualifications, 10+ industries, 3 languages)
8. **Industries** — dual auto-scrolling marquee
9. **Publications** (`#publications`) — editorial hierarchy (see [`docs/publications.md`](docs/publications.md))
10. **Legal News** (`#news`) — horizontally scrolling cards built from `news.json` (see [`docs/news.md`](docs/news.md))
11. **Resources** (`#resources`) — placeholder ("coming soon")
12. **FAQ** (`#faq`) — tabbed accordion
13. **Careers** (`#cariere`) — placeholder
14. **Contact** (`#contact`) — Address (→ Google Maps), Phone (→ tel:), Email (→ mailto:), contact form
15. **Footer** — brand, navigation, practice areas, copyright

## Service detail pages (`services/`)
See [`docs/services.md`](docs/services.md) for full structure, per-page notes, and the practice-area list. They share the design language and `assets/css/tokens.css`, use a Cinzel text logo, and keep their own inline CSS/JS.

## Bilingual i18n system (homepage)
- Language toggle (RO/EN) in nav switches all content via the JS `i18n` object in `index.html`
- `data-i18n="key"` → `el.textContent`
- `data-i18n-html="key"` → `el.innerHTML`
- `data-i18n-ph="key"` → `el.placeholder`
- Language preference stored in `localStorage` key `'lang'`
- `applyLang(lang)` handles all switching; default language `'ro'`
- Note: service pages read the same `localStorage` key but have a separate, partial i18n implementation.

## Shared i18n engine for inner pages (`assets/js/site.js`)
- The 4 legal pages (`legal/*.html`) use a shared bilingual RO/EN engine instead of duplicating switching logic.
- Contract: each page defines `window.i18n = { ro: {...}, en: {...} }` and optionally `window.i18nTitle = { ro, en }` **before** loading `site.js`. The script reads/writes `localStorage` key `'lang'` (shared with the homepage), default `'ro'`.
- Same attribute contract as the homepage: `data-i18n`→`textContent`, `data-i18n-html`→`innerHTML`, `data-i18n-ph`→`placeholder`. Dense legal sections wrap whole bodies in a `data-i18n-html` `<div>` (fewer keys); CSS selectors are element/class-based so wrapping does not break styling.
- Wires `[data-lang]` nav buttons (adds `.active`), sets `document.title` and `document.documentElement.lang`. Exposes `window.applyLang` / `window.setLang`.
- The RO copy is the canonical legal text; the EN copy is a faithful translation **flagged in each page's dictionary comment as requiring review by counsel** before being relied upon as governing text.
- Service pages (`services/*.html`) are NOT migrated — they keep their own working inline i18n (note: they persist under a different `localStorage` key).

## Hero video
- File: `assets/video/HERO_VIDEO.mp4`
- Centered via `top: 50%; left: 50%; transform: translate(-50%, -50%)`
- `left` is set to `50%` by `alignHeroVideo()` (simplified — no nav measurement)
- Opacity: ~0.45
- Fallback image: `assets/images/hero-bg.jpeg`
- Overlay: `.hero-video-fallback` gradient for depth/readability

## Key JS functions / behaviours
- `applyLang(lang)` — switches all i18n content, sets `document.documentElement.lang`, saves to `localStorage`
- `alignHeroVideo()` — sets video `left: 50%`; called on load + resize
- Scroll reveal — `IntersectionObserver` adds `.visible` to `.reveal`, `.reveal-left`, `.reveal-right` (threshold 0.12)
- Counter animation — `IntersectionObserver` triggers count-up on `.stat-number[data-target]`
- Parallax — hero grid translates on scroll (`scrollY * 0.3`)
- Custom cursor — dot tracks mouse directly; ring interpolates with lerp factor 0.12
- Hamburger menu — slides `#mobileMenu` in/out, locks `body.overflow`
- FAQ tabs — `.faq-tab[data-tab]` switches `.faq-panel` visibility + staggered animation
- FAQ accordion — `.faq-question` opens/collapses `.faq-item` (one open at a time per panel)
- Nav dropdown — CSS `:hover` on `.nav-dropdown` reveals `.nav-dropdown-menu`
- Nav scroll state — `nav.classList.toggle('scrolled', window.scrollY > 60)`
- Industries marquee — CSS `@keyframes marqueeLeft/marqueeRight` (two rows, opposite directions)
- Legal news — XHR `GET news.json`, builds the marquee cards (see [`docs/news.md`](docs/news.md))

## Contact info
- **Address:** Str. Gheorghe Buciumat nr. 26, Bl. A, Et. 4, Ap. 401, Sector 1, București → Google Maps link
- **Phone:** +40 745 755 301 → `tel:+40745755301`
- **Email:** office@diaconescu-partners.ro → `mailto:office@diaconescu-partners.ro`
- All three use the **invisible overlay anchor pattern** (`position: absolute; inset: 0; z-index: 2`) for reliable mobile taps

## Mobile notes
- Hamburger shows at ≤900px (nav links hidden)
- `overflow-x: clip` on html + body prevents horizontal scroll (Android Chrome fix)
- `touch-action: manipulation` + `cursor: pointer` on tel/mailto links for Android tap reliability
- `<meta name="format-detection" content="telephone=no">` prevents iOS auto-linking phone numbers blue
- Nav logo: 96px desktop → 72px (≤900px) → 66px (≤430px); mobile sizing enforced via `nav#mainNav .nav-logo-img` higher-specificity selector + `!important`
- Video switches to `width: 100%; height: auto` on mobile (≤900px)

## Image/asset specs (for future assets)
- **Background video:** 1080p MP4 H.264, < 8MB
- **Background photo (fallback):** 1080×1920px min, JPEG, < 500KB
- **Profile photo:** ~1000×1333px, JPEG 85%, < 300KB
- **Icons (SVG):** tinted gold on service pages via CSS filter

## Known constraints / pending items
- No build pipeline — keep page code inline in `index.html` (or `services/*.html` for detail pages); shared tokens go in `assets/css/tokens.css`
- No backend — contact form is UI-only (no submission handler yet)
- Legal news is auto-refreshed from RSS into `news.json`; publication cards are still hardcoded in HTML
- Portfolio, Resources, Careers sections are placeholders — content not yet added
- `HERO_VIDEO.mp4` is heavy for mobile — consider compressing if load speed becomes an issue
- Service pages have only partial i18n — language switching is most complete on the homepage
