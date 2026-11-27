---
status: done
---

# Confirmaciones de asistencia en Google Sheets

## Spec

- Google Apps Script web app bound to a Google Sheet (`doPost`), appending one row per RSVP: timestamp, name, attending, guests, message.
- Owner deploys it ("Execute as: Me", "Who has access: Anyone") and pastes the `/exec` URL into `RSVP_ENDPOINT` in `js/config.js`.
- The sheet downloads as `.xlsx` from Google Sheets (File → Download).

## Log

### 2026-11-26 — code ready, waiting on deployment

- Outcome: `apps-script/Code.gs` (doPost/doGet, server-side validation, formula-injection guard, LockService, auto-created "Confirmaciones" sheet with frozen header) and `apps-script/README.md` (deploy steps). `submitRsvp` now also reads the JSON verdict, since Apps Script answers 200 on rejection. 20 node:test tests GREEN.
- Browser check with a mocked Apps Script reply: rejection keeps the form with a retry message; success shows the thank-you card; the posted fields match what Code.gs reads.
- Pending: the owner deploys the web app with their Google account and pastes the `/exec` URL into `RSVP_ENDPOINT` (`js/config.js`); then one real RSVP from a phone confirms the end-to-end path (not verifiable here). Set `status: done` after that.
- Next: objective 3, final content (`tasks/contenido-final.md`).

### 2026-11-26 — closed

- Owner deployed the web app (version 2); `RSVP_ENDPOINT` set in `js/config.js`.
- GET /exec → `{"ok":true,"message":"Confirmaciones listas"}` (HTTP 200).
- Real POST from the page at http://localhost:5500 (CORS through the script.googleusercontent.com redirect works): server answered `ok: true` and the thank-you card showed. Test row "Prueba (bórrame)" with message `=1+1 prueba de seguridad`: the owner checks it is stored as text (leading apostrophe) and deletes the row.
- Next: objective 3, final content (`tasks/contenido-final.md`).

### 2026-11-26 — form protection

- Page (`js/moderation.js`, `js/rsvp.js`): Spanish/English blocklist for name and message (whole words + unambiguous stems), normalized against accents (ñ kept), digits for letters, repeated letters and letters split by dots/dashes/spaces; names letters-only (accents, apostrophe, hyphen, dot); messages without links or `<`/`>`; zero-width and control characters stripped. Rendering already used `textContent` only (no XSS path).
- Server (`apps-script/Code.gs`): same checks (identical lists, enforced by a parity test), formula guard extended to leading tab/CR, body capped at 2000 characters, 20 RSVPs per minute via CacheService. 37 node:test tests GREEN (tests written first).
- Pending: the owner pastes the new Code.gs and deploys a new version (Manage deployments → New version) so the URL stays the same. Until then only the page-side checks are live.
- Owner deployed the new Code.gs as a new version (same URL). Verified live without writing rows: an oversized body answered `rejected` (old version would have said `invalid`), and Pene, P3ne, p.u.t.o, Juan2, =HYPERLINK("x"), a profane message, a link and an `<img onerror>` payload all answered `invalid`. Server-side protection is live.
- Owner found "Tonta" accepted: the list covered profanity, not insults. Added Spanish and English insults (all genders and plurals) to both lists, tests first (40 GREEN, parity included). Code.gs now exposes `RULES_VERSION` through doGet so the live version can be checked with a GET before testing with POSTs. Page verified: Tonta, T0nta and "no seas tonta" blocked; "Tonatiuh Menéndez" allowed. Pending: owner redeploys Code.gs (new version).
