import { BadRequestException, Injectable } from '@nestjs/common';
import { IMAGE_MESSAGES } from '../../constants/image-messages.constants';
import { ChangeProductImageSortDto } from '../../dto/images/change-product-image-sort.dto';
import { ProductImage } from '../../entities/product-image.entity';
import { MessageResponse } from '../../../../core/response/models/response.models';
import { ProductRepository } from '../../repositories/product/admin/product.repository';

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
          ? IMAGE_MESSAGES.ALREADY_FIRST
          : IMAGE_MESSAGES.ALREADY_LAST,
      );
    }

    return this.productRepository.swapImageSort(image, sibling);
  }

  async removeImage(id: string): Promise<MessageResponse> {
    const image = await this.productRepository.findImageById(id);
    await this.productRepository.removeImage(image);
    return { message: IMAGE_MESSAGES.REMOVED };
  }
}
