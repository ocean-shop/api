import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { CreateTagDto } from '../../dto/create-tag.dto';
import { UpdateTagDto } from '../../dto/update-tag.dto';
import { TagsService } from '../../services/tags/tags.service';
import { TagsController } from './tags.controller';

describe('TagsController', () => {
  let controller: TagsController;
  let tagsService: TagsService;

  beforeEach(async () => {
    const tagsServiceMock = {
      listTags: jest.fn(),
      getTagById: jest.fn(),
      createTag: jest.fn(),
      updateTag: jest.fn(),
      removeTag: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [{ provide: TagsService, useValue: tagsServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TagsController>(TagsController);
    tagsService = module.get<TagsService>(TagsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list tags', async () => {
    const query = { page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest.mocked(tagsService.listTags).mockResolvedValue(expected);

    const result = await controller.listTags(query);

    expect(tagsService.listTags).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('should get tag by id', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { id, shopId: 'shop-id', name: 'Summer Sale' };
    jest.mocked(tagsService.getTagById).mockResolvedValue(expected as any);

    const result = await controller.getTagById(id);

    expect(tagsService.getTagById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('should create tag', async () => {
    const dto: CreateTagDto = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      name: 'Summer Sale',
    };
    const expected = { id: '1', ...dto };
    jest.mocked(tagsService.createTag).mockResolvedValue(expected as any);

    const result = await controller.createTag(dto);

    expect(tagsService.createTag).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should update tag', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: UpdateTagDto = { name: 'Featured' };
    const expected = { id, shopId: 'shop-id', ...dto };
    jest.mocked(tagsService.updateTag).mockResolvedValue(expected as any);

    const result = await controller.updateTag(id, dto);

    expect(tagsService.updateTag).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('should remove tag', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { message: 'Tag removed successfully' };
    jest.mocked(tagsService.removeTag).mockResolvedValue(expected);

    const result = await controller.removeTag(id);

    expect(tagsService.removeTag).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
