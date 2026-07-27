import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { CreateVariationTypeDto } from '../../dto/create-variation-type.dto';
import { UpdateVariationTypeDto } from '../../dto/update-variation-type.dto';
import { VariationTypeName } from '../../entities/enums/variation-type.enum';
import { VariationTypesService } from '../../services/variation-types/variation-types.service';
import { VariationTypesController } from './variation-types.controller';

describe('VariationTypesController', () => {
  let controller: VariationTypesController;
  let variationTypesService: VariationTypesService;

  beforeEach(async () => {
    const variationTypesServiceMock = {
      listVariationTypes: jest.fn(),
      createVariationType: jest.fn(),
      updateVariationType: jest.fn(),
      removeVariationType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariationTypesController],
      providers: [
        { provide: VariationTypesService, useValue: variationTypesServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VariationTypesController>(VariationTypesController);
    variationTypesService = module.get<VariationTypesService>(
      VariationTypesService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list variation types', async () => {
    const query = { page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest
      .mocked(variationTypesService.listVariationTypes)
      .mockResolvedValue(expected);

    const result = await controller.listVariationTypes(query);

    expect(variationTypesService.listVariationTypes).toHaveBeenCalledWith(
      query,
    );
    expect(result).toEqual(expected);
  });

  it('should create variation type', async () => {
    const dto: CreateVariationTypeDto = {
      name: VariationTypeName.COLOR,
      value: 'Red',
    };
    const expected = { id: '1', ...dto };
    jest
      .mocked(variationTypesService.createVariationType)
      .mockResolvedValue(expected as any);

    const result = await controller.createVariationType(dto);

    expect(variationTypesService.createVariationType).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should update variation type', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: UpdateVariationTypeDto = {
      name: VariationTypeName.CUSTOM,
      value: 'Cotton',
    };
    const expected = { id, ...dto };
    jest
      .mocked(variationTypesService.updateVariationType)
      .mockResolvedValue(expected as any);

    const result = await controller.updateVariationType(id, dto);

    expect(variationTypesService.updateVariationType).toHaveBeenCalledWith(
      id,
      dto,
    );
    expect(result).toEqual(expected);
  });

  it('should remove variation type', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { message: 'Variation type removed successfully' };
    jest
      .mocked(variationTypesService.removeVariationType)
      .mockResolvedValue(expected);

    const result = await controller.removeVariationType(id);

    expect(variationTypesService.removeVariationType).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
