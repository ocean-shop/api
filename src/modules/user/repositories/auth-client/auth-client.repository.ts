import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';

@Injectable()
export class AuthClientRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findByEmailOrPhone(
    email?: string,
    phone?: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: email ? { email } : { mobileNumber: phone },
      relations: { role: true },
    });
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async createUser(payload: Partial<User>): Promise<User> {
    const user = this.userRepository.create(payload);
    return this.userRepository.save(user);
  }
}
