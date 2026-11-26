import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIcsEvent } from '../js/calendar.js';

const EVENT = {
  uid: 'xv-ashley-2026@invitacion',
  title: 'XV de Ashley',
  startsAt: '2026-12-19T23:00:00Z',
  location: 'Cancún, Quintana Roo',
  description: 'Te espero; trae ganas de bailar, por favor',
  url: 'https://maps.app.goo.gl/pPBcRnayRJNArMoY9',
};
const STAMP = new Date('2026-11-26T12:00:00Z');

test('wraps one VEVENT inside a VCALENDAR with CRLF line endings', () => {
  const ics = buildIcsEvent(EVENT, STAMP);
  const lines = ics.split('\r\n');

  assert.equal(lines[0], 'BEGIN:VCALENDAR');
  assert.ok(lines.includes('VERSION:2.0'));
  assert.ok(lines.includes('BEGIN:VEVENT'));
  assert.ok(lines.includes('END:VEVENT'));
  assert.equal(lines.at(-2), 'END:VCALENDAR');
  assert.equal(lines.at(-1), '');
});

test('writes start and stamp in UTC basic format', () => {
  const lines = buildIcsEvent(EVENT, STAMP).split('\r\n');

  assert.ok(lines.includes('DTSTART:20261219T230000Z'));
  assert.ok(lines.includes('DTSTAMP:20261126T120000Z'));
  assert.ok(lines.includes('UID:xv-ashley-2026@invitacion'));
});

test('escapes commas and semicolons in text values', () => {
  const lines = buildIcsEvent(EVENT, STAMP).split('\r\n');

  assert.ok(lines.includes('LOCATION:Cancún\\, Quintana Roo'));
  assert.ok(lines.includes('DESCRIPTION:Te espero\\; trae ganas de bailar\\, por favor'));
});
