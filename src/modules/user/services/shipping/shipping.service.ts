import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserShipping } from '../../entities/user-shipping.entity';
import { UserRepository } from '../../repositories/user/user.repository';
import { ShippingRepository } from '../../repositories/shipping/shipping.repository';
import { CreateShippingDto } from '../../dto/create-shipping.dto';
import { JwtPayload } from '../../models/auth-request.models';

const CLIENT_ROLE_NAME = 'user';

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
    this.assertCanAccess(userId, requester);
    await this.userRepository.findById(userId);

    return this.shippingRepository.findByUserId(userId);
  }

  async createShipping(
    userId: string,
    dto: CreateShippingDto,
    requester?: JwtPayload,
  ): Promise<UserShipping> {
    this.assertCanAccess(userId, requester);
    await this.userRepository.findById(userId);

    return this.shippingRepository.create({
      userId,
      method: dto.method,
      address: dto.address,
    });
  }

  private assertCanAccess(userId: string, requester?: JwtPayload): void {
    if (requester?.role === CLIENT_ROLE_NAME && requester.sub !== userId) {
      throw new ForbiddenException('Доступ заборонено');
    }
  }
}
