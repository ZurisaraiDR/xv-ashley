---
status: in-progress
---

# Contenido final: foto de bebé, textos y clips

## Spec

- Cover photo: `assets/fotos/rizos.webp`, chosen by the owner (2026-11-26).
- Owner rewrites the thank-you texts and album captions in their own words.
- Optional: own illustrations in `assets/ilustraciones/`, video clips, background music with a visible play/pause control.

## Log

### 2026-11-26 — progress

- Cover photo confirmed by the owner (same file as `rizos.webp`); album keeps the other three.
- Thank-you cards kept as parents, family, friends; texts rewritten on request (warm, not heavy; family card thanks aunts, uncles and cousins for helping make the party happen). Checked at 375px: no overflow.
- Album captions confirmed by the owner as they are.
- Remaining: optional clips/music (owner decides).
- Music: `js/music.js` + floating toggle (`aria-pressed`), starts on the seal tap, pauses while the page is hidden, `preload="none"`, hides itself when the file is missing. Verified with a temporary tone (play, pause, resume, hidden/visible) and without file (button hidden). Waiting for the owner's song at `assets/musica/cancion.mp3`.

### 2026-11-26 — visual pass from owner feedback

- Owner asked for Snoopy decorations: copyrighted characters are not drawn; an original mascot was added instead (round cream puppy, caramel ears, eye patch, blue bow / party hat) in three poses: cover (sitting), RSVP (peeking over the form), closing (party hat + cake).
- Cover: hand note moved below the photo so the face shows; title is Ashley / Alejandra / Delgado Rodriguez (full name no longer repeated); line-height leaves room for the "y" descender under SplitText's mask.
- Decoration: pastel bunting on the cover, scalloped section edges (radial-gradient), washi tape on photos, balloons, confetti, dotted route heart → pin above the map.
- New scroll moments: bunting drop + mascot pop on open, balloons rising (parallax), "19" growing with falling confetti, route reveal (clip-path; DrawSVG would erase the dots) + pin drop, puppy peeking over the form, confetti burst at the end.
- Bug found and fixed: a GSAP `from()` placed later in a timeline finished at its hidden start state in this setup (cover stayed invisible with motion on). Every `from()` is now `fromTo()` with explicit end values; verified with motion forced on at 375×812.
- Music: `assets/musica/cajita-feliz-cumpleanos.wav` (37 s, 1.6 MB), music-box "Happy Birthday" melody (public domain, no lyrics) rendered by `tools/music_box.py`; played in the browser (duration 37.1 s).
- Pending: owner's review on a real phone (sound and animation feel).

### 2026-11-26 — stickers instead of mascot

- Owner did not want the original mascot and asked to embed Peanuts character images. Those images were not added to the project (copyrighted characters); the mascot was removed and three sticker slots were added instead: `assets/stickers/portada.png`, `formulario.png`, `cierre.png` (see `assets/stickers/LEEME.md`). White die-cut border via stacked drop-shadows; same entrance animations; a missing file removes its `<img>` (`removeMissingStickers` in `js/main.js`), verified with no files (0 broken images) and with a temporary generic test image (deleted).
- Note: `python -m http.server` lets the browser reuse cached modules; hard-refresh when previewing changes.
- Pending: owner places their own sticker files; the project must move to a folder the owner can open (session currently in a scratch folder).
- Owner's Chrome showed the page unstyled while the same URL rendered fine in the in-app browser (CSS valid: balanced braces, 191 rules, `text/css`). Dev server replaced by `tools/serve.py` (`Cache-Control: no-store`); `npm start` and `.claude/launch.json` use it. Owner to hard-refresh once (Ctrl+F5).

### 2026-11-26 — second visual pass

- Owner cannot see scroll animations because Windows "Animation effects" is off (SPI_GETCLIENTAREAANIMATION = False → prefers-reduced-motion: reduce); the page shows its still version by design.
- Removed the "Desliza" cue and the footer date line. Cover: pastel sunburst (repeating-conic-gradient + radial mask) and a giant outlined gold "XV" behind the arch; rays rotate and "XV" drifts on scroll.
- Balloons moved into the statement's padding (verified: none overlaps the text). Thank-you cards restacked like index cards (icon + title header row, sticky offset of one header row per card; motion scale 0.96).
- Closing gets its own confetti; confetti motion generalized per section (`dropConfetti`). Forced-motion check: 18 ScrollTriggers, no errors, cover visible.
- Decision (owner, 2026-11-26): play animations for everyone, regardless of prefers-reduced-motion. Removed the gate in `js/motion.js` and the reduced-motion CSS block; verified without forcing on a device that asks for reduced motion: 19 ScrollTriggers, album moving sideways, cover visible.

