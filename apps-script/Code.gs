// RSVP receiver for the XV invitation, bound to its Google Sheet.
// Web apps:      https://developers.google.com/apps-script/guides/web
// JSON output:   https://developers.google.com/apps-script/guides/content
// Deploy steps:  apps-script/README.md

const SHEET_NAME = 'Confirmaciones';
const HEADERS = ['Fecha', 'Nombre', '¿Asiste?', 'Personas', 'Mensaje'];
const TIME_ZONE = 'America/Cancun';
const LOCK_TIMEOUT_MS = 10000;

// Same limits as js/rsvp.js. They are repeated on purpose: anyone can call this URL
// without the page, so the server checks again; the two runtimes cannot share a module.
const MAX_GUESTS = 5;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 300;

function doPost(e) {
  const rsvp = parseRsvp(e.parameter);
  if (!rsvp.isValid) return jsonResponse({ ok: false, error: 'invalid' });

  const timestamp = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd HH:mm');
  appendRow(toRow(rsvp, timestamp));
  return jsonResponse({ ok: true });
}

/** Opening the /exec URL in a browser confirms the deployment works. */
function doGet() {
  return jsonResponse({ ok: true, message: 'Confirmaciones listas' });
}

function parseRsvp(params) {
  const name = String(params.name || '').trim();
  const attending = String(params.attending || '').trim();
  const guests = attending === 'no' ? 0 : Number(params.guests);
  const message = String(params.message || '').trim();

  const isValid = name.length >= MIN_NAME_LENGTH
    && name.length <= MAX_NAME_LENGTH
    && (attending === 'si' || attending === 'no')
    && (attending === 'no' || (Number.isInteger(guests) && guests >= 1 && guests <= MAX_GUESTS))
    && message.length <= MAX_MESSAGE_LENGTH;

  return { isValid, name, attending, guests, message };
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
 * Text starting with = + - or @ would run as a formula in Sheets or Excel.
 * A leading apostrophe keeps it as plain text (OWASP: CSV injection).
 */
function sanitizeCell(text) {
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
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
