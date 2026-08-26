import { BadRequestException, Injectable } from '@nestjs/common';
import { ChangeProductImageSortDto } from '../../dto/images/change-product-image-sort.dto';
import { ProductImage } from '../../entities/product-image.entity';
import { ProductRepository } from '../../repositories/product/product.repository';

@Injectable()
export class ImagesService {
  constructor(private readonly productRepository: ProductRepository) {}

  async changeImageSort(
    id: string,
    dto: ChangeProductImageSortDto,
  ): Promise<ProductImage> {
    const image = await this.productRepository.findImageById(id);
    const sibling = await this.productRepository.findAdjacentImageSibling(
      image,
      dto.direction,
    );

    if (!sibling) {
      throw new BadRequestException(
        dto.direction === 'up'
          ? 'Зображення вже на початку'
          : 'Зображення вже в кінці',
      );
    }

    return this.productRepository.swapImageSort(image, sibling);
  }

  async removeImage(id: string): Promise<{ message: string }> {
    const image = await this.productRepository.findImageById(id);
    await this.productRepository.removeImage(image);
    return { message: 'Зображення успішно видалено' };
  }
}
