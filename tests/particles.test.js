import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBurst, createConfettiCannon, stepParticles, GRAVITY } from '../js/particles.js';

const COLORS = ['#ecdaa8', '#f6dedc'];
const fixedRandom = () => 0.5;

test('a burst starts every spark at the launch point with a colour from the palette', () => {
  const sparks = createBurst({ x: 100, y: 80, count: 30, colors: COLORS, random: Math.random });

  assert.equal(sparks.length, 30);
  for (const spark of sparks) {
    assert.equal(spark.x, 100);
    assert.equal(spark.y, 80);
    assert.ok(COLORS.includes(spark.color));
    assert.equal(spark.life, 1);
  }
});

test('a burst spreads its sparks in every direction', () => {
  const sparks = createBurst({ x: 0, y: 0, count: 40, colors: COLORS, random: Math.random });

  assert.ok(sparks.some((s) => s.vx > 0) && sparks.some((s) => s.vx < 0));
  assert.ok(sparks.some((s) => s.vy > 0) && sparks.some((s) => s.vy < 0));
});

test('a confetti cannon fires upward and toward the middle from its corner', () => {
  const fromLeft = createConfettiCannon({ x: 0, y: 600, side: 'left', count: 20, colors: COLORS, random: Math.random });
  const fromRight = createConfettiCannon({ x: 400, y: 600, side: 'right', count: 20, colors: COLORS, random: Math.random });

  assert.equal(fromLeft.length, 20);
  assert.ok(fromLeft.every((p) => p.vy < 0 && p.vx > 0));
  assert.ok(fromRight.every((p) => p.vy < 0 && p.vx < 0));
  assert.ok(fromLeft.every((p) => p.kind === 'confetti'));
});

test('a step moves particles, pulls them down and fades them', () => {
  const [spark] = createBurst({ x: 0, y: 0, count: 1, colors: COLORS, random: fixedRandom });
  const before = { ...spark };

  const [after] = stepParticles([spark], 0.1);

  assert.notDeepEqual([after.x, after.y], [before.x, before.y]);
  assert.ok(after.vy > before.vy * 0.99 + GRAVITY * 0.1 * 0.5, 'gravity pulls the spark down');
  assert.ok(after.life < before.life);
});

test('a step drops the particles that have faded out', () => {
  const sparks = createBurst({ x: 0, y: 0, count: 5, colors: COLORS, random: Math.random });

  let alive = sparks;
  for (let second = 0; second < 10; second++) alive = stepParticles(alive, 1);

  assert.equal(alive.length, 0);
});
