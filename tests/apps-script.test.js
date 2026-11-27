import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Code.gs is plain Apps Script (no modules), so it is evaluated in a sandbox
// and only its pure functions are exercised here.
const source = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const server = vm.runInNewContext(
  `${source}\n;({ parseRsvp, toRow, sanitizeCell, BLOCKED_WORDS, BLOCKED_STEMS, RULES_VERSION })`,
);
const { parseRsvp, toRow, sanitizeCell } = server;

const VALID_YES = { name: ' Tía Lupita ', attending: 'si', guests: '3', message: ' ¡Ahí estaremos! ' };

test('parses a complete yes', () => {
  const rsvp = parseRsvp(VALID_YES);

  assert.equal(rsvp.isValid, true);
  assert.equal(rsvp.name, 'Tía Lupita');
  assert.equal(rsvp.attending, 'si');
  assert.equal(rsvp.guests, 3);
  assert.equal(rsvp.message, '¡Ahí estaremos!');
});

test('a no is stored with zero guests', () => {
  const rsvp = parseRsvp({ name: 'Mario', attending: 'no', guests: '4' });

  assert.equal(rsvp.isValid, true);
  assert.equal(rsvp.guests, 0);
});

test('rejects what the page would never send', () => {
  const invalidInputs = [
    {},
    { ...VALID_YES, name: 'a' },
    { ...VALID_YES, attending: 'tal vez' },
    { ...VALID_YES, guests: '0' },
    { ...VALID_YES, guests: '6' },
    { ...VALID_YES, guests: 'dos' },
    { ...VALID_YES, message: 'a'.repeat(301) },
  ];

  for (const params of invalidInputs) {
    assert.equal(parseRsvp(params).isValid, false, JSON.stringify(params).slice(0, 60));
  }
});

test('builds the sheet row in column order', () => {
  const row = toRow(parseRsvp(VALID_YES), '2026-11-26 12:00');

  assert.deepEqual([...row], ['2026-11-26 12:00', 'Tía Lupita', 'Sí', 3, '¡Ahí estaremos!']);
});

test('neutralizes text that a spreadsheet would run as a formula', () => {
  for (const formula of ['=HYPERLINK("x")', '+1+1', '-2+3', '@SUM(A1)']) {
    assert.equal(sanitizeCell(formula), `'${formula}`);
  }
  assert.equal(sanitizeCell('Hola = adiós'), 'Hola = adiós');
});

test('the server rejects blocked words, digits in names and links in messages', () => {
  const rejected = [
    { ...VALID_YES, name: 'Pene' },
    { ...VALID_YES, name: 'P3ne' },
    { ...VALID_YES, name: 'Juan2' },
    { ...VALID_YES, message: 'pura mierda' },
    { ...VALID_YES, message: 'entra a www.spam.com' },
    { ...VALID_YES, message: '<img src=x onerror=alert(1)>' },
  ];
  for (const params of rejected) {
    assert.equal(parseRsvp(params).isValid, false, JSON.stringify(params));
  }
  assert.equal(parseRsvp({ ...VALID_YES, name: 'Penélope Vergara' }).isValid, true);
});

test('the server neutralizes cells starting with a tab or carriage return too', () => {
  assert.equal(sanitizeCell('\t=1+1'), "'\t=1+1");
  assert.equal(sanitizeCell('\r=1+1'), "'\r=1+1");
});

test('the page and the server block exactly the same words', async () => {
  const page = await import('../js/moderation.js');
  assert.deepEqual([...server.BLOCKED_WORDS], [...page.BLOCKED_WORDS]);
  assert.deepEqual([...server.BLOCKED_STEMS], [...page.BLOCKED_STEMS]);
});

test('the server reports which rules version it runs', () => {
  assert.equal(typeof server.RULES_VERSION, 'string');
});
