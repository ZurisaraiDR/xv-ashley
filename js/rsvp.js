const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 300;
const ANSWERS = new Set(['si', 'no']);

/**
 * Checks the RSVP form values at the boundary and returns them normalized.
 * Errors are keyed by field name so each one shows under its own input.
 */
export function validateRsvp(values) {
  const data = normalize(values);
  const errors = {};

  if (data.name.length < MIN_NAME_LENGTH || data.name.length > MAX_NAME_LENGTH) {
    errors.name = 'Escribe tu nombre para saber quién viene.';
  }
  if (!ANSWERS.has(data.attending)) {
    errors.attending = 'Cuéntame si vas a poder venir.';
  }
  if (data.message.length > MAX_MESSAGE_LENGTH) {
    errors.message = `Tu mensaje puede tener hasta ${MAX_MESSAGE_LENGTH} caracteres.`;
  }

  return { isValid: Object.keys(errors).length === 0, errors, data };
}

/** Sends a validated RSVP to the Google Apps Script web app (apps-script/Code.gs). */
export async function submitRsvp(endpoint, data) {
  // A form-encoded body is a CORS "simple request", so Apps Script needs no preflight.
  const response = await fetch(endpoint, { method: 'POST', body: new URLSearchParams(data) });
  if (!response.ok) throw new Error(`RSVP endpoint answered ${response.status}`);

  // Apps Script answers 200 even when it rejects the data; the verdict is in the body.
  const result = await response.json();
  if (!result.ok) throw new Error(`RSVP endpoint rejected the answers: ${result.error}`);
}

function normalize(values) {
  const attending = String(values.attending ?? '').trim();
  return {
    name: String(values.name ?? '').trim(),
    attending,
    // The form no longer asks how many come: each "yes" is the guest confirming. The deployed
    // Apps Script still expects 1–5 guests for a yes, so the yes always sends 1.
    guests: attending === 'si' ? 1 : 0,
    message: String(values.message ?? '').trim(),
  };
}