### 2026-11-26 — dress code and typeface

- New "Código de vestimenta" section before the RSVP: "Todo menos azul" (blue is reserved for the quinceañera), original dress doodle that sways in (`swingDress`).
- Typeface chosen by the owner from a specimen of four pairings (specimen page deleted): Great Vibes (name, titles, "19", monogram) + Quicksand (body, uppercase labels, numbers). Synthetic italics and the Fraunces optical-size settings removed; checked at 375 px with no clipping of the name.

### 2026-11-26 — script polish

- "Cut" letters: SplitText's per-char mask (`overflow: clip`) clipped Great Vibes swashes and broke the joins. The name is no longer split; it is revealed left to right with `clip-path: inset()` using negative insets. Script titles get line-height 1.3.
- Removed the hand-note arrow and the "Te espero" kicker over the RSVP title.
- Floating CTA also hides while the album is on screen (observes `main section`, since the pinned album sits inside GSAP's pin spacer).
- Thank-you cards: sticky stacking removed; three separate tilted notes that slide in (`pinThanksNotes`).
- Pending: owner chooses a more grown-up music style (current track sounds childish).

### 2026-11-26 — piano waltz

- Music box replaced by an original piano waltz (owner's choice): 3/4, ~84 bpm, F major with a borrowed B-flat minor, A–B–A form with a closing ritardando, 90.6 s. Rendered by `tools/piano_waltz.py` (stretched partials, two-stage decay, light hall). `assets/musica/vals-de-piano.wav`, 4 MB (no MP3 encoder available; `preload="none"`). Old music box track and script removed.
- Verified in the browser: plays after the seal tap (duration 90.6 s), toggle shows pressed.
- Owner found the waltz too high-pitched (headache). Transposed a fifth down (B-flat major), warmer partials (1/n², faster upper decay), gentle FFT low-pass at 3 kHz. Spectral centroid 1080 Hz → 600 Hz; energy above 2 kHz 8.0 % → 0.3 %; no clipping. Plays in the browser (90.6 s).
- Still uncomfortable for the owner: melody an octave below written (E4–G5), bass lifted an octave for phone speakers, tempo 76 bpm, only two short early echoes (no long tail), peak 0.42, and `audio.volume = 0.5` (ignored on iOS, hence the quieter render). Centroid 455 Hz, energy above 2 kHz 0.1 %, 99.8 s. Plays in the browser at volume 0.5.
- "Más alegre": 92 bpm, borrowed B-flat minor replaced by B-flat major, eighth-note pairs in the melody, staccato chords on beats 2–3, lighter ritardando. Same register and filter: centroid 464 Hz, energy above 2 kHz 0.1 %, 82.5 s, no clipping. Plays in the browser at volume 0.5.

### 2026-11-26 — texts and image folder

- Family card no longer names aunts, uncles and cousins (owner's request); parents card longer and warmer. Checked at 360 px, no overflow.
- Owner offered `C:\Users\Zuri\Desktop\imagenesInvitacion` (6 PNGs labelled copyright-free). All six depict Peanuts characters (Snoopy, Woodstock, Charlie Brown, Lucy); not added to the project.
- Family card rewritten in a more formal register (no "echaron la mano"); statement replaced (parents did not like the "zapatos" line): "Hoy cumplo quince años y comienzo una nueva etapa, llevando conmigo cada recuerdo, cada enseñanza y todo el amor de quienes me han acompañado hasta aquí." Checked at 360 px, word highlight works, no overflow.
- Parents card: added thanks for their time, dedication and effort in making the celebration happen. Checked at 360 px.

### 2026-11-26 — grand finale

- Closing turned into a night-sky finale: `js/particles.js` (pure physics: bursts, confetti cannons, gravity/drag/fade scaled by dt; 5 node:test tests written first, 25 total GREEN) and `js/finale.js` (canvas, DPR ≤ 2, ≤ 900 particles, rAF loop only while the section is ≥35 % visible). Grand opening (two cannons + four bursts), a firework every 1.5 s, and one wherever the guest taps.
- GSAP `revealFinale`: "Te espero" written left to right in gold, signature rises in, monogram spins in, tap hint fades in. Old closing doodle burst removed.
- Checked at 390×844 and 320×568: canvas draws (15k lit pixels), no errors, no horizontal overflow, content fits one screen.
