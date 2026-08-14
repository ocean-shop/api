import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { ChangeProductImageSortDto } from '../../dto/change-product-image-sort.dto';
import { ImagesService } from '../../services/images/images.service';
import { ImagesController } from './images.controller';

describe('ImagesController', () => {
  let controller: ImagesController;
  let imagesService: ImagesService;

  beforeEach(async () => {
    const imagesServiceMock = {
      changeImageSort: jest.fn(),
      removeImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [{ provide: ImagesService, useValue: imagesServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ImagesController>(ImagesController);
    imagesService = module.get<ImagesService>(ImagesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should change image sort', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: ChangeProductImageSortDto = { direction: 'up' };
    const expected = { id, sort: 1 };
    jest
      .mocked(imagesService.changeImageSort)
      .mockResolvedValue(expected as any);

    const result = await controller.changeImageSort(id, dto);

    expect(imagesService.changeImageSort).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('should remove image', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { message: 'Image removed successfully' };
    jest.mocked(imagesService.removeImage).mockResolvedValue(expected);

    const result = await controller.removeImage(id);

    expect(imagesService.removeImage).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
