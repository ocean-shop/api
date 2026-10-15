import { Injectable, NotFoundException } from '@nestjs/common';
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
      order: { isMain: 'DESC', createdAt: 'DESC' },
    });
  }

  async findMainByUserId(userId: string): Promise<UserShipping | null> {
    return this.repository.findOne({ where: { userId, isMain: true } });
  }

  // Keeps a single main shipping per user: the first shipping becomes main
  // automatically, and a new main one unsets the previous main.
  async create(shipping: Partial<UserShipping>): Promise<UserShipping> {
    return this.repository.manager.transaction(async (manager) => {
      const { userId } = shipping;
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        userId,
      ]);

      const hasShippings = await manager.exists(UserShipping, {
        where: { userId },
      });
      const isMain = !hasShippings || Boolean(shipping.isMain);

      if (isMain) {
        await manager.update(
          UserShipping,
          { userId, isMain: true },
          { isMain: false },
        );
      }

      return manager.save(
        UserShipping,
        manager.create(UserShipping, { ...shipping, isMain }),
      );
    });
  }

  // Removing the main shipping promotes the most recent remaining one to main.
  async remove(userId: string, shippingId: string): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        userId,
      ]);

      const shipping = await manager.findOne(UserShipping, {
        where: { id: shippingId, userId },
      });

      if (!shipping) {
        throw new NotFoundException('Спосіб доставки не знайдено');
      }

      await manager.delete(UserShipping, { id: shippingId });

      if (shipping.isMain) {
        const next = await manager.findOne(UserShipping, {
          where: { userId },
          order: { createdAt: 'DESC' },
        });

        if (next) {
          await manager.update(UserShipping, { id: next.id }, { isMain: true });
        }
      }
    });
  }

  async setMain(userId: string, shippingId: string): Promise<UserShipping> {
    return this.repository.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        userId,
      ]);

      const shipping = await manager.findOne(UserShipping, {
        where: { id: shippingId, userId },
      });

      if (!shipping) {
        throw new NotFoundException('Спосіб доставки не знайдено');
      }

      if (shipping.isMain) {
        return shipping;
      }

      await manager.update(
        UserShipping,
        { userId, isMain: true },
        { isMain: false },
      );
      shipping.isMain = true;

      return manager.save(UserShipping, shipping);
    });
  }
}
