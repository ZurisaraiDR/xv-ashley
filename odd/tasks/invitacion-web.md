---
status: done
---

# Invitación web: estructura, diseño y animaciones

## Spec

- Static site (HTML, CSS, ES modules), mobile-first, no build step.
- Sections, top to bottom: envelope intro → cover (baby photo, "aún soy esa bebé") → childhood album (horizontal pinned gallery) → thank-you cards (parents, family, godparents, friends) → date + live countdown + add-to-calendar → place (map, directions) → RSVP form → closing.
- Event data lives in one file (`js/config.js`):
  - Name: Ashley Alejandra Delgado Rodriguez
  - Date: 19 Dec 2026, from 19:00 (America/Cancun, UTC−5) — changed from 18:00 on 2026-11-26
  - Location: 21.188881, -86.853264 — https://maps.app.goo.gl/pPBcRnayRJNArMoY9
- Theme: Peanuts-like hand lettering, blue + gold + pastels, feminine, calm, not childish. No drawn copyrighted characters; original doodles plus slots for the owner's own illustrations.
- Motion: GSAP + ScrollTrigger; everything visible and static under `prefers-reduced-motion`.
- RSVP form validates on the client and posts to `RSVP_ENDPOINT` (wired in objective 2).

## Tests (node:test)

- `getTimeLeft` splits the remaining time and flags when the party started.
- `buildIcsEvent` emits a valid RFC 5545 VEVENT in UTC with escaped text and CRLF lines.
- `validateRsvp` normalizes input and reports per-field errors.

## Log

### 2026-11-26 — closed

- Outcome: `index.html`, `css/styles.css`, `js/` (config, countdown, calendar, rsvp, rsvp-form, motion, main), 12 node:test tests GREEN (`npm test`). Preview: `npm start` → http://localhost:5500.
- Verified in the browser at 375×812 and 1024×768: intro, cover, album pin (sideways scrub), sticky thank-you stack, countdown, map, RSVP validation, success and "no" paths (fetch mocked), floating CTA hides on anchor jumps, no horizontal overflow, reduced-motion path shows everything.
- Contrast: text gold `#7d5a17` ≥4.9:1 on paper, sky and blush.
- Pending checks: real phone test with animations on (the in-app browser reports reduced motion and was hidden, so GSAP ran throttled); RSVP sending is not connected (`RSVP_ENDPOINT` empty).
- Design skills: `quieter` came in as part of `impeccable`; `high-end-visual-design` does not exist in leonxlnx/taste-skill.
- Next: objective 2, Google Sheets RSVP (`tasks/rsvp-google-sheets.md`).
