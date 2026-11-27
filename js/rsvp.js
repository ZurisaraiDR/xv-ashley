import { findBlockedWord } from './moderation.js';

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 300;
const ANSWERS = new Set(['si', 'no']);

// Letters (any accent), spaces, apostrophes, hyphens and dots: "María José O'Neil-Pérez".
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} '’.-]*$/u;
// Zero-width characters, used to slip blocked words past a filter ("Pe​ne").
const INVISIBLE_CHARACTERS = /[​-‍⁠﻿­]/g;
// Control characters, except the line break a message may legitimately contain.
const CONTROL_CHARACTERS = /[\u0000-\u0009\u000B-\u001F\u007F]/g;
const LINK_PATTERN = /(https?:\/\/|www\.|\b[\p{L}\d-]+\.(com|net|org|mx|io|xyz|ly|me|info|biz|link|site|online|app|co)\b)/iu;
const MARKUP_PATTERN = /[<>]/;

/**
 * Checks the RSVP form values at the boundary and returns them normalized.
 * Errors are keyed by field name so each one shows under its own input.
 * The Apps Script repeats these checks: the page can be bypassed, the server cannot.
 */
export function validateRsvp(values) {
  const data = normalize(values);
  const errors = {};

  const nameProblem = findNameProblem(data.name);
  if (nameProblem) errors.name = nameProblem;
  if (!ANSWERS.has(data.attending)) {
    errors.attending = 'Cuéntame si vas a poder venir.';
  }
  const messageProblem = findMessageProblem(data.message);
  if (messageProblem) errors.message = messageProblem;

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
    name: cleanText(values.name).replace(/\s+/g, ' '),
    attending,
    // The form no longer asks how many come: each "yes" is the guest confirming. The deployed
    // Apps Script still expects 1–5 guests for a yes, so the yes always sends 1.
    guests: attending === 'si' ? 1 : 0,
    message: cleanText(values.message),
  };
}

function cleanText(value) {
  return String(value ?? '').replace(INVISIBLE_CHARACTERS, '').replace(CONTROL_CHARACTERS, '').trim();
}

function findNameProblem(name) {
  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    return 'Escribe tu nombre para saber quién viene.';
  }
  if (!NAME_PATTERN.test(name)) return 'Escribe tu nombre solo con letras, sin números ni símbolos.';
  if (findBlockedWord(name)) return 'Ese nombre no se puede usar. Escribe tu nombre real, por favor.';
  return null;
}

function findMessageProblem(message) {
  if (message.length > MAX_MESSAGE_LENGTH) return `Tu mensaje puede tener hasta ${MAX_MESSAGE_LENGTH} caracteres.`;
  if (MARKUP_PATTERN.test(message)) return 'Tu mensaje no puede llevar los símbolos < o >.';
  if (LINK_PATTERN.test(message)) return 'Tu mensaje no puede llevar enlaces.';
  if (findBlockedWord(message)) return 'Tu mensaje tiene palabras que no se permiten. ¿Lo puedes reescribir?';
  return null;
}
