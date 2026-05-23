# Service Detail Pages

Both pages live in `services/` and are linked from the split-cabinet panels in `index.html`.

## Shared pattern
- Inline CSS + HTML + JS — no external deps beyond Google Fonts
- Nav: logo (→ `../index.html`) + back link (→ `../index.html#cabinets`) + RO/EN toggle
- Hero: SVG icon, eyebrow line, italic EB Garamond quote
- Content sections with scroll-reveal (`.reveal` → `.visible` via `IntersectionObserver`)
- Icon tinted gold via CSS filter:
  ```css
  filter: brightness(0) saturate(100%) invert(70%) sepia(30%) saturate(400%) hue-rotate(5deg);
  ```
- `data-i18n` → `el.innerHTML` (titles may contain HTML entities like `&amp;`)
- Language synced via `localStorage` key `'lang'`
- Asset paths use `../assets/icons/`

---

## cabinet-avocat.html

- **Hero quote:** "Justiția, Gardianul Libertății"
- **Icon:** `../assets/icons/icon-avocat.svg` (scales of justice, viewBox `138 100 124 100`)
- **Structure:** Intro paragraph → 9 practice areas in a numbered grid (`.practice-item` with staggered scroll-reveal)

### Practice areas (in order)
1. Civil, Comercial & Societar
2. Recuperări creanțe & Executări silite
3. Litigii & Arbitraj
4. Contravențional & Penal
5. Muncă & Relații de muncă
6. Construcții, Infrastructură & Imobiliare
7. Tehnologie & Protecția datelor
8. Contencios Administrativ & Fiscal
9. Asigurări

---

## cabinet-insolventa.html

- **Hero quote:** "Egalitate în fața Legii"
- **Icon:** `../assets/icons/icon-insolventa.svg` (geometric phoenix, viewBox `100 75 200 255`)
- **Structure:** Two content sections

### Section 1 — "Principii generale / General principles"
3 paragraphs on equity and impartiality. Heading uses `data-i18n-html` (contains `<em>` tag).

### Section 2 — "Ce facem / What we do"
5 paragraphs on strategic and operational approach. Heading uses `data-i18n-html` (contains `<em>` tag).

**Note:** No service grid on this page (services are already listed in the main split panel on `index.html`).
