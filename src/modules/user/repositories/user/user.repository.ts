import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findByEmailOrPhone(email?: string, phone?: string): Promise<User> {
    const user = await this.repository.findOne({
      where: email ? { email } : { mobileNumber: phone },
      relations: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.repository.findOne({
      where: { id },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }
}
