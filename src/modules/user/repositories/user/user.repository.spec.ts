import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from '../../entities/user.entity';

describe('UserRepository', () => {
  let repository: UserRepository;
  let typeOrmRepository: any;

  beforeEach(async () => {
    typeOrmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByEmailOrPhone', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const expectedUser = { id: 'uuid', email } as User;
      typeOrmRepository.findOne.mockResolvedValue(expectedUser);

      const result = await repository.findByEmailOrPhone(email, undefined);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email },
        relations: { role: true },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should find user by phone if email is not provided', async () => {
      const phone = '1234567890';
      const expectedUser = { id: 'uuid', mobileNumber: phone } as User;
      typeOrmRepository.findOne.mockResolvedValue(expectedUser);

      const result = await repository.findByEmailOrPhone(undefined, phone);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { mobileNumber: phone },
        relations: { role: true },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.findByEmailOrPhone('test@example.com', undefined),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const id = 'uuid';
      const expectedUser = { id } as User;
      typeOrmRepository.findOne.mockResolvedValue(expectedUser);

      const result = await repository.findById(id);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: { role: true },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.findById('uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('save', () => {
    it('should save user', async () => {
      const user = { id: 'uuid', email: 'test@example.com' } as User;
      typeOrmRepository.save.mockResolvedValue(user);

      const result = await repository.save(user);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });
});
