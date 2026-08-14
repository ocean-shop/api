import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChangeProductImageSortDto } from '../../dto/change-product-image-sort.dto';
import { ProductRepository } from '../../repositories/product/product.repository';
import { ImagesService } from './images.service';

describe('ImagesService', () => {
  let service: ImagesService;
  let productRepository: ProductRepository;

  beforeEach(async () => {
    const productRepositoryMock = {
      findImageById: jest.fn(),
      findAdjacentImageSibling: jest.fn(),
      swapImageSort: jest.fn(),
      removeImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: ProductRepository, useValue: productRepositoryMock },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
    productRepository = module.get<ProductRepository>(ProductRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should change image sort up', async () => {
    const image = {
      id: 'image-id',
      productId: 'product-id',
      sort: 2,
    } as any;
    const sibling = {
      id: 'sibling-id',
      productId: 'product-id',
      sort: 1,
    } as any;
    const swapped = { ...image, sort: 1 };
    const dto: ChangeProductImageSortDto = { direction: 'up' };

    jest.mocked(productRepository.findImageById).mockResolvedValue(image);
    jest
      .mocked(productRepository.findAdjacentImageSibling)
      .mockResolvedValue(sibling);
    jest.mocked(productRepository.swapImageSort).mockResolvedValue(swapped);

    const result = await service.changeImageSort('image-id', dto);

    expect(productRepository.findImageById).toHaveBeenCalledWith('image-id');
    expect(productRepository.findAdjacentImageSibling).toHaveBeenCalledWith(
      image,
      'up',
    );
    expect(productRepository.swapImageSort).toHaveBeenCalledWith(
      image,
      sibling,
    );
    expect(result).toEqual(swapped);
  });

  it('should throw when image is already at top', async () => {
    const image = {
      id: 'image-id',
      productId: 'product-id',
      sort: 0,
    } as any;

    jest.mocked(productRepository.findImageById).mockResolvedValue(image);
    jest
      .mocked(productRepository.findAdjacentImageSibling)
      .mockResolvedValue(null);

    await expect(
      service.changeImageSort('image-id', { direction: 'up' }),
    ).rejects.toThrow(BadRequestException);
    expect(productRepository.swapImageSort).not.toHaveBeenCalled();
  });

  it('should throw when image is already at bottom', async () => {
    const image = {
      id: 'image-id',
      productId: 'product-id',
      sort: 3,
    } as any;

    jest.mocked(productRepository.findImageById).mockResolvedValue(image);
    jest
      .mocked(productRepository.findAdjacentImageSibling)
      .mockResolvedValue(null);

    await expect(
      service.changeImageSort('image-id', { direction: 'down' }),
    ).rejects.toThrow(BadRequestException);
    expect(productRepository.swapImageSort).not.toHaveBeenCalled();
  });

  it('should remove image', async () => {
    const image = { id: 'image-id', productId: 'product-id', sort: 1 } as any;

    jest.mocked(productRepository.findImageById).mockResolvedValue(image);
    jest.mocked(productRepository.removeImage).mockResolvedValue(image);

    const result = await service.removeImage('image-id');

    expect(productRepository.findImageById).toHaveBeenCalledWith('image-id');
    expect(productRepository.removeImage).toHaveBeenCalledWith(image);
    expect(result).toEqual({ message: 'Image removed successfully' });
  });

  it('should propagate not found when removing image', async () => {
    jest
      .mocked(productRepository.findImageById)
      .mockRejectedValue(new NotFoundException('Product image not found'));

    await expect(service.removeImage('missing-image-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(productRepository.removeImage).not.toHaveBeenCalled();
  });
});
