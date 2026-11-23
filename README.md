# The Order ov the Seven Rays — static demo

Read-only snapshot of the community site for GitHub Pages. The real app is
server-rendered with Postgres, auth and server actions; this folder contains the
public pages only.

Working: navigation, member profiles, search + ray filters, the calendar's
current month, the journal, the hero parallax, and live Discord member/online
counts (fetched in the browser from Discord's public invite endpoint).

Disabled: sign-in, registration, posting, editing profiles, changing months.

The invite is https://discord.gg/RVGaaUUjy — Discord reports it expires on
23 December 2026. For a permanent demo, create a never-expiring invite, then
update the fallback in lib/discord.ts and INVITE_CODE in
scripts/export-github-pages.mjs, rebuild and re-export.

## Publish

```bash
git init
git add .
git commit -m "Static community demo"
git branch -M main
git remote add origin git@github.com:USER/Ord7.git
git push -u origin main
```

On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch →
main / (root)**.

The site then lives at `https://USER.github.io/Ord7/`. All paths are relative,
so it works in a project subpath. `.nojekyll` keeps GitHub from hiding
`_next/`.

## Regenerate

From the real app:

```bash
npm run build
npm start -- -p 3107
node scripts/export-github-pages.mjs /path/to/Ord7
```
