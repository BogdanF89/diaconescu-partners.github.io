// Aggregates latest legal-relevant articles from external feeds into news.json.
// Run locally:  npm install && npm run fetch-news
// Runs automatically every 6h via .github/workflows/news.yml

import Parser from 'rss-parser';
import { readFile, writeFile } from 'node:fs/promises';

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
  'drept comercial', 'litigiu comercial', 'litigii comerciale',
  'drept civil', 'litigiu civil', 'litigii civile',
  'penal', 'penală', 'penala',
  'legislație', 'legislatie', 'legislativ',
  'recurs în interesul legii', 'recurs in interesul legii', 'recursul în interesul legii', 'recursul in interesul legii',
  'noutăți legislative', 'noutati legislative', 'noutate legislativă', 'noutate legislativa',
  'modificare', 'modificări', 'modificari', 'modificărilor',
  'iccj', 'înalta curte de casație', 'inalta curte de casatie', 'înalta curte',
  'ccr', 'curtea constituțională', 'curtea constitutionala',
  'cjue', 'curtea de justiție', 'curtea de justitie', 'curtea europeană de justiție',
  'concordat preventiv', 'concordatul preventiv', 'concordat', 'concordate',
  'tranzacție', 'tranzactie', 'tranzacții', 'tranzactii',
  'lichidare', 'lichidări', 'lichidari', 'lichidator',
  'datorie', 'datorii', 'datoriei', 'datoriilor',
  'recuperare', 'recuperări', 'recuperari', 'recuperarea',
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

const FETCH_TIMEOUT_MS = 20000;

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'diaconescu-partners-news-bot/1.0 (+https://diaconescu-partners.github.io)' },
});

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function fetchSource(src) {
  try {
    const feed = await withTimeout(parser.parseURL(src.url), FETCH_TIMEOUT_MS, src.label);
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

const freshItems = (await Promise.all(SOURCES.map(fetchSource))).flat();

// Load existing news.json to preserve previously-fetched items
let existingItems = [];
try {
  const raw = await readFile('news.json', 'utf8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed.items)) existingItems = parsed.items;
} catch { /* file missing or malformed — start fresh */ }

// Merge: fresh items take priority; backfill with existing items not already present
const seen = new Set();
const merged = [];
for (const it of [...freshItems, ...existingItems]) {
  if (!seen.has(it.link)) {
    seen.add(it.link);
    merged.push(it);
  }
}

// sort newest first, take top N
merged.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
const items = merged.slice(0, MAX_ITEMS);

const out = {
  generatedAt: new Date().toISOString(),
  count: items.length,
  items,
};

await writeFile('news.json', JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`\nWrote news.json with ${items.length} item(s) (${freshItems.length} fresh, ${existingItems.length} previously stored).`);
// Force exit — hung feed connections can keep the Node.js event loop open indefinitely
process.exit(0);
