// Aggregates latest legal-relevant articles from external feeds into news.json.
// Run locally:  npm install && npm run fetch-news
// Runs automatically every 6h via .github/workflows/news.yml

import Parser from 'rss-parser';
import { readFile, writeFile } from 'node:fs/promises';

// Each source has a `lang` field — items are tagged and served per-language in the UI.
// To add a new source: append an entry with a working RSS/Atom feed URL.
// Sources that fail (timeout, 404, non-RSS response) are skipped with a warning; they
// do not break the run — fix the URL and the next scheduled run picks up correctly.
const SOURCES = [
  // ── Romanian sources ──────────────────────────────────────────────────────
  { label: 'Juridice.ro',         url: 'https://www.juridice.ro/feed/',          lang: 'ro' },
  { label: 'Universul Juridic',   url: 'https://www.universuljuridic.ro/feed/',  lang: 'ro' },
  { label: 'Ziarul Financiar',    url: 'https://www.zf.ro/rss/',                 lang: 'ro' },
  { label: 'Economica.net',       url: 'https://www.economica.net/rss/',          lang: 'ro' },
  // mfinante.gov.ro: Liferay portal — update the URL below once the correct RSS path is confirmed
  { label: 'Min. Finantelor',     url: 'https://mfinante.gov.ro/ro/presa-comunicate-de-presa/-/asset_publisher/vMeOfqIFpa30/rss_rss.rss', lang: 'ro' },
  // ── English sources ───────────────────────────────────────────────────────
  // Legal 500 blog / developments — confirmed working RSS
  { label: 'Legal 500',           url: 'https://www.legal500.com/developments/feed/', lang: 'en' },
  // IFLR1000 jurisdiction news — valid RSS; filtered to Romania by EN_KEYWORDS
  { label: 'IFLR1000',            url: 'https://www.iflr1000.com/Rss/RssFeed?articleTypeId=72', lang: 'en' },
  // CEE Legal Matters — Cloudflare-protected; update URL if their public feed path is found
  { label: 'CEE Legal Matters',   url: 'https://ceelegalmatters.com/feed/',      lang: 'en' },
  // The following sources did not expose a public RSS feed at time of setup.
  // Un-comment and supply the correct feed URL when one becomes available:
  // { label: 'GovNet',           url: 'https://www.govnet.ro/???/feed/',         lang: 'en' },
  // { label: 'WhichLawyer',      url: 'https://www.whichlawyer.ro/???/feed/',    lang: 'en' },
  // { label: 'ECHR',             url: 'https://hudoc.echr.coe.int/???/rss.xml',  lang: 'en' },
  // { label: 'IFLR1000 Romania', url: 'https://www.iflr1000.com/Jurisdiction/romania/???', lang: 'en' },
];

const RO_KEYWORDS = [
  'insolventa', 'insolventei',
  'fiscal', 'fiscala', 'fiscalitate',
  'drept comercial', 'litigiu comercial', 'litigii comerciale',
  'drept civil', 'litigiu civil', 'litigii civile',
  'penal', 'penala',
  'legislatie', 'legislativ',
  'recurs in interesul legii', 'recursul in interesul legii',
  'noutati legislative', 'noutate legislativa',
  'modificare', 'modificari',
  'iccj', 'inalta curte de casatie', 'inalta curte',
  'ccr', 'curtea constitutionala',
  'cjue', 'curtea de justitie', 'curtea europeana de justitie',
  'concordat preventiv', 'concordat', 'concordate',
  'tranzactie', 'tranzactii',
  'lichidare', 'lichidari', 'lichidator',
  'datorie', 'datorii',
  'recuperare', 'recuperari',
];

const EN_KEYWORDS = [
  'insolvency', 'insolvent', 'insolvencies',
  'restructuring', 'reorganization', 'reorganisation',
  'fiscal', 'tax', 'taxation', 'transfer pricing',
  'commercial law', 'commercial dispute', 'commercial litigation',
  'civil law', 'civil litigation',
  'criminal law', 'criminal proceedings',
  'legislation', 'legislative', 'regulation', 'directive', 'law reform',
  'court ruling', 'judgment', 'ruling', 'case law',
  'amendment', 'amendments', 'legal reform',
  'supreme court', 'constitutional court',
  'cjeu', 'court of justice', 'european court',
  'liquidation', 'liquidator', 'winding up',
  'debt', 'recovery', 'enforcement',
  'romania', 'romanian',
];

const MAX_ITEMS_PER_LANG = 12;
const MAX_PER_SOURCE = 6;
const EXCERPT_LEN = 180;

const stripDiacritics = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
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

function matchesKeywords(item, lang) {
  const haystack = norm(`${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''} ${item.categories?.join(' ') || ''}`);
  if (lang === 'en') {
    // EN feeds are global — require a Romania-related term plus at least one legal topic.
    if (!['romania', 'romanian'].some((kw) => haystack.includes(kw))) return false;
    return EN_KEYWORDS.some((kw) => haystack.includes(norm(kw)));
  }
  return RO_KEYWORDS.some((kw) => haystack.includes(norm(kw)));
}

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
      .filter((item) => matchesKeywords(item, src.lang))
      .slice(0, MAX_PER_SOURCE)
      .map((it) => {
        const excerpt = stripHtml(it.contentSnippet || it.content || it.summary || '');
        return {
          lang: src.lang,
          source: src.label,
          title: stripHtml(it.title || '').slice(0, 200),
          link: it.link,
          date: it.isoDate || it.pubDate || null,
          excerpt: excerpt.length > EXCERPT_LEN ? excerpt.slice(0, EXCERPT_LEN).replace(/\s+\S*$/, '') + '...' : excerpt,
        };
      })
      .filter((it) => it.title && it.link);
    console.log(`[ok]  ${src.label} (${src.lang}): ${items.length} matching items`);
    return items;
  } catch (err) {
    console.warn(`[warn] ${src.label} failed: ${err.message}`);
    return [];
  }
}

const freshItems = (await Promise.all(SOURCES.map(fetchSource))).flat();

let existingItems = [];
try {
  const raw = await readFile('news.json', 'utf8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed.items)) existingItems = parsed.items;
} catch { /* file missing or malformed — start fresh */ }

// Merge per-lang: fresh items take priority; backfill with existing items not already present.
// Items without `lang` (legacy) are treated as 'ro' for backward compatibility.
function mergeLang(lang) {
  const seen = new Set();
  const merged = [];
  const freshForLang = freshItems.filter((it) => it.lang === lang);
  const existingForLang = existingItems.filter((it) => {
    if (!it.lang && lang === 'ro') return true;
    if (it.lang !== lang) return false;
    // Re-validate cached EN items against the Romania requirement to purge stale content.
    if (lang === 'en') {
      const h = norm(`${it.title || ''} ${it.excerpt || ''}`);
      return ['romania', 'romanian'].some((kw) => h.includes(kw));
    }
    return true;
  });
  for (const it of [...freshForLang, ...existingForLang]) {
    if (!seen.has(it.link)) {
      seen.add(it.link);
      merged.push(it);
    }
  }
  merged.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return merged.slice(0, MAX_ITEMS_PER_LANG);
}

const roItems = mergeLang('ro');
const enItems = mergeLang('en');
const items = [...roItems, ...enItems];

const out = {
  generatedAt: new Date().toISOString(),
  count: items.length,
  items,
};

await writeFile('news.json', JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`\nWrote news.json with ${items.length} item(s) (${roItems.length} RO, ${enItems.length} EN).`);
// Force exit — hung feed connections can keep the Node.js event loop open indefinitely
process.exit(0);
