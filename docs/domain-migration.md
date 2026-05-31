# Domain migration guide — moving the site to `diaconescu-partners.ro`

This document explains how the legal-news aggregator behaves when the site moves off `*.github.io` to the custom domain `diaconescu-partners.ro`, and what (if anything) you need to change depending on the hosting setup you pick.

## How the news system is wired (recap)

There are three independent pieces:

1. **Aggregator** — `scripts/fetch-news.mjs`, run by `.github/workflows/news.yml` every 6 hours on GitHub's servers. It fetches RSS feeds, filters by keyword, and commits an updated `news.json` to the `main` branch of this repo.
2. **Static file** — `news.json` lives at the root of the repo, gets deployed alongside `index.html`.
3. **Browser renderer** — JS in `index.html` calls `fetch('news.json')` (relative URL) and builds the marquee cards from it.

Key point: the aggregator does **not** run in the visitor's browser, and the renderer uses a **relative path**. Both are host-agnostic.

---

## Scenario A — Custom domain still on GitHub Pages (recommended, zero-effort)

This is the simplest path: keep using GitHub Pages, just point your domain at it.

### Steps
1. In the repo on GitHub: **Settings → Pages → Custom domain** → enter `diaconescu-partners.ro` and save. This creates a `CNAME` file in the repo root.
2. At your DNS provider (where `diaconescu-partners.ro` is registered), add these records:
   - `A` record for `@` → `185.199.108.153`
   - `A` record for `@` → `185.199.109.153`
   - `A` record for `@` → `185.199.110.153`
   - `A` record for `@` → `185.199.111.153`
   - `CNAME` record for `www` → `bogdanf89.github.io.` (or whatever your Pages URL is)
3. Wait for DNS to propagate (minutes to hours), then tick **Enforce HTTPS** in Settings → Pages.

### What changes for the news feed
**Nothing.** The Actions workflow still runs, still commits `news.json`, Pages still serves it. The browser will fetch `https://diaconescu-partners.ro/news.json` automatically because the path is relative.

---

## Chosen setup — `diaconescu-partners.ro` (website on GitHub Pages + email on Google Workspace)

This is the actual decided configuration for the project. The website and email live on two
different services but share one domain; they never conflict because the website uses **A/CNAME**
records and email uses **MX/TXT** records.

### Status / what's already done in the repo
- ✅ `CNAME` file created in repo root containing `diaconescu-partners.ro` (commit `1f6cd17`).
- ✅ `CLAUDE.md` "Deployment" section points to the custom domain.
- ⏳ Pending (done outside the repo): buy the domain, add DNS records, enable HTTPS, set up Workspace.

### Step 1 — Buy the domain (domain-only, decline upsells)
Buy **`diaconescu-partners.ro`** from any `.ro`-capable registrar (Hostico, RoDomeniu, Namecheap,
Cloudflare if it offers `.ro`). Cost ~€7–10/year.

**Buy only the bare domain registration with full DNS management.** Decline every upsell:
- ❌ Web hosting / cPanel / website builder — the site is on GitHub Pages.
- ❌ Email hosting / mailboxes from the registrar — email is on Google Workspace.
- ❌ SSL certificate — GitHub Pages provides free auto-renewing HTTPS.
- ❌ Premium DNS — standard DNS is fine.
- ❌ Dedicated IP — **not needed.** GitHub Pages (website) and Google (email) both run on shared
  infrastructure with excellent reputation. Deliverability comes from SPF/DKIM/DMARC, not a dedicated IP.
- ⚠️ WHOIS/domain privacy — optional, usually free/cheap.

### Step 2 — Point the domain at GitHub Pages
1. GitHub repo **Settings → Pages → Custom domain** → `diaconescu-partners.ro` (the `CNAME` file
   already populates this).
2. Add DNS records at the registrar (website half):

   | Type | Name | Value | Purpose |
   |------|------|-------|---------|
   | A | @ | 185.199.108.153 | GitHub Pages |
   | A | @ | 185.199.109.153 | GitHub Pages |
   | A | @ | 185.199.110.153 | GitHub Pages |
   | A | @ | 185.199.111.153 | GitHub Pages |
   | CNAME | www | `bogdanf89.github.io.` | GitHub Pages (www → apex) |

3. After DNS propagates and GitHub's DNS check passes, tick **Enforce HTTPS** in Settings → Pages.

### Step 3 — Set up email: `office@diaconescu-partners.ro` on Google Workspace
**Plan:** one paid Workspace mailbox (~€5–6/user/month), unified into the client's existing
personal Gmail so she manages both inboxes in one place.

Why a real mailbox (not just forwarding): it's independent of her personal account, can be handed
to staff later, and has proper SPF/DKIM/DMARC so client/court correspondence doesn't land in spam.

