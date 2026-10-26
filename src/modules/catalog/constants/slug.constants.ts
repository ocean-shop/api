/** Lowercase latin words joined by single hyphens, e.g. `wetsuit-5-mm`. */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SLUG_MAX_LENGTH = 255;

/** Used when a name holds nothing that survives transliteration. */
export const FALLBACK_SLUG = 'product';

/**
 * Ukrainian national transliteration (KMU 2010) in its in-word form, plus the
 * Russian letters it lacks, so slugs come out readable in latin URLs.
 */
export const CYRILLIC_TO_LATIN: Readonly<Record<string, string>> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ie',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'iu',
  я: 'ia',
  ё: 'e',
  ы: 'y',
  э: 'e',
  ъ: '',
  "'": '',
  '’': '',
  ʼ: '',
};
