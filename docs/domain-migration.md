# Domain migration guide — moving the site to `diaconescu-partners.ro`

This document explains how the legal-news aggregator behaves when the site moves off `*.github.io` to the custom domain `diaconescu-partners.ro`, and what (if anything) you need to change depending on the hosting setup you pick.

## How the news system is wired (recap)

There are three independent pieces:

1. **Aggregator** — `scripts/fetch-news.mjs`, run by `.github/workflows/news.yml` every 6 hours on GitHub's servers. It fetches RSS feeds, filters by keyword, and commits an updated `news.json` to the `main` branch of this repo.
2. **Static file** — `news.json` lives at the root of the repo, gets deployed alongside `index.html`.
3. **Browser renderer** — JS in `index.html` calls `fetch('news.json')` (relative URL) and builds the marquee cards from it.

Key point: the aggregator does **not** run in the visitor's browser, and the renderer uses a **relative path**. Both are host-agnostic.

---

## Scenario A — Custom domain still on GitHub Pages (recommended)

This is the chosen hosting path: keep using GitHub Pages, and point the custom domain at it through DNS.

### Steps
1. In the repo on GitHub: **Settings → Pages → Custom domain** → enter `diaconescu-partners.ro` and save. This creates a `CNAME` file in the repo root.
2. At the DNS provider, add these records:
   - `A` record for `@` → `185.199.108.153`
   - `A` record for `@` → `185.199.109.153`
   - `A` record for `@` → `185.199.110.153`
   - `A` record for `@` → `185.199.111.153`
   - `CNAME` record for `www` → `bogdanf89.github.io.` (or whatever your Pages URL is)
3. Wait for DNS to propagate (minutes to hours), then tick **Enforce HTTPS** in Settings → Pages.

### What changes for the news feed
**Nothing.** The Actions workflow still runs, still commits `news.json`, Pages still serves it. The browser will fetch `https://diaconescu-partners.ro/news.json` automatically because the path is relative.

---

## Chosen setup — RedHost hosting + cPanel DNS + GitHub Pages

This is the actual decided configuration for `diaconescu-partners.ro`:

- **Registrar + DNS:** RedHost (basic hosting package). Nameservers: `ns37.roserve.net` / `ns38.roserve.net`. DNS zone managed via cPanel Zone Editor (included in the package — no Cloudflare needed).
- **Website hosting:** GitHub Pages serves the static site (the RedHost hosting account is unused for the website).
- **Email:** RedHost hosting package includes mailboxes; Google Workspace remains an option if a full Workspace suite is preferred later.

RedHost account details:
- IP: `185.181.240.114`
- Username: `diacones`
- cPanel: `https://gts4.roserve.net:2083/`

### Status
- ✅ Domain `diaconescu-partners.ro` registered and active at RedHost.
- ✅ Nameservers already pointing to RedHost (`ns37` / `ns38`) — no registrar change needed.
- ✅ cPanel DNS Zone Editor available for all DNS changes.
- ⏳ **Pending:** redirect A/CNAME records from RedHost server to GitHub Pages IPs, create `CNAME` file in repo, set custom domain in GitHub Pages settings, enable HTTPS.

---

### Step 1 — Point the domain at GitHub Pages (cPanel Zone Editor)

Log in to cPanel at `https://gts4.roserve.net:2083/` → **Zone Editor** → select `diaconescu-partners.ro`.

**Delete or overwrite** the default `A` record for `@` (currently pointing to `185.181.240.114`) and replace with the four GitHub Pages addresses. Then add the `www` alias.

| Type  | Name | Value | Purpose |
|-------|------|-------|---------|
| A     | @    | 185.199.108.153 | GitHub Pages |
| A     | @    | 185.199.109.153 | GitHub Pages |
| A     | @    | 185.199.110.153 | GitHub Pages |
| A     | @    | 185.199.111.153 | GitHub Pages |
| CNAME | www  | `bogdanf89.github.io.` | GitHub Pages (www → apex) |

> cPanel's Zone Editor may only allow one A record per name through the quick-add UI. Use **Manage** (the full record editor) to add all four A records for `@`.

