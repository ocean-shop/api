import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { ChangeCategorySortDto } from '../../dto/change-category-sort.dto';
import { CreateCategoryDto } from '../../dto/create-category.dto';
import { UpdateCategoryDto } from '../../dto/update-category.dto';
import { CategoriesService } from '../../services/categories/categories.service';
import { CategoriesController } from './categories.controller';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: CategoriesService;

  beforeEach(async () => {
    const categoriesServiceMock = {
      listCategories: jest.fn(),
      getCategoryById: jest.fn(),
      createCategory: jest.fn(),
      changeCategorySort: jest.fn(),
      updateCategory: jest.fn(),
      removeCategory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: categoriesServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
    categoriesService = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list categories', async () => {
    const query = { page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest.mocked(categoriesService.listCategories).mockResolvedValue(expected);

    const result = await controller.listCategories(query);

    expect(categoriesService.listCategories).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('should get category by id', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { id, name: 'Accessories' };
    jest
      .mocked(categoriesService.getCategoryById)
      .mockResolvedValue(expected as any);

    const result = await controller.getCategoryById(id);

    expect(categoriesService.getCategoryById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('should create category', async () => {
    const dto: CreateCategoryDto = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      name: 'Accessories',
      slug: 'accessories',
    };
    const expected = { id: '1', ...dto };
    jest
      .mocked(categoriesService.createCategory)
      .mockResolvedValue(expected as any);

    const result = await controller.createCategory(dto);

    expect(categoriesService.createCategory).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should change category sort', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: ChangeCategorySortDto = { direction: 'up' };
    const expected = { id, sort: 0, name: 'Accessories' };
    jest
      .mocked(categoriesService.changeCategorySort)
      .mockResolvedValue(expected as any);

    const result = await controller.changeCategorySort(id, dto);

    expect(categoriesService.changeCategorySort).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('should update category', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: UpdateCategoryDto = { name: 'New Name' };
    const expected = { id, shopId: 'shop-id', slug: 'slug', ...dto };
    jest
      .mocked(categoriesService.updateCategory)
      .mockResolvedValue(expected as any);

    const result = await controller.updateCategory(id, dto);

    expect(categoriesService.updateCategory).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('should remove category', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { message: 'Category removed successfully' };
    jest.mocked(categoriesService.removeCategory).mockResolvedValue(expected);

    const result = await controller.removeCategory(id);

    expect(categoriesService.removeCategory).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
