import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { TagRepository } from '../../repositories/tag/tag.repository';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  let service: TagsService;
  let tagRepository: TagRepository;

  beforeEach(async () => {
    const tagRepositoryMock = {
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      findByShopIdAndName: jest.fn(),
      create: jest.fn(),
      save: jest.fn((tag) => Promise.resolve(tag)),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: TagRepository, useValue: tagRepositoryMock },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    tagRepository = module.get<TagRepository>(TagRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list tags with pagination', async () => {
    jest.mocked(tagRepository.findAllPaginated).mockResolvedValue({
      items: [{ id: '1' }] as any,
      total: 1,
    });

    const result = await service.listTags({ page: 1, limit: 20 });

    expect(tagRepository.findAllPaginated).toHaveBeenCalledWith({}, 0, 20);
    expect(result.totalPages).toBe(1);
  });

  it('should return one tag', async () => {
    const tag = { id: '1', name: 'Summer Sale' } as any;
    jest.mocked(tagRepository.findById).mockResolvedValue(tag);

    const result = await service.getTagById('1');

    expect(tagRepository.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual(tag);
  });

  it('should create tag', async () => {
    const payload = {
      id: '1',
      shopId: 'shop-id',
      name: 'Summer Sale',
    } as any;
    jest.mocked(tagRepository.create).mockReturnValue(payload);
    jest.mocked(tagRepository.save).mockResolvedValue(payload);

    const result = await service.createTag({
      shopId: 'shop-id',
      name: 'Summer Sale',
    });

    expect(tagRepository.create).toHaveBeenCalledWith({
      shopId: 'shop-id',
      name: 'Summer Sale',
    });
    expect(result).toEqual(payload);
  });

  it('should throw when tag name already exists in shop on create', async () => {
    jest.mocked(tagRepository.findByShopIdAndName).mockResolvedValue({
      id: 'existing-id',
      shopId: 'shop-id',
      name: 'Summer Sale',
    } as any);

    await expect(
      service.createTag({
        shopId: 'shop-id',
        name: 'Summer Sale',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw bad request when tag name already exists on create', async () => {
    const payload = {
      id: '1',
      shopId: 'shop-id',
      name: 'Summer Sale',
    } as any;

    jest.mocked(tagRepository.create).mockReturnValue(payload);
    jest.mocked(tagRepository.save).mockRejectedValue(
      new QueryFailedError('INSERT INTO tags', [], {
        code: '23505',
        constraint: 'tags_shop_id_name_key',
      }),
    );

    await expect(
      service.createTag({
        shopId: 'shop-id',
        name: 'Summer Sale',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update a tag', async () => {
    const existing = {
      id: '1',
      shopId: 'shop-id',
      name: 'Summer Sale',
    } as any;
    const saved = { ...existing, name: 'Featured' };

    jest.mocked(tagRepository.findById).mockResolvedValue(existing);
    jest.mocked(tagRepository.findByShopIdAndName).mockResolvedValue(null);
    jest.mocked(tagRepository.save).mockResolvedValue(saved);

    const result = await service.updateTag('1', {
      name: 'Featured',
    });

    expect(tagRepository.save).toHaveBeenCalledWith({
      ...existing,
      name: 'Featured',
    });
    expect(result).toEqual(saved);
  });

  it('should throw when tag name already exists in shop on update', async () => {
    jest.mocked(tagRepository.findById).mockResolvedValue({
      id: '1',
      shopId: 'shop-id',
      name: 'Old Name',
    } as any);
    jest.mocked(tagRepository.findByShopIdAndName).mockResolvedValue({
      id: 'existing-id',
      shopId: 'shop-id',
      name: 'Featured',
    } as any);

    await expect(service.updateTag('1', { name: 'Featured' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw bad request when tag name already exists on update', async () => {
    const existing = {
      id: '1',
      shopId: 'shop-id',
      name: 'Old Name',
    } as any;

    jest.mocked(tagRepository.findById).mockResolvedValue(existing);
    jest.mocked(tagRepository.findByShopIdAndName).mockResolvedValue(null);
    jest.mocked(tagRepository.save).mockRejectedValue(
      new QueryFailedError('UPDATE tags', [], {
        code: '23505',
        constraint: 'tags_shop_id_name_key',
      }),
    );

    await expect(service.updateTag('1', { name: 'Featured' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should remove a tag', async () => {
    const tag = { id: '1', name: 'Summer Sale' } as any;
    jest.mocked(tagRepository.findById).mockResolvedValue(tag);
    jest.mocked(tagRepository.remove).mockResolvedValue(tag);

    const result = await service.removeTag('1');

    expect(tagRepository.findById).toHaveBeenCalledWith('1');
    expect(tagRepository.remove).toHaveBeenCalledWith(tag);
    expect(result).toEqual({ message: 'Tag removed successfully' });
  });
});
