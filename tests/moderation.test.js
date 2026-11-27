import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findBlockedWord } from '../js/moderation.js';

test('blocks the words the owner listed, in any case', () => {
  for (const text of ['Ano', 'Cuca', 'Pito', 'Pene', 'Nepe', 'Pussy', 'Dick', 'PENE']) {
    assert.ok(findBlockedWord(text), `"${text}" should be blocked`);
  }
});

test('blocks common Spanish and English swear words inside a sentence', () => {
  for (const text of ['eres un pendejo', 'que chingados', 'puta madre', 'fuck you', 'what a bitch', 'pura mierda']) {
    assert.ok(findBlockedWord(text), `"${text}" should be blocked`);
  }
});

test('sees through accents, numbers for letters, repeated letters and spaced letters', () => {
  for (const text of ['Píto', 'P3ne', 'pu7o', 'PUUUTO', 'p.e.n.e', 'p u t a', 'p-i-t-o', 'Cu.Ca']) {
    assert.ok(findBlockedWord(text), `"${text}" should be blocked`);
  }
});

test('lets real names and everyday words through', () => {
  const clean = [
    'Penélope', 'Ana Vergara', 'Año nuevo', 'Feliz año', 'Dickens', 'Ánodo', 'Pitón',
    'Computadora', 'Disputa', 'Reputación', 'Pablo Anaya', 'Cucaracha', 'Ana López',
    'Concepción', 'Peñaloza', 'Estefanía', 'Pepe', 'Ashley Alejandra Delgado Rodriguez',
    '¡Felicidades! Te queremos mucho, nos vemos en tu fiesta',
  ];
  for (const text of clean) {
    assert.equal(findBlockedWord(text), null, `"${text}" should be allowed`);
  }
});

test('blocks common insults used as names or in messages, in Spanish and English', () => {
  const insults = [
    'Tonta', 'tonto', 'T0nta', 'Mensa', 'menso', 'Babosa', 'baboso', 'Tarada', 'Naca', 'Fea', 'feo',
    'Inútil', 'Cerda', 'Puerca', 'Bruta', 'Retrasada', 'Estúpida', 'Idiota',
    'stupid', 'dumb', 'idiot', 'moron', 'loser', 'ugly', 'dummy',
    'no seas tonta',
  ];
  for (const text of insults) {
    assert.ok(findBlockedWord(text), `"${text}" should be blocked`);
  }
});

test('still lets through names that only look like an insult', () => {
  for (const text of ['Tonatiuh', 'Menéndez', 'Bobadilla', 'Feodora', 'Tontines', 'Brutus', 'Dumbledore', 'Fermín']) {
    assert.equal(findBlockedWord(text), null, `"${text}" should be allowed`);
  }
});
