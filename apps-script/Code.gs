// RSVP receiver for the XV invitation, bound to its Google Sheet.
// Web apps:      https://developers.google.com/apps-script/guides/web
// JSON output:   https://developers.google.com/apps-script/guides/content
// CacheService:  https://developers.google.com/apps-script/reference/cache/cache-service
// Deploy steps:  apps-script/README.md

// Shown by doGet, so the owner (and a test from the outside) can tell which rules are live.
const RULES_VERSION = '2026-11-26 insultos';
const SHEET_NAME = 'Confirmaciones';
const HEADERS = ['Fecha', 'Nombre', '¿Asiste?', 'Personas', 'Mensaje'];
const TIME_ZONE = 'America/Cancun';
const LOCK_TIMEOUT_MS = 10000;
const MAX_BODY_CHARACTERS = 2000;          // a real RSVP is a few hundred characters
const MAX_RSVPS_PER_MINUTE = 20;           // stops a script from flooding the sheet

// Same rules as js/rsvp.js and js/moderation.js. They are repeated on purpose: anyone can call
// this URL without the page, so the server checks again; the two runtimes cannot share a module.
const MAX_GUESTS = 5;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 300;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} '’.-]*$/u;
const INVISIBLE_CHARACTERS = /[​-‍⁠﻿­]/g;
const CONTROL_CHARACTERS = /[\u0000-\u0009\u000B-\u001F\u007F]/g;
const LINK_PATTERN = /(https?:\/\/|www\.|\b[\p{L}\d-]+\.(com|net|org|mx|io|xyz|ly|me|info|biz|link|site|online|app|co)\b)/iu;
const MARKUP_PATTERN = /[<>]/;

// Identical to js/moderation.js (tests/apps-script.test.js checks both lists stay equal).
const BLOCKED_WORDS = [
  'ano', 'anal', 'cuca', 'cuquita', 'pito', 'pitito', 'pene', 'nepe', 'culo', 'culito', 'culero', 'culera',
  'teta', 'tetas', 'tetona', 'chichis', 'nalga', 'nalgas', 'pija', 'polla', 'coño', 'panocha', 'verga',
  'vergas', 'vergota', 'puta', 'puto', 'putas', 'putos', 'putita', 'putito', 'perra', 'zorra', 'joto', 'jotos',
  'marica', 'maricon', 'maricona', 'pendejo', 'pendeja', 'chinga', 'chingada', 'chingar', 'chingon',
  'mamada', 'mamadas', 'mamon', 'mamona', 'mierda', 'caca', 'pedo', 'pedorro', 'sexo', 'porno', 'cabron',
  'cabrona', 'idiota', 'imbecil', 'estupido', 'estupida', 'puñeta', 'puñetas',
  'tonta', 'tonto', 'tontas', 'tontos', 'mensa', 'menso', 'mensas', 'mensos', 'babosa', 'baboso', 'babosas',
  'babosos', 'tarada', 'tarado', 'naca', 'naco', 'fea', 'feo', 'inutil', 'cerda', 'cerdo', 'puerca', 'puerco',
  'bruta', 'bruto', 'retrasada', 'retrasado', 'mongol', 'mongola', 'subnormal',
  'ass', 'asshole', 'dick', 'cock', 'cum', 'tit', 'tits', 'boobs', 'penis', 'vagina', 'pussy', 'fuck', 'fucker',
  'shit', 'bullshit', 'bitch', 'slut', 'whore', 'cunt', 'fag', 'faggot', 'nigger', 'nigga', 'retard',
  'bastard', 'sex', 'porn', 'nazi', 'hitler', 'dildo', 'horny',
  'stupid', 'dumb', 'idiot', 'moron', 'loser', 'ugly', 'dummy', 'jerk', 'sucker',
];
const BLOCKED_STEMS = [
  'pendej', 'chingad', 'mierd', 'fuck', 'pussy', 'bitch', 'whore', 'motherf', 'cabron', 'culer', 'maricon',
];
const DIGITS_FOR_LETTERS = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };
const BLOCKED_WORD_SET = new Set(BLOCKED_WORDS.map(normalizeForModeration));
const BLOCKED_STEM_LIST = BLOCKED_STEMS.map(normalizeForModeration);

