---
status: done
---

# Publicación en internet

## Spec

- Free static hosting (GitHub Pages, Netlify or Vercel) with HTTPS.
- Share preview image (Open Graph) so the WhatsApp link shows a nice card.

## Log

### 2026-11-26 — published

- Public repo https://github.com/ZurisaraiDR/xv-ashley (gh logged in as ZurisaraiDR); `.gitignore` excludes `.claude/` and `skills-lock.json`; `.nojekyll` added. Commit `8d0b102` (Conventional Commits, no AI attribution per owner rules).
- GitHub Pages enabled from `main` / root via REST API; first deploy run succeeded. Live: https://zurisaraidr.github.io/xv-ashley/ (index, CSS, JS, WAV → 200). Apps Script `doGet` answers from the github.io origin (CORS OK); no test RSVP sent from the live site.
- Pending: Open Graph preview image + `og:url` for a nicer WhatsApp card. Future changes need commit + push to `main` (Pages redeploys automatically).
- Share card: `tools/og-card.html` rendered by `tools/render-og.ps1` (Edge headless, separate profile) to `assets/og.jpg` (1200×630, 95 KB). Open Graph + `twitter:card` tags with absolute URLs added to `index.html`.
- Verified live after deploy `760c3a1`: `assets/og.jpg` → 200 image/jpeg; `og:image` present in the published HTML. WhatsApp caches previews per URL: links already shared before this deploy may keep the old (text-only) preview.
- Closed. Remaining open work lives in `tasks/contenido-final.md` (owner's sticker files).

### 2026-11-26 — responsive pass

- Audited 320×568, 360×740, 375×667, 390×844, 412×915, 430×932, 740×360, 932×430 and 768×1024 at three scroll moments (top, album mid-pin, bottom): horizontal scroll, off-screen elements, text overflow, tap targets ≥44 px.
- Bug fixed: ~60 px horizontal scroll on every phone, caused by the thank-you notes' pre-animation offset (x ±60). Mobile browsers ignore clipping on body, so `overflow-x: clip` moved to `main` and added to `.thanks`.
- Narrow phones (<360 px): surnames and date on one line, kicker spacing reduced, two doodles hidden, RSVP answers stacked. Short screens (≤620 px tall): compact cover. Landscape phones: two-column cover (photo left, name and date right).
- Result: 0 issues at every size and moment; the cover fits one screen everywhere.

### 2026-11-26 — time change and phone report

- Start time changed to 7:00 PM everywhere (cover, date section, place text, og:description, `PARTY.startsAt` → 2026-12-19T19:00-05:00 for countdown and .ics) and the share card re-rendered.
- Owner's phone screenshots showed the ~60 px side strip: the live CSS fix had been published at 14:58 Cancún, the same minute as the screenshot, and GitHub Pages serves `Cache-Control: max-age=600`, so the phone still had the old CSS. Verified the current code at 360×800, 384×832 and 412×915: scrollWidth = clientWidth at top, album mid-pin and bottom.
- Statement text now sits above the rising balloons (z-index), so a balloon never covers the words.