**Setup order:**
1. Sign up for **Google Workspace** using `diaconescu-partners.ro` as the domain.
2. Google's wizard gives you a **TXT verification record** + **MX records** + a **DKIM key** —
   add them at the registrar (email half):

   | Type | Name | Value | Purpose |
   |------|------|-------|---------|
   | MX | @ | `smtp.google.com` (priority 1) | Google mail routing |
   | TXT | @ | `v=spf1 include:_spf.google.com ~all` | SPF (anti-spoofing) |
   | TXT | @ | `google-site-verification=…` (from wizard) | Domain ownership |
   | TXT | `google._domainkey` | DKIM key (from Admin → Apps → Gmail → Authenticate email) | DKIM signing |
   | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:office@diaconescu-partners.ro` | DMARC reporting |

   > Note: modern Google Workspace uses a single MX (`smtp.google.com`). Older setups list five
   > `ASPMX.L.GOOGLE.COM` / `ALT1…ALT4` records — either works; follow whatever the wizard shows.

3. Create the user `office@diaconescu-partners.ro` in the Admin console.
4. **Unify into her personal Gmail:** in her Gmail → **Settings → Accounts and Import**:
   - **"Send mail as"** → add `office@diaconescu-partners.ro` (lets her send from that address).
   - **"Check mail from other accounts"** → add `office@…` (pulls its mail into her inbox).
   - She then reads and replies to both addresses from one familiar Gmail inbox, choosing the
     "from" address per message.

### Why website + email don't conflict
- **A records** answer "where is the website?" → GitHub Pages.
- **MX records** answer "where does mail for this domain go?" → Google.
- They're different record types serving different protocols; both live in the same DNS zone.

### Verification checklist
- [ ] `https://diaconescu-partners.ro` loads the homepage.
- [ ] `https://diaconescu-partners.ro/news.json` returns JSON.
- [ ] **Enforce HTTPS** is on; cert covers apex + `www`.
- [ ] Send a test email to `office@diaconescu-partners.ro` — it arrives in her Gmail.
- [ ] Send a test email **from** `office@…` (via Gmail's from-dropdown) — it's not flagged as spam.
- [ ] SPF/DKIM/DMARC pass (check with a tool like mail-tester.com).

---

## Scenario B — Move to a host connected to GitHub (Netlify, Vercel, Cloudflare Pages)

These platforms auto-deploy when the repo changes.

### Steps
1. Sign up for the platform, connect the GitHub repo, set:
   - Build command: *(none)* — this is a static site, no build step.
   - Publish/output directory: *(repo root, usually `.`)*
2. Point `diaconescu-partners.ro` at the platform (they each give you exact DNS instructions).
3. Optionally remove or disable `.github/workflows/deploy.yml` since the new platform takes over deployments.

### What changes for the news feed
**Nothing functionally.** The Actions workflow still commits `news.json` to `main`; the new host detects the push and redeploys. Just confirm **auto-deploy on push** is enabled in the platform's settings (it is by default).

---

## Scenario C — Move to a host NOT connected to GitHub (cPanel, classic shared hosting, FTP-only, VPS without git)

Here the chain breaks: the Actions bot updates `news.json` in the repo, but nothing pushes that file to your server. You need to add a delivery step.

Pick **one** of the options below.

### Option C1 — Add an FTP/SFTP upload step to the Actions workflow (recommended)

Extend `.github/workflows/news.yml` so that after committing `news.json`, it also uploads it to the server.

Example using `SamKirkland/FTP-Deploy-Action`:

```yaml
      - name: Upload news.json to web host
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_HOST }}
          username: ${{ secrets.FTP_USER }}
          password: ${{ secrets.FTP_PASS }}
          local-dir: ./
          server-dir: /public_html/   # adjust to your host's web root
          exclude: |
            **/.git*
            **/.git*/**
            **/node_modules/**
            **/scripts/**
            **/.github/**
            **/dev/**
            **/docs/**
            CLAUDE.md
            package.json
            package-lock.json
```

Then in GitHub repo **Settings → Secrets and variables → Actions**, add three secrets:
- `FTP_HOST` — e.g. `ftp.diaconescu-partners.ro`
- `FTP_USER` — FTP username
- `FTP_PASS` — FTP password (use SFTP if the host supports it)

You can also restrict the upload to just `news.json` by setting `local-dir` and excluding everything else, or use `rsync` over SSH if the host allows it.

### Option C2 — Run the fetcher on the server with a cron job

If the server has Node.js installed and you have SSH access:
1. Copy `scripts/fetch-news.mjs`, `package.json` to the server.
2. Run `npm install` there once.
3. Add a cron entry: `0 */6 * * * cd /path/to/site && /usr/bin/node scripts/fetch-news.mjs > /dev/null 2>&1`
4. Disable `.github/workflows/news.yml` (rename to `news.yml.disabled` or delete it) so you don't have two updaters fighting.

This decouples the news from GitHub entirely.

### Option C3 — Manual upload (only if you rarely update)

Just remember to download `news.json` from the repo and FTP it up periodically. Not recommended — defeats the point of automation.

---

## DNS quick reference

| Record type | Name | Value | Purpose |
|-------------|------|-------|---------|
| A | @ | 185.199.108.153 | GitHub Pages |
| A | @ | 185.199.109.153 | GitHub Pages |
| A | @ | 185.199.110.153 | GitHub Pages |
| A | @ | 185.199.111.153 | GitHub Pages |
| CNAME | www | `<username>.github.io.` | GitHub Pages |

For Netlify/Vercel/Cloudflare or a custom host, follow their docs — they'll give you exact values.

---

## Checklist when you migrate

- [ ] Decide which scenario (A / B / C) applies.
- [ ] Update DNS at the registrar.
- [ ] If leaving GitHub Pages: disable or remove `.github/workflows/deploy.yml`.
- [ ] If host is not connected to GitHub: implement Option C1 (FTP step) or C2 (server cron).
- [ ] Test by visiting `https://diaconescu-partners.ro/news.json` directly — it should return JSON.
- [ ] Test by visiting the homepage — the Legal News section should populate.
- [ ] Update `CLAUDE.md` "Deployment" section to reflect the new setup.
- [ ] If using HTTPS (you should), ensure the certificate covers both `diaconescu-partners.ro` and `www.diaconescu-partners.ro`.

---

## Why the renderer is host-agnostic

In `index.html` the fetch call is:

```js
fetch('news.json', { cache: 'no-cache' })
```

A relative URL like `news.json` resolves against the page's own origin. On `bogdanf89.github.io` it fetches from there; on `diaconescu-partners.ro` it fetches from there. No code change ever needed for a move — only the *delivery* of the file to the new origin matters.
