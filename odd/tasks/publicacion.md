---
status: in-progress
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
