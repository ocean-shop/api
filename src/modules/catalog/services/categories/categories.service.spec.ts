import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { CategoryRepository } from '../../repositories/category/category.repository';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: CategoryRepository;

  beforeEach(async () => {
    const categoryRepositoryMock = {
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      findOneById: jest.fn(),
      findByShopIdAndSlug: jest.fn(),
      getMaxSort: jest.fn().mockResolvedValue(-1),
      findAdjacentSibling: jest.fn(),
      swapSort: jest.fn(),
      create: jest.fn(),
      save: jest.fn((category) => Promise.resolve(category)),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoryRepository, useValue: categoryRepositoryMock },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoryRepository = module.get<CategoryRepository>(CategoryRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list categories with pagination', async () => {
    jest.mocked(categoryRepository.findAllPaginated).mockResolvedValue({
      items: [{ id: '1' }] as any,
      total: 1,
    });

    const result = await service.listCategories({ page: 1, limit: 20 });

    expect(categoryRepository.findAllPaginated).toHaveBeenCalledWith({}, 0, 20);
    expect(result.totalPages).toBe(1);
  });

  it('should return one category', async () => {
    const category = { id: '1', name: 'Accessories' } as any;
    jest.mocked(categoryRepository.findById).mockResolvedValue(category);

    const result = await service.getCategoryById('1');

    expect(categoryRepository.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual(category);
  });

  it('should create category without parent', async () => {
    const payload = {
      id: '1',
      shopId: 'shop-id',
      parentId: null,
      name: 'Accessories',
      slug: 'accessories',
      sort: 0,
    } as any;
    jest.mocked(categoryRepository.getMaxSort).mockResolvedValue(-1);
    jest.mocked(categoryRepository.create).mockReturnValue(payload);
    jest.mocked(categoryRepository.save).mockResolvedValue(payload);

    const result = await service.createCategory({
      shopId: 'shop-id',
      name: 'Accessories',
      slug: 'accessories',
    });

    expect(categoryRepository.getMaxSort).toHaveBeenCalledWith('shop-id', null);
    expect(categoryRepository.create).toHaveBeenCalledWith({
      shopId: 'shop-id',
      parentId: null,
      name: 'Accessories',
      slug: 'accessories',
      sort: 0,
    });
    expect(result).toEqual(payload);
  });

  it('should assign next sort when creating among existing siblings', async () => {
    const payload = {
      id: '2',
      shopId: 'shop-id',
      parentId: null,
      name: 'Bags',
      slug: 'bags',
      sort: 2,
    } as any;
    jest.mocked(categoryRepository.getMaxSort).mockResolvedValue(1);
    jest.mocked(categoryRepository.create).mockReturnValue(payload);

    await service.createCategory({
      shopId: 'shop-id',
      name: 'Bags',
      slug: 'bags',
    });

    expect(categoryRepository.create).toHaveBeenCalledWith({
      shopId: 'shop-id',
      parentId: null,
      name: 'Bags',
      slug: 'bags',
      sort: 2,
    });
  });

  it('should throw when parent category is missing on create', async () => {
    jest.mocked(categoryRepository.findOneById).mockResolvedValue(null);

    await expect(
      service.createCategory({
        shopId: 'shop-id',
        parentId: 'parent-id',
        name: 'Accessories',
        slug: 'accessories',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw when parent category belongs to another shop on create', async () => {
    jest.mocked(categoryRepository.findOneById).mockResolvedValue({
      id: 'parent-id',
      shopId: 'another-shop-id',
    } as any);

    await expect(
      service.createCategory({
        shopId: 'shop-id',
        parentId: 'parent-id',
        name: 'Accessories',
        slug: 'accessories',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when slug already exists in shop on create', async () => {
    jest.mocked(categoryRepository.findByShopIdAndSlug).mockResolvedValue({
      id: 'existing-id',
      shopId: 'shop-id',
      slug: 'accessories',
    } as any);

    await expect(
      service.createCategory({
        shopId: 'shop-id',
        name: 'Accessories',
        slug: 'accessories',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw bad request when category slug already exists on create', async () => {
    const payload = {
      id: '1',
      shopId: 'shop-id',
      parentId: null,
      name: 'Accessories',
      slug: 'accessories',
      sort: 0,
    } as any;

    jest.mocked(categoryRepository.create).mockReturnValue(payload);
    jest.mocked(categoryRepository.save).mockRejectedValue(
      new QueryFailedError('INSERT INTO categories', [], {
        code: '23505',
        constraint: 'uq_categories_shop_root_slug',
      }),
    );

    await expect(
      service.createCategory({
        shopId: 'shop-id',
        name: 'Accessories',
        slug: 'accessories',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update a category', async () => {
    const existing = {
      id: '1',
      shopId: 'shop-id',
      name: 'Accessories',
      slug: 'accessories',
      parentId: null,
      sort: 0,
    } as any;
    const saved = { ...existing, name: 'Updated', slug: 'updated' };

    jest.mocked(categoryRepository.findById).mockResolvedValue(existing);
    jest.mocked(categoryRepository.save).mockResolvedValue(saved);

    const result = await service.updateCategory('1', {
      name: 'Updated',
      slug: 'updated',
    });

    expect(categoryRepository.save).toHaveBeenCalledWith({
      ...existing,
      name: 'Updated',
      slug: 'updated',
    });
    expect(result).toEqual(saved);
  });

  it('should reassign sort when reparenting a category', async () => {
    const existing = {
      id: '1',
      shopId: 'shop-id',
      name: 'Accessories',
      slug: 'accessories',
      parentId: null,
      sort: 0,
    } as any;

    jest.mocked(categoryRepository.findById).mockResolvedValue(existing);
    jest.mocked(categoryRepository.findOneById).mockResolvedValue({
      id: 'parent-id',
      shopId: 'shop-id',
    } as any);
    jest.mocked(categoryRepository.getMaxSort).mockResolvedValue(4);

    await service.updateCategory('1', { parentId: 'parent-id' });

    expect(categoryRepository.getMaxSort).toHaveBeenCalledWith(
      'shop-id',
      'parent-id',
    );
    expect(categoryRepository.save).toHaveBeenCalledWith({
      ...existing,
      parentId: 'parent-id',
      sort: 5,
    });
  });

  it('should throw when category becomes its own parent', async () => {
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: '1',
      shopId: 'shop-id',
    } as any);

    await expect(
      service.updateCategory('1', { parentId: '1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when parent category is missing on update', async () => {
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: '1',
      shopId: 'shop-id',
    } as any);
    jest.mocked(categoryRepository.findOneById).mockResolvedValue(null);

    await expect(
      service.updateCategory('1', { parentId: 'parent-id' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw when parent category belongs to another shop on update', async () => {
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: '1',
      shopId: 'shop-id',
    } as any);
    jest.mocked(categoryRepository.findOneById).mockResolvedValue({
      id: 'parent-id',
      shopId: 'another-shop-id',
    } as any);

    await expect(
      service.updateCategory('1', { parentId: 'parent-id' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when slug already exists in shop on update', async () => {
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: '1',
      shopId: 'shop-id',
      slug: 'old-slug',
    } as any);
    jest.mocked(categoryRepository.findByShopIdAndSlug).mockResolvedValue({
      id: 'existing-id',
      shopId: 'shop-id',
      slug: 'new-slug',
    } as any);

    await expect(
      service.updateCategory('1', { slug: 'new-slug' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw bad request when category slug already exists on update', async () => {
    const existing = {
      id: '1',
      shopId: 'shop-id',
      name: 'Accessories',
      slug: 'accessories',
      parentId: null,
    } as any;

    jest.mocked(categoryRepository.findById).mockResolvedValue(existing);
    jest.mocked(categoryRepository.save).mockRejectedValue(
      new QueryFailedError('UPDATE categories', [], {
        code: '23505',
        constraint: 'uq_categories_shop_root_slug',
      }),
    );

    await expect(
      service.updateCategory('1', {
        slug: 'accessories',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should move category sort up', async () => {
    const category = {
      id: '2',
      shopId: 'shop-id',
      parentId: null,
      sort: 1,
    } as any;
    const sibling = { id: '1', sort: 0 } as any;
    const swapped = { ...category, sort: 0 };

    jest.mocked(categoryRepository.findById).mockResolvedValue(category);
    jest
      .mocked(categoryRepository.findAdjacentSibling)
      .mockResolvedValue(sibling);
    jest.mocked(categoryRepository.swapSort).mockResolvedValue(swapped);

    const result = await service.changeCategorySort('2', { direction: 'up' });

    expect(categoryRepository.findAdjacentSibling).toHaveBeenCalledWith(
      category,
      'up',
    );
    expect(categoryRepository.swapSort).toHaveBeenCalledWith(category, sibling);
    expect(result).toEqual(swapped);
  });

  it('should move category sort down', async () => {
    const category = {
      id: '1',
      shopId: 'shop-id',
      parentId: null,
      sort: 0,
    } as any;
    const sibling = { id: '2', sort: 1 } as any;
    const swapped = { ...category, sort: 1 };

    jest.mocked(categoryRepository.findById).mockResolvedValue(category);
    jest
      .mocked(categoryRepository.findAdjacentSibling)
      .mockResolvedValue(sibling);
    jest.mocked(categoryRepository.swapSort).mockResolvedValue(swapped);

    const result = await service.changeCategorySort('1', { direction: 'down' });

    expect(categoryRepository.findAdjacentSibling).toHaveBeenCalledWith(
      category,
      'down',
    );
    expect(result).toEqual(swapped);
  });

  it('should throw when category is already at the top', async () => {
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: '1',
      sort: 0,
    } as any);
    jest.mocked(categoryRepository.findAdjacentSibling).mockResolvedValue(null);

    await expect(
      service.changeCategorySort('1', { direction: 'up' }),
    ).rejects.toThrow(
      new BadRequestException('Category is already at the top'),
    );
  });

  it('should throw when category is already at the bottom', async () => {
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: '1',
      sort: 2,
    } as any);
    jest.mocked(categoryRepository.findAdjacentSibling).mockResolvedValue(null);

    await expect(
      service.changeCategorySort('1', { direction: 'down' }),
    ).rejects.toThrow(
      new BadRequestException('Category is already at the bottom'),
    );
  });

  it('should remove a category', async () => {
    const category = { id: '1', name: 'Accessories' } as any;
    jest.mocked(categoryRepository.findById).mockResolvedValue(category);
    jest.mocked(categoryRepository.remove).mockResolvedValue(category);

    const result = await service.removeCategory('1');

    expect(categoryRepository.findById).toHaveBeenCalledWith('1');
    expect(categoryRepository.remove).toHaveBeenCalledWith(category);
    expect(result).toEqual({ message: 'Category removed successfully' });
  });
});
