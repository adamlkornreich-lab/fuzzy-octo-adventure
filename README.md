# Pirates of Ybor

Website for the Pirates of Ybor krewe (Piratesofybor.com): a public home page,
member sign-up and sign-in, and a members-only page.

Plain HTML/CSS/JS with no build step. It's published to GitHub Pages by
`.github/workflows/pages.yml` on every push to `main`. Sign-in uses
[Supabase](https://supabase.com) (free tier).

## Edit the site

- **Events, contact email:** `config.js`
- **Text:** `index.html`
- **Look:** `assets/style.css`
- **Members-only posts:** in Supabase, open Table Editor → `member_posts` → Insert row

## One-time setup

### 1. Turn on GitHub Pages
Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Then re-run the "Publish site" workflow (Actions tab), or push to `main`.
The site will be at `https://adamlkornreich-lab.github.io/fuzzy-octo-adventure/`.

### 2. Turn on sign-in (Supabase)
1. Create a free project at supabase.com.
2. **SQL Editor:** paste and run `supabase/setup.sql`.
3. **Authentication → URL Configuration:** set *Site URL* to your site's address
   (for example `https://adamlkornreich-lab.github.io/fuzzy-octo-adventure/`) and add
   `…/members.html` under *Redirect URLs*.
4. **Settings → API:** copy the *Project URL* and the *anon public* key into
   `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `config.js`, then push.

The anon key is meant to be public. Members-only data is protected by the
row-level security policy in `setup.sql`, not by hiding the page.

### 3. Use Piratesofybor.com (optional)
Under **Settings → Pages → Custom domain**, enter `piratesofybor.com`, then at your
domain registrar add the DNS records GitHub shows there. After it verifies, tick
**Enforce HTTPS** and update the Supabase Site URL to `https://piratesofybor.com/`.

## Preview locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
