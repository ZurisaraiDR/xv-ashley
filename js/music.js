// Autoplay policy: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
// play() promise:  https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
// volume:          https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume

// Half volume: it is background music. iOS ignores this (only the hardware buttons set volume),
// which is why the track itself is also rendered quietly.
const BACKGROUND_VOLUME = 0.5;

/**
 * Background music. It starts from the guest's tap on the seal (browsers allow sound only after
 * a user gesture), can be paused from the floating button, and rests while the page is hidden.
 */
export function setupMusic(audio, button) {
  let wantsMusic = false;

  audio.volume = BACKGROUND_VOLUME;
  audio.addEventListener('error', () => { button.hidden = true; });
  audio.addEventListener('play', () => button.setAttribute('aria-pressed', 'true'));
  audio.addEventListener('pause', () => button.setAttribute('aria-pressed', 'false'));
  button.addEventListener('click', () => {
    wantsMusic = audio.paused;
    if (wantsMusic) playIfAllowed(audio);
    else audio.pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else if (wantsMusic) playIfAllowed(audio);
  });

  return {
    /** Call it synchronously inside the seal's click handler, before any await. */
    start() {
      wantsMusic = true;
      button.hidden = false;
      playIfAllowed(audio);
    },
  };
}

function playIfAllowed(audio) {
  // A refusal (blocked autoplay, missing file) leaves the music off; the button shows that state,
  // and a missing file also fires 'error', which hides the button.
  audio.play().catch(() => {});
}
