import { Injectable } from '@nestjs/common';
import { assertCanAccessUser } from '../../helpers/access/access.helpers';
import { UserShipping } from '../../entities/user-shipping.entity';
import { UserRepository } from '../../repositories/user/user.repository';
import { ShippingRepository } from '../../repositories/shipping/shipping.repository';
import { CreateShippingDto } from '../../dto/create-shipping.dto';
import { JwtPayload } from '../../models/auth-request.models';

@Injectable()
export class ShippingService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly shippingRepository: ShippingRepository,
  ) {}

  async getShippings(
    userId: string,
    requester?: JwtPayload,
  ): Promise<UserShipping[]> {
    assertCanAccessUser(userId, requester);
    await this.userRepository.findById(userId);

    return this.shippingRepository.findByUserId(userId);
  }

  async createShipping(
    userId: string,
    dto: CreateShippingDto,
    requester?: JwtPayload,
  ): Promise<UserShipping> {
    assertCanAccessUser(userId, requester);
    await this.userRepository.findById(userId);

    return this.shippingRepository.create({
      userId,
      method: dto.method,
      address: dto.address,
      isMain: dto.isMain ?? false,
    });
  }

  async removeShipping(
    userId: string,
    shippingId: string,
    requester?: JwtPayload,
  ): Promise<void> {
    assertCanAccessUser(userId, requester);
    await this.userRepository.findById(userId);

    await this.shippingRepository.remove(userId, shippingId);
  }

  async setMainShipping(
    userId: string,
    shippingId: string,
    requester?: JwtPayload,
  ): Promise<UserShipping> {
    assertCanAccessUser(userId, requester);
    await this.userRepository.findById(userId);

    return this.shippingRepository.setMain(userId, shippingId);
  }
}
