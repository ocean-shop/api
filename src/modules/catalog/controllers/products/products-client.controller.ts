import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../../services/products/products.service';

@Controller('catalog/products-client')
@ApiTags('Catalog Products')
export class ProductsClientController {
  constructor(private readonly productsService: ProductsService) {}
}
