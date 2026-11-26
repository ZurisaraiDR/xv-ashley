// GSAP docs used here:
// ScrollTrigger  https://gsap.com/docs/v3/Plugins/ScrollTrigger/
// SplitText      https://gsap.com/docs/v3/Plugins/SplitText/

const BURST_PIECES = 10;

/**
 * Returns the page's motion API. The owner chose to play the animations for every guest,
 * even when the device asks for reduced motion (decision of 2026-11-26). Only when GSAP fails
 * to load (CDN blocked) does the same API do nothing, so the page still works.
 */
export function createMotion() {
  const { gsap, ScrollTrigger, SplitText } = window;
  if (!gsap) return createStillMotion();

  gsap.registerPlugin(ScrollTrigger, SplitText);
  // Sticker slots without a file are removed, so their tweens may find no target; that is expected.
  gsap.config({ nullTargetWarn: false });
  // Phones resize the viewport when the URL bar hides; refreshing then makes pins jump.
  ScrollTrigger.config({ ignoreMobileResize: true });

  driftHeroOnScroll(gsap);
  lightUpStatementWords(gsap, SplitText);
  floatBalloonsUp(gsap);
  pinAlbumSideways(gsap);
  pinThanksNotes(gsap);
  growDateDay(gsap);
  dropConfetti(gsap);
  drawRouteToPin(gsap);
  peekStickerOverForm(gsap);
  swingDress(gsap);
  celebrateAtTheEnd(gsap, ScrollTrigger);

  return {
    openInvitation: (intro) => openInvitation(gsap, intro),
    celebrate: (target) => burstDoodles(gsap, target),
    refresh: () => ScrollTrigger.refresh(),
  };
}

function createStillMotion() {
  return {
    openInvitation: () => Promise.resolve(),
    celebrate: () => {},
    refresh: () => {},
  };
}

/**
 * Envelope opens, then the cover enters: one timeline, resolved once the page is uncovered.
 * Every entrance is fromTo with explicit end values: a from() placed later in a timeline was
 * verified to finish at its hidden start state here, so nothing relies on recorded values.
 */
function openInvitation(gsap, intro) {
  const content = intro.querySelector('[data-intro-content]');
  const topPanel = intro.querySelector('[data-intro-panel="top"]');
  const bottomPanel = intro.querySelector('[data-intro-panel="bottom"]');

  return new Promise((resolve) => {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to(content, { scale: 0.92, autoAlpha: 0, duration: 0.45, ease: 'power2.in' })
      .to(topPanel, { yPercent: -100, duration: 1.1, ease: 'power3.inOut' }, '<0.2')
      .to(bottomPanel, { yPercent: 100, duration: 1.1, ease: 'power3.inOut' }, '<')
      .fromTo('.garland__flag',
        { yPercent: -140, rotate: -25, transformOrigin: '50% 0%' },
        { yPercent: 0, rotate: 0, stagger: 0.05, duration: 0.7, ease: 'back.out(1.8)' }, '-=0.7')
      // The script name is written left to right as one word: splitting it into letters would
      // clip its swashes and break the joins. Negative insets leave room for the flourishes.
      .fromTo('[data-hero-name]',
        { clipPath: 'inset(-40% 100% -40% -15%)' },
        { clipPath: 'inset(-40% -15% -40% -15%)', duration: 1.3, ease: 'power2.inOut' }, '<0.1')
      .fromTo('[data-hero-item]', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.8 }, '<0.1')
      .fromTo('.hero__sticker',
        { scale: 0, rotate: -20, transformOrigin: '50% 100%' },
        { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(2)' }, '-=0.4')
      .add(() => intro.style.setProperty('pointer-events', 'none'), '-=1.4')
      .call(resolve);
  });
}

function driftHeroOnScroll(gsap) {
  const leaveHero = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };

  gsap.to('.hero .arch img', { yPercent: -6, ease: 'none', scrollTrigger: leaveHero });
  gsap.to('.hero__sticker', { rotate: 12, y: -16, ease: 'none', scrollTrigger: leaveHero });
  gsap.to('.garland', { yPercent: -30, autoAlpha: 0.4, ease: 'none', scrollTrigger: leaveHero });
  gsap.to('.hero__rays', { rotate: 45, ease: 'none', scrollTrigger: leaveHero });
  gsap.to('.hero__xv', { yPercent: 35, ease: 'none', scrollTrigger: leaveHero });
  gsap.to('.hero > .doodle', {
    y: (index) => -30 - index * 12,
    rotate: (index) => (index % 2 === 0 ? -20 : 20),
    ease: 'none',
    scrollTrigger: leaveHero,
  });
}

function lightUpStatementWords(gsap, SplitText) {
  SplitText.create('[data-split-words]', {
    type: 'words',
    // Re-splits when the font loads or the width changes; the returned tween is rebuilt with it.
    autoSplit: true,
    onSplit: (split) => gsap.fromTo(split.words, { opacity: 0.18 }, {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: '.statement', start: 'top 75%', end: 'bottom 55%', scrub: true },
    }),
  });
}

