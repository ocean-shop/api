import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Shop } from '../../catalog/entities/shop.entity';
import type { NotificationPayload } from '../models/notification.models';
import { NotificationType } from './enums/notification.enum';
import { NotificationRead } from './notification-read.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'shop_id' })
  shopId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    enumName: 'notification_type',
  })
  type: NotificationType;

  @Column({ type: 'jsonb' })
  payload: NotificationPayload;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @OneToMany(() => NotificationRead, (read) => read.notification)
  reads: NotificationRead[];
}
