# Publications Section

Section ID: `#publications` — lives in `index.html`.

## Editorial hierarchy (3 tiers)

### 1. Featured card (`.pub-featured`)
Full-width flex layout. CEE Legal Matters 2025 article.
- **Left column** (`.pub-featured-main`): tag (`.pub-tag`, `position: static`), year, title, excerpt (`data-i18n="pub.ex1"`)
- **Right aside** (`.pub-featured-aside`): source name, "Read the article" CTA (`.pub-read-link`, `data-i18n="pub.read"`)
- CTA link: `https://ceelegalmatters.com/magazine-articles/10756-issue-12-8/31330-romania-streamlining-insolvency-prevention-and-insolvency-procedures-by-amending-the-romanian-legislation`

### 2. Supporting grid (3 × `.pub-card`)
Standard card layout, all three have `.pub-excerpt`.

| Card | Year | Source | i18n title key | i18n excerpt key |
|---|---|---|---|---|
| Merged 2023 | 2023 | Juridice.ro · LIR — Law in Review | `pub2.title` | `pub.ex2` |
| BizLawyer 2019 | 2019 | BizLawyer | `pub4.title` | `pub.ex4` |
| Capital 2019 | 2019 | Capital | `pub5.title` | `pub.ex5` |

The 2023 card shows `RO EN` language badges (`.pub-lang-badge`) indicating the same article was published in both languages.

### 3. Archive strip (`.pub-archive`)
Full-width flex, 42% opacity, no hover-lift. 2011 B&M Magazine entry.
- Label: `.pub-archive-label` — `data-i18n="pub.archive"` → "Lucrare de pionierat" / "Foundational work"
- Title key: `pub6.title`
- Source: Business & Money Magazine

---

## i18n keys (publications-specific)

| Key | RO | EN |
|---|---|---|
| `pub.ex1` | Examinează amendamentele legislative recente… | Examines recent legislative amendments streamlining… |
| `pub.ex2` | Analizează instrumentele de avertizare timpurie… | Analyzes the early warning tools available… |
| `pub.ex4` | Analizează modul în care modificările din 2019… | Examines how the 2019 amendments to Law 85/2014… |
| `pub.ex5` | Evaluează consecințele pentru mediul de afaceri… | Assesses the business-facing consequences… |
| `pub.read` | Citește articolul | Read the article |
| `pub.archive` | Lucrare de pionierat | Foundational work |

---

## CSS classes reference

| Class | Purpose |
|---|---|
| `.pub-featured` | Full-width flex wrapper for featured card |
| `.pub-featured-main` | Left content column |
| `.pub-featured-aside` | Right CTA column (border-left hairline) |
| `.pub-excerpt` | Small gray descriptive text below title |
| `.pub-read-link` | Animated arrow CTA link |
| `.pub-lang-badges` | Container for RO/EN badge pills |
| `.pub-lang-badge` | Individual language badge |
| `.pub-archive` | Full-width archive strip (42% opacity) |
| `.pub-archive-label` | Small-caps label ("Lucrare de pionierat") |
