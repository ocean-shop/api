/** Lowercase latin words joined by single hyphens, e.g. `wetsuit-5-mm`. */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SLUG_MAX_LENGTH = 255;

/** Used when a name holds nothing that survives transliteration. */
const FALLBACK_SLUG = 'product';

/**
 * Ukrainian national transliteration (KMU 2010) in its in-word form, plus the
 * Russian letters it lacks, so slugs come out readable in latin URLs.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
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

/** Turns a free-form name into a slug matching `SLUG_REGEX`. */
export function slugify(value: string, maxLength = SLUG_MAX_LENGTH): string {
  const transliterated = Array.from(value.toLowerCase())
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join('')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');

  const slug = transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, '');

  return slug || FALLBACK_SLUG;
}

/** `base`, then `base-2`, `base-3`, … trimmed so the suffix always fits. */
export function withSlugSuffix(base: string, attempt: number): string {
  if (attempt <= 1) {
    return base;
  }

  const suffix = `-${attempt}`;
  const trimmedBase = base
    .slice(0, SLUG_MAX_LENGTH - suffix.length)
    .replace(/-+$/, '');

  return `${trimmedBase}${suffix}`;
}