/** Balloons rise through the statement at their own speed (data-rise), like a slow parallax. */
function floatBalloonsUp(gsap) {
  for (const balloon of gsap.utils.toArray('.statement__balloon')) {
    gsap.fromTo(balloon, { y: 140 }, {
      y: () => -260 * Number(balloon.dataset.rise),
      rotate: gsap.utils.random(-12, 12),
      ease: 'none',
      scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
}

/** Pins the album and turns vertical scrolling into a sideways walk through the photos. */
function pinAlbumSideways(gsap) {
  const album = document.querySelector('[data-album]');
  const track = album.querySelector('[data-album-track]');
  const overflowWidth = () => track.scrollWidth - document.documentElement.clientWidth;

  album.classList.add('is-pinned');
  gsap.to(track, {
    x: () => -overflowWidth(),
    ease: 'none',
    scrollTrigger: {
      trigger: album,
      start: 'top top',
      end: () => `+=${overflowWidth()}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });
}

/**
 * Each thank-you note slides up from its side and settles at its own tilt (the CSS --tilt),
 * like a note being pinned to a board. It slides away again when you scroll back up.
 */
function pinThanksNotes(gsap) {
  gsap.utils.toArray('[data-thanks-card]').forEach((card, index) => {
    const tilt = parseFloat(getComputedStyle(card).getPropertyValue('--tilt'));
    const side = index % 2 === 0 ? -1 : 1;

    gsap.fromTo(card, { x: side * 60, y: 50, rotate: side * 8, autoAlpha: 0 }, {
      x: 0,
      y: 0,
      rotate: tilt,
      autoAlpha: 1,
      duration: 0.8,
      ease: 'back.out(1.4)',
      scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  });
}

/** The big "19" grows into place as the dark band scrolls in. */
function growDateDay(gsap) {
  gsap.fromTo('.date__day', { scale: 0.55, autoAlpha: 0 }, {
    scale: 1,
    autoAlpha: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.date', start: 'top 85%', end: 'top 25%', scrub: true },
  });
}

/** Every confetti group drifts down and spins while its own section crosses the screen. */
function dropConfetti(gsap) {
  for (const group of gsap.utils.toArray('.confetti')) {
    gsap.fromTo(group.children, { y: -80 }, {
      y: () => gsap.utils.random(80, 200),
      rotate: () => gsap.utils.random(-180, 180),
      ease: 'none',
      scrollTrigger: { trigger: group.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
}

/**
 * The dotted path from the heart to the pin reveals left to right, then the pin drops in.
 * clip-path instead of DrawSVG: DrawSVG rewrites stroke-dasharray and would erase the dots.
 */
function drawRouteToPin(gsap) {
  gsap.timeline({ scrollTrigger: { trigger: '.route', start: 'top 85%', end: 'top 45%', scrub: true } })
    .fromTo('.route__path', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none' })
    .fromTo('.route__pin', { y: -30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'bounce.out', duration: 0.4 });
}

/** The sticker pops up over the form when the RSVP section comes into view. */
function peekStickerOverForm(gsap) {
  gsap.fromTo('.rsvp__sticker', { yPercent: 70, autoAlpha: 0 }, {
    yPercent: 0,
    autoAlpha: 1,
    duration: 0.7,
    ease: 'back.out(2)',
    scrollTrigger: { trigger: '.rsvp-form', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
}

/** The dress-code card's dress pops in and sways as the card arrives. */
function swingDress(gsap) {
  gsap.fromTo('.dress-code__dress', { scale: 0, rotate: -30 }, {
    scale: 1,
    rotate: 0,
    duration: 0.9,
    ease: 'elastic.out(1, 0.5)',
    transformOrigin: '50% 0%',
    scrollTrigger: { trigger: '.dress-code__card', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
}

/** One confetti burst around the closing sticker and cake when the guest reaches the end. */
function celebrateAtTheEnd(gsap, ScrollTrigger) {
  const party = document.querySelector('[data-closing-party]');
  ScrollTrigger.create({
    trigger: party,
    start: 'top 85%',
    once: true,
    onEnter: () => burstDoodles(gsap, party),
  });
}

/** A small burst of sparkles and hearts around a target; its first doodle pops in. */
function burstDoodles(gsap, target) {
  const pieces = Array.from({ length: BURST_PIECES }, (_, index) => createBurstPiece(target, index));

  gsap.fromTo(target.querySelector('.doodle'), { scale: 0, rotate: -25 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(2)' });
  gsap.fromTo(pieces, { x: 0, y: 0, scale: 0.4, autoAlpha: 1 }, {
    x: () => gsap.utils.random(-140, 140),
    y: () => gsap.utils.random(-130, -20),
    rotate: () => gsap.utils.random(-90, 90),
    scale: 1,
    autoAlpha: 0,
    duration: 1.4,
    ease: 'power2.out',
    stagger: 0.02,
    onComplete: () => pieces.forEach((piece) => piece.remove()),
  });
}

function createBurstPiece(target, index) {
  const symbol = index % 2 === 0 ? 'd-sparkle' : 'd-heart';
  const piece = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  piece.setAttribute('class', 'doodle burst-piece');
  piece.setAttribute('aria-hidden', 'true');
  piece.innerHTML = `<use href="#${symbol}"/>`;
  target.append(piece);
  return piece;
}
