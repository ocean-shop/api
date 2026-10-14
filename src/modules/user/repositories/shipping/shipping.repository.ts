import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserShipping } from '../../entities/user-shipping.entity';

@Injectable()
export class ShippingRepository {
  constructor(
    @InjectRepository(UserShipping)
    private readonly repository: Repository<UserShipping>,
  ) {}

  async findByUserId(userId: string): Promise<UserShipping[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(shipping: Partial<UserShipping>): Promise<UserShipping> {
    return this.repository.save(this.repository.create(shipping));
  }
}
