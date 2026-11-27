// Pure particle physics for the finale's fireworks and confetti (no DOM, so it runs in tests).
// Units: pixels and seconds. Every step scales by dt, so motion is the same at 60 Hz or 120 Hz.

export const GRAVITY = 260;               // px/s², pulls everything down
const SPARK_AIR_DRAG = 0.35;              // share of speed a spark keeps after one second
const CONFETTI_AIR_DRAG = 0.2;            // paper slows down faster than sparks

/** A firework: sparks leave one point in every direction, each with its own speed. */
export function createBurst({ x, y, count, colors, random }) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count + (random() - 0.5) * 0.3;
    const speed = 80 + random() * 140;
    return {
      kind: 'spark',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: pick(colors, random),
      size: 1.6 + random() * 1.6,
      life: 1,
      decay: 0.55 + random() * 0.35,
    };
  });
}

/** Confetti shot from a bottom corner: upward and toward the middle of the screen. */
export function createConfettiCannon({ x, y, side, count, colors, random }) {
  const direction = side === 'left' ? 1 : -1;
  return Array.from({ length: count }, () => {
    const angle = (55 + random() * 25) * (Math.PI / 180);   // degrees above the floor
    const speed = 480 + random() * 320;
    return {
      kind: 'confetti',
      x,
      y,
      vx: Math.cos(angle) * speed * direction,
      vy: -Math.sin(angle) * speed,
      color: pick(colors, random),
      width: 5 + random() * 5,
      height: 8 + random() * 6,
      rotation: random() * Math.PI,
      spin: (random() - 0.5) * 12,
      life: 1,
      decay: 0.22 + random() * 0.15,
    };
  });
}

/** Advances every particle by dt seconds and drops the ones that have faded out. */
export function stepParticles(particles, dt) {
  return particles.map((particle) => advance(particle, dt)).filter((particle) => particle.life > 0);
}

function advance(particle, dt) {
  const drag = (particle.kind === 'confetti' ? CONFETTI_AIR_DRAG : SPARK_AIR_DRAG) ** dt;
  const next = {
    ...particle,
    vx: particle.vx * drag,
    vy: (particle.vy + GRAVITY * dt) * drag,
    life: particle.life - particle.decay * dt,
  };
  next.x = particle.x + next.vx * dt;
  next.y = particle.y + next.vy * dt;
  if (particle.kind === 'confetti') next.rotation = particle.rotation + particle.spin * dt;
  return next;
}

function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}
