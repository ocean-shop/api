import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { AssignProductAttributeDto } from '../../dto/assign-product-attribute.dto';
import { AssignProductCategoryDto } from '../../dto/assign-product-category.dto';
import { AssignProductImagesDto } from '../../dto/assign-product-images.dto';
import { AssignProductTagDto } from '../../dto/assign-product-tag.dto';
import { CreateProductDto } from '../../dto/create-product.dto';
import { UpdateProductDto } from '../../dto/update-product.dto';
import { ProductStatus } from '../../entities/enums/product.enum';
import { ProductsService } from '../../services/products/products.service';
import { ProductsController } from './products.controller';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: ProductsService;

  beforeEach(async () => {
    const productsServiceMock = {
      listProducts: jest.fn(),
      listProductsByCategoryId: jest.fn(),
      listProductsByTagId: jest.fn(),
      listProductsByAttributeTypeId: jest.fn(),
      getProductById: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      removeProduct: jest.fn(),
      assignCategory: jest.fn(),
      assignTag: jest.fn(),
      assignAttribute: jest.fn(),
      assignImages: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list products', async () => {
    const query = { page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest.mocked(productsService.listProducts).mockResolvedValue(expected);

    const result = await controller.listProducts(query);

    expect(productsService.listProducts).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('should list products by category id', async () => {
    const categoryId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const query = { page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest
      .mocked(productsService.listProductsByCategoryId)
      .mockResolvedValue(expected);

    const result = await controller.listProductsByCategoryId(categoryId, query);

    expect(productsService.listProductsByCategoryId).toHaveBeenCalledWith(
      categoryId,
      query,
    );
    expect(result).toEqual(expected);
  });

  it('should list products by tag id', async () => {
    const tagId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const query = { page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest
      .mocked(productsService.listProductsByTagId)
      .mockResolvedValue(expected);

    const result = await controller.listProductsByTagId(tagId, query);

    expect(productsService.listProductsByTagId).toHaveBeenCalledWith(
      tagId,
      query,
    );
    expect(result).toEqual(expected);
  });

  it('should list products by attribute type id', async () => {
    const attributeTypeId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const query = { page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest
      .mocked(productsService.listProductsByAttributeTypeId)
      .mockResolvedValue(expected);

    const result = await controller.listProductsByAttributeTypeId(
      attributeTypeId,
      query,
    );

    expect(productsService.listProductsByAttributeTypeId).toHaveBeenCalledWith(
      attributeTypeId,
      query,
    );
    expect(result).toEqual(expected);
  });

  it('should get product by id', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { id, name: 'Ocean Tee' };
    jest
      .mocked(productsService.getProductById)
      .mockResolvedValue(expected as any);

    const result = await controller.getProductById(id);

    expect(productsService.getProductById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('should create product', async () => {
    const dto: CreateProductDto = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      name: 'Ocean Tee',
      price: 19.99,
    };
    const expected = { id: '1', ...dto };
    jest
      .mocked(productsService.createProduct)
      .mockResolvedValue(expected as any);

    const result = await controller.createProduct(dto);

    expect(productsService.createProduct).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should update product', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: UpdateProductDto = {
      name: 'Updated Tee',
      status: ProductStatus.ACTIVE,
    };
    const expected = { id, ...dto };
    jest
      .mocked(productsService.updateProduct)
      .mockResolvedValue(expected as any);

    const result = await controller.updateProduct(id, dto);

    expect(productsService.updateProduct).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('should remove product', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { message: 'Product removed successfully' };
    jest.mocked(productsService.removeProduct).mockResolvedValue(expected);

    const result = await controller.removeProduct(id);

    expect(productsService.removeProduct).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('should assign category', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: AssignProductCategoryDto = {
      categoryId: '11f21967-fce6-4ceb-af61-304913f593a7',
      assign: true,
    };
    const expected = { id, categories: [{ id: dto.categoryId }] };
    jest
      .mocked(productsService.assignCategory)
      .mockResolvedValue(expected as any);

    const result = await controller.assignCategory(id, dto);

    expect(productsService.assignCategory).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('should assign tag', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: AssignProductTagDto = {
      tagId: '22f21967-fce6-4ceb-af61-304913f593a7',
      assign: true,
    };
    const expected = { id, tags: [{ id: dto.tagId }] };
    jest.mocked(productsService.assignTag).mockResolvedValue(expected as any);

    const result = await controller.assignTag(id, dto);

    expect(productsService.assignTag).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('should assign attribute', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: AssignProductAttributeDto = {
      attributeTypeId: '33f21967-fce6-4ceb-af61-304913f593a7',
      assign: true,
    };
    const expected = { id, attributes: [{ id: dto.attributeTypeId }] };
    jest
      .mocked(productsService.assignAttribute)
      .mockResolvedValue(expected as any);

    const result = await controller.assignAttribute(id, dto);

    expect(productsService.assignAttribute).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('should assign images', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: AssignProductImagesDto = {
      images: [{ url: 'https://cdn.example.com/a.jpg', sort: 0 }],
    };
    const expected = { id, images: dto.images };
    jest
      .mocked(productsService.assignImages)
      .mockResolvedValue(expected as any);

    const result = await controller.assignImages(id, dto);

    expect(productsService.assignImages).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });
});
