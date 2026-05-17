# Diaconescu Partners — Project Brief for Claude

## What this is
Single-page website for **Diaconescu Partners**, a Romanian law firm run by **Roxana-Elena Diaconescu**, Attorney at Law and Insolvency Practitioner based in Bucharest. The site is bilingual (RO/EN) and targets both Romanian and international business clients.

## Deployment
- **Host:** GitHub Pages (automatic deploy on push to `main`)
- **Repo:** `https://github.com/BogdanF89/diaconescu-partners.github.io.git`
- **Live URL:** `https://diaconescu-partners.github.io` (or custom domain when configured)
- **Workflow:** `.github/workflows/deploy.yml` — pushes to `main` trigger automatic deploy
- To deploy: `git add . && git commit -m "message" && git push origin main`

## Tech stack
- Pure HTML/CSS/JS — single file `index.html`, no build step, no framework
- Fonts: **EB Garamond** (display/titles) + **Montserrat** (body/nav) + **Cinzel** (logo SVG text) via Google Fonts
- All content lives in `index.html` — CSS, HTML and JS in one file (deliberate choice for simplicity)

## Design system
```
--navy:      #0d1b2a   (primary background)
--navy-mid:  #152238
--navy-light: #1e3a5f
--gold:      #b8975a   (accent — switches to silver in presentation mode)
--gold-light: #d4b483
--white:     #f5f2ec
--gray:      #8a9bb0
```
Silver theme override: `:root.silver-theme` sets gold vars to `#96afc0` palette — toggled by the gold/silver dots button in the nav.

## File structure
```
index.html                          — entire site
background_video.mp4                — hero background video (9MB)
background1.jpeg                    — hero background photo (fallback, kept)
roxana_diaconescu_front.jpg         — profile photo (1280×854px)
files/
  diaconescu-avocat-icon.svg        — scales of justice icon (no shield)
  diaconescu-insolventa-icon.svg    — geometric phoenix icon
.github/workflows/deploy.yml        — GitHub Pages deploy workflow
header-preview.html                 — logo options preview (internal use)
font-preview.html                   — font options preview (internal use)
diaconescu-logos.html               — logo options source (internal use)
```

## Site sections (in order)
1. **Nav** — Logo (geometric crest SVG + "Diaconescu Partners"), links, RO/EN toggle, gold/silver toggle, hamburger (mobile)
2. **Hero** — Full-height, background video (opacity 0.6), gradient overlay, CTA buttons pinned to bottom-left
3. **Services** — Two split panels: Cabinet de Avocat (left) + Cabinet Individual de Insolvență (right)
4. **About / Meet the Founder** — Profile photo + credentials
5. **Stats** — 4 counters (15+ years, 2 qualifications, 10+ industries, 3 languages)
6. **Industries** — Dual auto-scrolling marquee
7. **Publications / Articles** — 6 publication cards
8. **Legal News** — Horizontally scrolling news cards with category tags (Civil/Comercial/Insolvență/Penal/Legislație)
9. **Contact** — Address (→ Google Maps), Phone (→ tel:), Email (→ mailto:), contact form
10. **Footer** — Brand, navigation, practice areas, copyright

## Bilingual i18n system
- Language toggle (RO/EN) in nav switches all content via JS `i18n` object
- `data-i18n="key"` → `textContent`, `data-i18n-html="key"` → `innerHTML`, `data-i18n-ph="key"` → `placeholder`
- Language preference stored in `localStorage`
- `applyLang(lang)` function in JS handles all switching

## Hero video
- File: `background_video.mp4`
- CSS: `height: 100%; width: auto` on desktop (fills height, width proportional)
- CSS: `width: 100%; height: auto` on mobile ≤900px
- Centered via `top: 50%; left: 50%; transform: translate(-50%, -50%)`
- `left` value dynamically set by JS `alignHeroVideo()` to match center of nav links (between "D" in Despre and "t" in Contact)
- Opacity: 0.6
- Overlay: `.hero-video-fallback` gradient for depth/readability

## Key JS functions
- `applyLang(lang)` — switches all i18n content
- `alignHeroVideo()` — measures nav links, centers video precisely underneath; falls back to 50% on mobile
- `alignHeroBg()` — defunct (was for image, removed)
- Gold/silver toggle — `document.documentElement.classList.toggle('silver-theme')`, persisted in `sessionStorage`
- Scroll reveal — IntersectionObserver adds `.visible` to `.reveal` elements
- Hamburger menu — slides down from top, `pointer-events: none` when closed

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
- Video switches to `width: 100%; height: auto` on mobile

## Image specs (for future assets)
- **Background photo/video:** 9:16 portrait ratio, 1080×1920px min, < 500KB for photos, < 8MB for video
- **Profile photo:** ~1000×1333px, JPEG 85%, < 300KB
- **Background video:** 1080p MP4 H.264, < 8MB

## Presentation mode
A gold/silver colour scheme toggle (two dots next to RO/EN) swaps all gold accents to steel-blue silver (`#96afc0`). Persists for the browser session only — always resets to gold for new visitors.

## Known constraints
- No build pipeline — keep everything in `index.html`
- No backend — contact form is UI-only (no submission handler yet)
- News section items are hardcoded — update manually in HTML when news changes
- `background_video.mp4` at 9MB is heavy for mobile — consider compressing if load speed becomes an issue
