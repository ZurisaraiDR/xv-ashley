// Blocks swear words and obscene names in Spanish and English, including the usual tricks to sneak
// them in: accents, digits for letters, repeated letters and letters split by dots or spaces.
// apps-script/Code.gs keeps an identical copy of both lists (a test checks they stay equal).

// Compared against whole words only: they can live inside real words ("Penélope", "Vergara").
export const BLOCKED_WORDS = [
  'ano', 'anal', 'cuca', 'cuquita', 'pito', 'pitito', 'pene', 'nepe', 'culo', 'culito', 'culero', 'culera',
  'teta', 'tetas', 'tetona', 'chichis', 'nalga', 'nalgas', 'pija', 'polla', 'coño', 'panocha', 'verga',
  'vergas', 'vergota', 'puta', 'puto', 'putas', 'putos', 'putita', 'putito', 'perra', 'zorra', 'joto', 'jotos',
  'marica', 'maricon', 'maricona', 'pendejo', 'pendeja', 'chinga', 'chingada', 'chingar', 'chingon',
  'mamada', 'mamadas', 'mamon', 'mamona', 'mierda', 'caca', 'pedo', 'pedorro', 'sexo', 'porno', 'cabron',
  'cabrona', 'idiota', 'imbecil', 'estupido', 'estupida', 'puñeta', 'puñetas',
  'ass', 'asshole', 'dick', 'cock', 'cum', 'tit', 'tits', 'boobs', 'penis', 'vagina', 'pussy', 'fuck', 'fucker',
  'shit', 'bullshit', 'bitch', 'slut', 'whore', 'cunt', 'fag', 'faggot', 'nigger', 'nigga', 'retard',
  'bastard', 'sex', 'porn', 'nazi', 'hitler', 'dildo', 'horny',
];

// Searched anywhere, even across words: they are never part of an ordinary word.
export const BLOCKED_STEMS = [
  'pendej', 'chingad', 'mierd', 'fuck', 'pussy', 'bitch', 'whore', 'motherf', 'cabron', 'culer', 'maricon',
];

const DIGITS_FOR_LETTERS = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };
const BLOCKED_WORD_SET = new Set(BLOCKED_WORDS.map(normalizeForModeration));
const BLOCKED_STEM_LIST = BLOCKED_STEMS.map(normalizeForModeration);

/** Returns the first blocked word found in the text, or null when the text is clean. */
export function findBlockedWord(text) {
  const words = splitIntoWords(normalizeForModeration(text));
  const blockedWord = words.find((word) => BLOCKED_WORD_SET.has(word));
  if (blockedWord) return blockedWord;

  const allLetters = words.join('');
  return BLOCKED_STEM_LIST.find((stem) => allLetters.includes(stem)) ?? null;
}

/**
 * Lowercase, digits read as letters, accents removed (ñ kept, so "año" never reads as "ano"),
 * letters glued across dots or dashes ("p.e.n.e") and repeated letters collapsed ("puuuto").
 */
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

/** Splits on anything that is not a letter and glues runs of single letters ("p u t a" → "puta"). */
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
