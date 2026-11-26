import { validateRsvp, submitRsvp } from './rsvp.js';

/** Wires the RSVP form: inline validation, sending, and the thank-you card. */
export function setupRsvpForm(form, endpoint, motion) {
  form.addEventListener('change', () => syncGuestsField(form));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit(form, endpoint, motion);
  });
}

async function handleSubmit(form, endpoint, motion) {
  const values = Object.fromEntries(new FormData(form));
  if (values.website) return; // honeypot filled: a bot, not a guest

  const { isValid, errors, data } = validateRsvp(values);
  showFieldErrors(form, errors);
  if (!isValid) {
    focusFirstInvalidField(form);
    return;
  }
  if (!endpoint) {
    setStatus(form, 'La confirmación todavía no está conectada. Inténtalo más tarde, por favor.');
    return;
  }

  setSending(form, true);
  try {
    await submitRsvp(endpoint, data);
    showThanks(form, data, motion);
  } catch (error) {
    console.error(error);
    setStatus(form, 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.');
  } finally {
    setSending(form, false);
  }
}

function syncGuestsField(form) {
  form.querySelector('[data-guests-field]').hidden = form.elements.attending.value === 'no';
}

function showFieldErrors(form, errors) {
  for (const message of form.querySelectorAll('[data-error-for]')) {
    const field = message.dataset.errorFor;
    message.textContent = errors[field] ?? '';
    markInvalid(form.elements[field], Boolean(errors[field]));
  }
}

function markInvalid(control, isInvalid) {
  // A radio group arrives as a RadioNodeList; single inputs as one element.
  const controls = control instanceof RadioNodeList ? [...control] : [control];
  for (const element of controls) element.setAttribute('aria-invalid', String(isInvalid));
}

function focusFirstInvalidField(form) {
  form.querySelector('[aria-invalid="true"]')?.focus();
}

function setStatus(form, text) {
  form.querySelector('[data-rsvp-status]').textContent = text;
}

function setSending(form, isSending) {
  const button = form.querySelector('[data-rsvp-submit]');
  button.disabled = isSending;
  button.textContent = isSending ? 'Enviando…' : 'Enviar confirmación';
  if (isSending) setStatus(form, '');
}

function showThanks(form, data, motion) {
  const done = form.parentElement.querySelector('[data-rsvp-done]');
  const firstName = data.name.split(' ')[0];
  const isComing = data.attending === 'si';

  done.querySelector('[data-rsvp-done-title]').textContent = isComing
    ? `¡Gracias, ${firstName}!`
    : `Gracias por avisarme, ${firstName}`;
  done.querySelector('[data-rsvp-done-text]').textContent = isComing
    ? `Ya te aparté ${data.guests === 1 ? 'tu lugar' : `${data.guests} lugares`}. Nos vemos el 19 de diciembre.`
    : 'Te voy a extrañar. Gracias por tu cariño.';

  form.hidden = true;
  done.hidden = false;
  done.focus();
  if (isComing) motion.celebrate(done);
}
