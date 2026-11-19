import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../../../core/response/models/response.models';
import { NOTIFICATION_MESSAGES } from '../../constants/notification-messages.constants';
import { Notification } from '../../entities/notification.entity';
import { NotificationRead } from '../../entities/notification-read.entity';
import { NotificationFilters } from '../../models/notification.models';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
    @InjectRepository(NotificationRead)
    private readonly readRepository: Repository<NotificationRead>,
  ) {}

  /**
   * Joins only the current admin's read row, so each notification yields at
   * most one joined row and `skip/take` stay accurate.
   */
  async findAllPaginated(
    filters: NotificationFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedResult<Notification>> {
    const query = this.repository
      .createQueryBuilder('notification')
      .leftJoinAndSelect(
        'notification.reads',
        'read',
        'read.userId = :userId',
        { userId: filters.userId },
      )
      .where('notification.shopId = :shopId', { shopId: filters.shopId })
      .orderBy('notification.createdAt', 'DESC')
      .addOrderBy('notification.id', 'DESC')
      .skip(skip)
      .take(take);

    if (filters.unreadOnly) {
      query.andWhere('read.notificationId IS NULL');
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  async countUnread(shopId: string, userId: string): Promise<number> {
    return this.repository
      .createQueryBuilder('notification')
      .leftJoin('notification.reads', 'read', 'read.userId = :userId', {
        userId,
      })
      .where('notification.shopId = :shopId', { shopId })
      .andWhere('read.notificationId IS NULL')
      .getCount();
  }

  async findById(id: string): Promise<Notification> {
    const notification = await this.repository.findOne({ where: { id } });

    if (!notification) {
      throw new NotFoundException(NOTIFICATION_MESSAGES.NOT_FOUND);
    }

    return notification;
  }

  create(payload: Partial<Notification>): Notification {
    return this.repository.create(payload);
  }

  async save(notification: Notification): Promise<Notification> {
    return this.repository.save(notification);
  }

  /** Idempotent: reading an already-read notification keeps the first read time. */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.readRepository
      .createQueryBuilder()
      .insert()
      .into(NotificationRead)
      .values({ notificationId, userId })
      .orIgnore()
      .execute();
  }

  /** One set-based statement instead of loading every unread row. */
  async markAllAsRead(shopId: string, userId: string): Promise<void> {
    await this.repository.query(
      `INSERT INTO notification_reads (notification_id, user_id)
       SELECT id, $2 FROM notifications WHERE shop_id = $1
       ON CONFLICT DO NOTHING`,
      [shopId, userId],
    );
  }
}
