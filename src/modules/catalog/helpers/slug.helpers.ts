import {
  CYRILLIC_TO_LATIN,
  FALLBACK_SLUG,
  SLUG_MAX_LENGTH,
} from '../constants/slug.constants';

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