### Step 2 — Create the `CNAME` file in the repo

Create a file named `CNAME` at the repo root containing exactly:

```text
diaconescu-partners.ro
```

Then: `git add CNAME && git commit -m "Add custom domain CNAME" && git push origin main`

### Step 3 — Set the custom domain in GitHub Pages settings

GitHub repo → **Settings → Pages → Custom domain** → enter `diaconescu-partners.ro` and save.

Wait for GitHub's DNS check to pass (can take a few minutes to a few hours), then tick **Enforce HTTPS**.

Do **not** buy an SSL certificate from RedHost. GitHub Pages provides free, auto-renewing HTTPS for custom domains.

---

### Email options

**Option A — Use the RedHost mailbox (already included)**

The basic hosting package includes email hosting. Create `office@diaconescu-partners.ro` directly in cPanel → **Email Accounts**. The default MX records (pointing to RedHost's mail server) are already in the zone; no DNS change needed for email.

To read mail via Gmail (consolidate inboxes), use Gmail → **Settings → Accounts and Import → Check mail from other accounts** (POP3 or IMAP). RedHost's mail server details are typically:
- IMAP: `gts4.roserve.net` port 993 (SSL)
- SMTP: `gts4.roserve.net` port 465 (SSL)

**Option B — Google Workspace (paid, ~€5–6/month)**

Better suited if dedicated SPF/DKIM/DMARC compliance, Google admin tools, or multiple staff mailboxes are needed later. Setup order:

1. Sign up for Google Workspace using `diaconescu-partners.ro` as the domain.
2. Add the records Google's wizard provides into the cPanel Zone Editor:

   | Type | Name | Value | Purpose |
   |------|------|-------|---------|
   | MX | @ | `smtp.google.com` (priority 1) | Google mail routing |
   | TXT | @ | `v=spf1 include:_spf.google.com ~all` | SPF |
   | TXT | @ | `google-site-verification=…` | Domain ownership |
   | TXT | `google._domainkey` | DKIM key (from Admin console) | DKIM signing |
   | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:office@diaconescu-partners.ro` | DMARC reporting |

3. Delete the existing RedHost MX records from the zone (they conflict with Google's MX).
4. Create `office@diaconescu-partners.ro` in the Google Admin console.
5. Unify into personal Gmail via **Settings → Accounts and Import → Send mail as** + **Check mail from other accounts**.

---

### Why website + email don't conflict
- **A/CNAME records** → where is the website → GitHub Pages.
- **MX records** → where does mail go → RedHost mail server (Option A) or Google (Option B).
- They are different record types; both live in the same cPanel DNS zone.

### Why the RSS/news workflow still works
The DNS change only affects where `diaconescu-partners.ro` resolves. The GitHub Actions workflows run on GitHub's servers regardless of DNS:
1. `.github/workflows/news.yml` fetches RSS feeds and commits `news.json` to `main` every 6 hours.
2. GitHub Pages serves the updated site (including `news.json`) at the custom domain.
3. The browser loads `fetch('news.json')` from the current origin — no path change needed.

### Verification checklist
- [ ] All four GitHub Pages A records added in cPanel Zone Editor.
- [ ] CNAME file created in repo root containing `diaconescu-partners.ro`.
- [ ] GitHub Pages custom domain set to `diaconescu-partners.ro`.
- [ ] GitHub's DNS check passes (green tick in Settings → Pages).
- [ ] **Enforce HTTPS** enabled; cert covers apex + `www`.
- [ ] `https://diaconescu-partners.ro` loads the homepage.
- [ ] `https://diaconescu-partners.ro/news.json` returns JSON.
- [ ] Email: send a test message to `office@diaconescu-partners.ro` — it arrives.
- [ ] Email: send a test message **from** `office@…` — it is not flagged as spam.

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

- [ ] Use the chosen setup: RedHost registrar, Cloudflare DNS, GitHub Pages hosting, Google Workspace email.
- [ ] Ask RedHost support to set the Cloudflare nameservers for `diaconescu-partners.ro`.
- [ ] Add website and email DNS records in Cloudflare.
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
