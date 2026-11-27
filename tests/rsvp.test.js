import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRsvp, submitRsvp } from '../js/rsvp.js';

const VALID_YES = { name: '  Tía Lupita  ', attending: 'si', message: ' ¡Ahí estaremos! ' };

test('accepts a complete yes and trims the text', () => {
  const result = validateRsvp(VALID_YES);

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.data, {
    name: 'Tía Lupita',
    attending: 'si',
    guests: 1,
    message: '¡Ahí estaremos!',
  });
});

test('a no sets guests to zero, whatever was sent', () => {
  const result = validateRsvp({ name: 'Mario', attending: 'no', guests: '4', message: '' });

  assert.equal(result.isValid, true);
  assert.equal(result.data.guests, 0);
});

test('requires a name of at least two letters', () => {
  const result = validateRsvp({ ...VALID_YES, name: ' a ' });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.name);
});

test('requires an answer to attending', () => {
  const result = validateRsvp({ ...VALID_YES, attending: '' });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.attending);
});

test('a yes always counts one guest: the person confirming', () => {
  for (const guests of [undefined, '', '0', '4', 'dos']) {
    const result = validateRsvp({ ...VALID_YES, guests });
    assert.equal(result.isValid, true, `guests "${guests}" should not matter`);
    assert.equal(result.data.guests, 1);
  }
});

test('limits the message length', () => {
  const result = validateRsvp({ ...VALID_YES, message: 'a'.repeat(301) });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.message);
});

test('submitRsvp posts the answers form-encoded', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => Response.json({ ok: true }));

  await submitRsvp('https://script.example/exec', { name: 'Mario', attending: 'no', guests: 0, message: '' });

  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, 'https://script.example/exec');
  assert.equal(options.method, 'POST');
  assert.ok(options.body instanceof URLSearchParams);
  assert.equal(options.body.get('name'), 'Mario');
});

test('submitRsvp fails when the script rejects the answers', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ok: false, error: 'invalid' }));

  await assert.rejects(submitRsvp('https://script.example/exec', VALID_YES));
});

test('submitRsvp fails on an HTTP error', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('boom', { status: 500 }));

  await assert.rejects(submitRsvp('https://script.example/exec', VALID_YES));
});
