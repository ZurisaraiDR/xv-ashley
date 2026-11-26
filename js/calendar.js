// iCalendar format: https://datatracker.ietf.org/doc/html/rfc5545
const CRLF = '\r\n';
// RFC 5545 §3.1 folds lines at 75 octets; 60 characters leaves room for multi-byte letters.
const MAX_LINE_CHARS = 60;

/** Offers the event as an .ics file the phone opens in its calendar app. */
export function downloadIcsEvent(event, fileName) {
  const file = new Blob([buildIcsEvent(event, new Date())], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function buildIcsEvent(event, stampDate) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//XV Ashley//Invitacion//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${toUtcBasic(stampDate)}`,
    `DTSTART:${toUtcBasic(new Date(event.startsAt))}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.location)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `URL:${event.url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}

function toUtcBasic(date) {
  return date.toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(text) {
  return text.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n');
}

function foldLine(line) {
  const chunks = [];
  for (let start = 0; start < line.length; start += MAX_LINE_CHARS) {
    chunks.push(line.slice(start, start + MAX_LINE_CHARS));
  }
  return chunks.join(`${CRLF} `);
}
