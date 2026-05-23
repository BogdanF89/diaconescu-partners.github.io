// Aggregates latest legal-relevant articles from external feeds into news.json.
// Run locally:  npm install && npm run fetch-news
// Runs automatically every 6h via .github/workflows/news.yml

import Parser from 'rss-parser';
import { writeFile } from 'node:fs/promises';

// Edit this list to change sources. `label` is shown on the card as the source tag.
// Each entry must point to a working RSS/Atom feed URL.
const SOURCES = [
  { label: 'Juridice.ro',         url: 'https://www.juridice.ro/feed/' },
  { label: 'Universul Juridic',   url: 'https://www.universuljuridic.ro/feed/' },
  { label: 'Ziarul Financiar',    url: 'https://www.zf.ro/rss/' },
  { label: 'Economica.net',       url: 'https://www.economica.net/rss/' },
  // Add a 5th source here when you find a reliable feed, e.g.:
  // { label: 'Avocatnet',        url: 'https://www.avocatnet.ro/rss/legislatie/' },
];

// Only items whose title or description contains one of these keywords are kept.
// Match is case-insensitive and diacritic-insensitive.
const KEYWORDS = [
  'insolvență', 'insolventa', 'insolvenței', 'insolventei',
  'fiscal', 'fiscală', 'fiscala', 'fiscalitate',
  'comercial', 'comerciala', 'comercială',
  'civil', 'civilă', 'civila',
  'penal', 'penală', 'penala',
  'legislație', 'legislatie', 'legislativ',
];

const MAX_ITEMS = 12;
const MAX_PER_SOURCE = 6;            // cap per feed before final merge
const EXCERPT_LEN = 180;

const stripDiacritics = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const norm = (s) => stripDiacritics((s || '').toLowerCase());

const stripHtml = (s) => (s || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
  .trim();

const matchesKeywords = (item) => {
  const haystack = norm(`${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''} ${item.categories?.join(' ') || ''}`);
  return KEYWORDS.some((kw) => haystack.includes(norm(kw)));
};

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'diaconescu-partners-news-bot/1.0 (+https://diaconescu-partners.github.io)' },
});

async function fetchSource(src) {
  try {
    const feed = await parser.parseURL(src.url);
    const items = (feed.items || [])
      .filter(matchesKeywords)
      .slice(0, MAX_PER_SOURCE)
      .map((it) => {
        const excerpt = stripHtml(it.contentSnippet || it.content || it.summary || '');
        return {
          source: src.label,
          title: stripHtml(it.title || '').slice(0, 200),
          link: it.link,
          date: it.isoDate || it.pubDate || null,
          excerpt: excerpt.length > EXCERPT_LEN ? excerpt.slice(0, EXCERPT_LEN).replace(/\s+\S*$/, '') + '…' : excerpt,
        };
      })
      .filter((it) => it.title && it.link);
    console.log(`[ok]  ${src.label}: ${items.length} matching items`);
    return items;
  } catch (err) {
    console.warn(`[warn] ${src.label} failed: ${err.message}`);
    return [];
  }
}

const all = (await Promise.all(SOURCES.map(fetchSource))).flat();

// dedupe by link
const seen = new Set();
const unique = all.filter((it) => {
  if (seen.has(it.link)) return false;
  seen.add(it.link);
  return true;
});

// sort newest first, take top N
unique.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
const items = unique.slice(0, MAX_ITEMS);

const out = {
  generatedAt: new Date().toISOString(),
  count: items.length,
  items,
};

await writeFile('news.json', JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`\nWrote news.json with ${items.length} item(s).`);
