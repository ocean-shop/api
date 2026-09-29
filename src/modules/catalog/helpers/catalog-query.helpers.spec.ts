import {
  escapeLikeWildcards,
  normalizeSearchTerm,
} from './catalog-query.helpers';

describe('normalizeSearchTerm', () => {
  it.each([
    ['  Ocean Tee  ', 'ocean tee'],
    ['OCEAN   TEE', 'ocean tee'],
    ['Ocean\tTee', 'ocean tee'],
  ])('should fold %j into the same term', (value, expected) => {
    expect(normalizeSearchTerm(value)).toBe(expected);
  });

  it('should leave a whitespace only term empty so validation rejects it', () => {
    expect(normalizeSearchTerm('   ')).toBe('');
  });

  it('should pass non strings through to the validation', () => {
    expect(normalizeSearchTerm(undefined)).toBeUndefined();
    expect(normalizeSearchTerm(['ocean'])).toEqual(['ocean']);
  });
});

describe('escapeLikeWildcards', () => {
  it.each([
    ['50%', '50\\%'],
    ['tee_1', 'tee\\_1'],
    ['back\\slash', 'back\\\\slash'],
  ])('should escape the wildcards of %j', (term, expected) => {
    expect(escapeLikeWildcards(term)).toBe(expected);
  });

  it('should leave a term without wildcards untouched', () => {
    expect(escapeLikeWildcards('ocean tee')).toBe('ocean tee');
  });
});
