import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesClientService } from '../../../services/categories/client/categories-client.service';
import { CategoriesClientController } from './categories-client.controller';

describe('CategoriesClientController', () => {
  let controller: CategoriesClientController;
  let categoriesClientService: CategoriesClientService;

  beforeEach(async () => {
    const categoriesClientServiceMock = {
      listCategories: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesClientController],
      providers: [
        {
          provide: CategoriesClientService,
          useValue: categoriesClientServiceMock,
        },
      ],
    }).compile();

    controller = module.get<CategoriesClientController>(
      CategoriesClientController,
    );
    categoriesClientService = module.get<CategoriesClientService>(
      CategoriesClientService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list categories', async () => {
    const query = { page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest
      .mocked(categoriesClientService.listCategories)
      .mockResolvedValue(expected);

    const result = await controller.listCategories(query);

    expect(categoriesClientService.listCategories).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('should list categories filtered by shop id and parent id', async () => {
    const query = {
      page: 1,
      limit: 20,
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      parentId: '11f21967-fce6-4ceb-af61-304913f593a7',
    };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest
      .mocked(categoriesClientService.listCategories)
      .mockResolvedValue(expected);

    const result = await controller.listCategories(query);

    expect(categoriesClientService.listCategories).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });
});
