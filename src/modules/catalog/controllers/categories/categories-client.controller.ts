import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from '../../services/categories/categories.service';

@Controller('catalog/categories-client')
@ApiTags('Catalog Categories Client')
export class CategoriesClientController {
  constructor(private readonly categoriesService: CategoriesService) {}
}
