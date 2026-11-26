import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTimeLeft } from '../js/countdown.js';

const PARTY_START = Date.parse('2026-12-19T23:00:00Z');
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

test('splits the remaining time into days, hours, minutes and seconds', () => {
  const now = PARTY_START - (3 * DAY + 4 * HOUR + 5 * MINUTE + 6 * SECOND);

  assert.deepEqual(getTimeLeft(PARTY_START, now), {
    days: 3,
    hours: 4,
    minutes: 5,
    seconds: 6,
    hasStarted: false,
  });
});

test('ignores the milliseconds left in the current second', () => {
  const now = PARTY_START - (10 * SECOND + 999);

  assert.equal(getTimeLeft(PARTY_START, now).seconds, 10);
});

test('reports zeros and hasStarted once the party begins', () => {
  const zero = { days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: true };

  assert.deepEqual(getTimeLeft(PARTY_START, PARTY_START), zero);
  assert.deepEqual(getTimeLeft(PARTY_START, PARTY_START + HOUR), zero);
});
