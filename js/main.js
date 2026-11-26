import { PARTY, RSVP_ENDPOINT } from './config.js';
import { startCountdown } from './countdown.js';
import { downloadIcsEvent } from './calendar.js';
import { setupRsvpForm } from './rsvp-form.js';
import { createMotion } from './motion.js';
import { setupMusic } from './music.js';

const motion = createMotion();
const music = setupMusic(document.querySelector('[data-music]'), document.querySelector('[data-music-toggle]'));

removeMissingStickers();
setupIntro();
startCountdown(document.querySelector('[data-countdown]'), Date.parse(PARTY.startsAt));
setupCalendarButton();
setupRsvpForm(document.querySelector('[data-rsvp-form]'), RSVP_ENDPOINT, motion);
setupFloatingCta();

/** A sticker slot whose image file is not in assets/stickers/ yet leaves no broken icon behind. */
function removeMissingStickers() {
  for (const sticker of document.querySelectorAll('[data-sticker]')) {
    const isAlreadyBroken = sticker.complete && sticker.naturalWidth === 0;
    if (isAlreadyBroken) sticker.remove();
    else sticker.addEventListener('error', () => sticker.remove(), { once: true });
  }
}

function setupIntro() {
  const intro = document.querySelector('[data-intro]');
  const openButton = intro.querySelector('[data-intro-open]');
  const pageBehindIntro = document.querySelectorAll('.skip-link, main, [data-floating-cta]');

  // A reload mid-page would otherwise reopen the envelope over a scrolled, locked page.
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  setInert(pageBehindIntro, true);
  openButton.focus();

  openButton.addEventListener('click', async () => {
    music.start(); // before the await, while the tap still counts as a user gesture
    await motion.openInvitation(intro);
    intro.remove();
    setInert(pageBehindIntro, false);
    document.documentElement.classList.remove('is-locked');
    document.querySelector('#hero-title').focus({ preventScroll: true });
    motion.refresh();
  }, { once: true });
}

function setupCalendarButton() {
  document.querySelector('[data-add-to-calendar]').addEventListener('click', () => {
    downloadIcsEvent(PARTY, 'xv-ashley.ics');
  });
}

/**
 * Shows the "Confirmar asistencia" pill once the cover is gone, except over the album (it would
 * cover the photo captions) and from the place section on, where the page's own buttons take over.
 */
function setupFloatingCta() {
  const cta = document.querySelector('[data-floating-cta]');
  const cover = document.querySelector('#inicio');
  const album = document.querySelector('#album');
  const place = document.querySelector('#lugar');

  // Every section is watched: a jump through an anchor link may skip over the cover or the
  // place without either changing its intersection, but the section it lands on always does.
  // "main section", not "main > section": the pinned album is wrapped in GSAP's pin spacer.
  const observer = new IntersectionObserver(() => {
    const isPastCover = cover.getBoundingClientRect().bottom <= 0;
    const isBeforePlace = place.getBoundingClientRect().top >= window.innerHeight;
    const shouldShow = isPastCover && isBeforePlace && !isOnScreen(album);
    cta.classList.toggle('is-visible', shouldShow);
    cta.inert = !shouldShow;
  });
  for (const section of document.querySelectorAll('main section')) observer.observe(section);
}

function isOnScreen(element) {
  const box = element.getBoundingClientRect();
  return box.bottom > 0 && box.top < window.innerHeight;
}

function setInert(elements, isInert) {
  for (const element of elements) element.inert = isInert;
}