function doPost(e) {
  if (isTooLarge(e) || isOverRateLimit()) return jsonResponse({ ok: false, error: 'rejected' });

  const rsvp = parseRsvp(e.parameter);
  if (!rsvp.isValid) return jsonResponse({ ok: false, error: 'invalid' });

  const timestamp = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd HH:mm');
  appendRow(toRow(rsvp, timestamp));
  return jsonResponse({ ok: true });
}

/** Opening the /exec URL in a browser confirms the deployment works. */
function doGet() {
  return jsonResponse({ ok: true, message: 'Confirmaciones listas', version: RULES_VERSION });
}

function parseRsvp(params) {
  const name = cleanText(params.name).replace(/\s+/g, ' ');
  const attending = String(params.attending || '').trim();
  const guests = attending === 'no' ? 0 : Number(params.guests);
  const message = cleanText(params.message);

  const isValid = isNameAcceptable(name)
    && (attending === 'si' || attending === 'no')
    && (attending === 'no' || (Number.isInteger(guests) && guests >= 1 && guests <= MAX_GUESTS))
    && isMessageAcceptable(message);

  return { isValid, name, attending, guests, message };
}

function cleanText(value) {
  return String(value || '').replace(INVISIBLE_CHARACTERS, '').replace(CONTROL_CHARACTERS, '').trim();
}

function isNameAcceptable(name) {
  return name.length >= MIN_NAME_LENGTH
    && name.length <= MAX_NAME_LENGTH
    && NAME_PATTERN.test(name)
    && !findBlockedWord(name);
}

function isMessageAcceptable(message) {
  return message.length <= MAX_MESSAGE_LENGTH
    && !MARKUP_PATTERN.test(message)
    && !LINK_PATTERN.test(message)
    && !findBlockedWord(message);
}

/** Returns the first blocked word found in the text, or null when the text is clean. */
function findBlockedWord(text) {
  const words = splitIntoWords(normalizeForModeration(text));
  const blockedWord = words.find((word) => BLOCKED_WORD_SET.has(word));
  if (blockedWord) return blockedWord;

  const allLetters = words.join('');
  return BLOCKED_STEM_LIST.find((stem) => allLetters.includes(stem)) || null;
}

function normalizeForModeration(text) {
  return String(text)
    .toLowerCase()
    .replace(/[013457@$]/g, (character) => DIGITS_FOR_LETTERS[character])
    .normalize('NFD')
    .replace(/ñ/g, 'ñ')
    .replace(/\p{M}/gu, '')
    .replace(/(\p{L})[._\-*·'’]+(?=\p{L})/gu, '$1')
    .replace(/(\p{L})\1+/gu, '$1');
}

function splitIntoWords(text) {
  const words = [];
  let spelledOut = '';
  for (const word of text.split(/\P{L}+/u).filter(Boolean)) {
    if (word.length === 1) {
      spelledOut += word;
      continue;
    }
    if (spelledOut) words.push(spelledOut);
    spelledOut = '';
    words.push(word);
  }
  if (spelledOut) words.push(spelledOut);
  return words;
}

function toRow(rsvp, timestamp) {
  return [
    timestamp,
    sanitizeCell(rsvp.name),
    rsvp.attending === 'si' ? 'Sí' : 'No',
    rsvp.guests,
    sanitizeCell(rsvp.message),
  ];
}

/**
 * Text starting with = + - @, a tab or a carriage return can run as a formula in Sheets or Excel.
 * A leading apostrophe keeps it as plain text (OWASP: CSV injection).
 */
function sanitizeCell(text) {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function isTooLarge(e) {
  return Boolean(e.postData) && e.postData.contents.length > MAX_BODY_CHARACTERS;
}

/** Counts RSVPs per minute in the script cache; past the limit, new ones are turned away. */
function isOverRateLimit() {
  const cache = CacheService.getScriptCache();
  const key = `rsvps-${Math.floor(Date.now() / 60000)}`;
  const count = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(count), 120);
  return count > MAX_RSVPS_PER_MINUTE;
}

function appendRow(row) {
  // Two guests confirming at the same second must not overwrite each other.
  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    getOrCreateSheet().appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const existing = spreadsheet.getSheetByName(SHEET_NAME);
  if (existing) return existing;

  const sheet = spreadsheet.insertSheet(SHEET_NAME);
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  return sheet;
}

function jsonResponse(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
