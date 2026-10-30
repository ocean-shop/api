import { PAGINATION_MAX } from '../../constants/pagination.constants';
import { resolvePagination, toListResponse } from './list-response.helpers';

describe('list-response.helpers', () => {
  describe('resolvePagination', () => {
    it('should default to the first page of the maximum size', () => {
      expect(resolvePagination({})).toEqual({
        page: 1,
        limit: PAGINATION_MAX,
        skip: 0,
      });
    });

    it('should skip the rows of the previous pages', () => {
      expect(resolvePagination({ page: 3, limit: 10 })).toEqual({
        page: 3,
        limit: 10,
        skip: 20,
      });
    });
  });

  describe('toListResponse', () => {
    it('should round the page count up', () => {
      expect(toListResponse(['a', 'b'], 21, 1, 10)).toEqual({
        items: ['a', 'b'],
        total: 21,
        page: 1,
        limit: 10,
        totalPages: 3,
      });
    });

    it('should report no pages when nothing matches', () => {
      expect(toListResponse([], 0, 1, 10).totalPages).toBe(0);
    });
  });
});
