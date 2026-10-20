import { SLUG_MAX_LENGTH, SLUG_REGEX } from '../constants/slug.constants';
import { slugify, withSlugSuffix } from './slug.helpers';

describe('slug helpers', () => {
  describe('slugify', () => {
    it('should transliterate ukrainian names', () => {
      expect(slugify('Гідрокостюм Щука 5 мм')).toBe(
        'hidrokostium-shchuka-5-mm',
      );
    });

    it('should drop apostrophes and soft signs inside words', () => {
      expect(slugify("Об'ємна сумка")).toBe('obiemna-sumka');
      expect(slugify('Сіль морська')).toBe('sil-morska');
    });

    it('should strip latin diacritics and collapse separators', () => {
      expect(slugify('  Crème -- Brûlée!! ')).toBe('creme-brulee');
    });

    it('should fall back when nothing survives', () => {
      expect(slugify('!!!')).toBe('product');
    });

    it('should cap the length without a trailing hyphen', () => {
      const slug = slugify(`${'a'.repeat(SLUG_MAX_LENGTH - 1)} b`);

      expect(slug).toHaveLength(SLUG_MAX_LENGTH - 1);
      expect(slug).toMatch(SLUG_REGEX);
    });
  });

  describe('withSlugSuffix', () => {
    it('should keep the base on the first attempt', () => {
      expect(withSlugSuffix('mask', 1)).toBe('mask');
    });

    it('should append the attempt number afterwards', () => {
      expect(withSlugSuffix('mask', 3)).toBe('mask-3');
    });

    it('should trim a long base so the suffix fits', () => {
      const slug = withSlugSuffix('a'.repeat(SLUG_MAX_LENGTH), 12);

      expect(slug).toHaveLength(SLUG_MAX_LENGTH);
      expect(slug.endsWith('-12')).toBe(true);
    });
  });
});
