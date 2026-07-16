import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { CreateAttributeDto } from '../../dto/create-attribute.dto';
import { AttributesService } from '../../services/attributes/attributes.service';
import { AttributesController } from './attributes.controller';

describe('AttributesController', () => {
  let controller: AttributesController;
  let attributesService: AttributesService;

  beforeEach(async () => {
    const attributesServiceMock = {
      getAllAttributes: jest.fn(),
      createAttribute: jest.fn(),
      removeAttribute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributesController],
      providers: [
        { provide: AttributesService, useValue: attributesServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AttributesController>(AttributesController);
    attributesService = module.get<AttributesService>(AttributesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all attributes', async () => {
    const expected = [
      { id: '1', shopId: 'shop-id', name: 'Color', value: 'Red' },
      { id: '2', shopId: 'shop-id', name: 'Size', value: 'M' },
    ] as any;
    jest.mocked(attributesService.getAllAttributes).mockResolvedValue(expected);

    const result = await controller.getAllAttributes();

    expect(attributesService.getAllAttributes).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expected);
  });

  it('should create an attribute', async () => {
    const dto: CreateAttributeDto = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      name: 'Color',
      value: 'Red',
    };
    const expected = { id: '1', ...dto };
    jest
      .mocked(attributesService.createAttribute)
      .mockResolvedValue(expected as any);

    const result = await controller.createAttribute(dto);

    expect(attributesService.createAttribute).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should remove an attribute', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { message: 'Attribute removed successfully' };
    jest.mocked(attributesService.removeAttribute).mockResolvedValue(expected);

    const result = await controller.removeAttribute(id);

    expect(attributesService.removeAttribute).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
