import { Test, TestingModule } from '@nestjs/testing';
import { CategoryClientRepository } from '../../../repositories/category/client/category-client.repository';
import { CategoriesClientService } from './categories-client.service';

describe('CategoriesClientService', () => {
  let service: CategoriesClientService;
  let categoryClientRepository: CategoryClientRepository;

  beforeEach(async () => {
    const categoryClientRepositoryMock = {
      findAllPaginated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesClientService,
        {
          provide: CategoryClientRepository,
          useValue: categoryClientRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<CategoriesClientService>(CategoriesClientService);
    categoryClientRepository = module.get<CategoryClientRepository>(
      CategoryClientRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list categories with pagination', async () => {
    jest
      .mocked(categoryClientRepository.findAllPaginated)
      .mockResolvedValue({ items: [{ id: '1' }] as any, total: 1 });

    const result = await service.listCategories({ page: 1, limit: 20 });

    expect(categoryClientRepository.findAllPaginated).toHaveBeenCalledWith(
      { shopId: undefined, parentId: undefined },
      0,
      20,
    );
    expect(result).toEqual({
      items: [{ id: '1' }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });

  it('should list categories filtered by shop id and parent id', async () => {
    const shopId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const parentId = '11f21967-fce6-4ceb-af61-304913f593a7';
    jest
      .mocked(categoryClientRepository.findAllPaginated)
      .mockResolvedValue({ items: [], total: 45 });

    const result = await service.listCategories({
      page: 3,
      limit: 20,
      shopId,
      parentId,
    });

    expect(categoryClientRepository.findAllPaginated).toHaveBeenCalledWith(
      { shopId, parentId },
      40,
      20,
    );
    expect(result.page).toBe(3);
    expect(result.totalPages).toBe(3);
  });

  it('should return no pages when nothing matches', async () => {
    jest
      .mocked(categoryClientRepository.findAllPaginated)
      .mockResolvedValue({ items: [], total: 0 });

    const result = await service.listCategories({ page: 1, limit: 20 });

    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  });
});
