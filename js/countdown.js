const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Renders the time left into elements marked [data-unit="days|hours|minutes|seconds"]
 * and refreshes it every second until the party starts.
 */
export function startCountdown(root, targetMs) {
  const tick = () => {
    const timeLeft = getTimeLeft(targetMs, Date.now());
    renderTimeLeft(root, timeLeft);
    if (timeLeft.hasStarted) clearInterval(timer);
  };
  const timer = setInterval(tick, SECOND);
  tick();
}

export function getTimeLeft(targetMs, nowMs) {
  const remaining = Math.max(0, targetMs - nowMs);
  return {
    days: Math.floor(remaining / DAY),
    hours: Math.floor((remaining % DAY) / HOUR),
    minutes: Math.floor((remaining % HOUR) / MINUTE),
    seconds: Math.floor((remaining % MINUTE) / SECOND),
    hasStarted: remaining === 0,
  };
}

function renderTimeLeft(root, timeLeft) {
  for (const unitElement of root.querySelectorAll('[data-unit]')) {
    const value = timeLeft[unitElement.dataset.unit];
    unitElement.textContent = String(value).padStart(2, '0');
  }
  root.toggleAttribute('data-started', timeLeft.hasStarted);
}
