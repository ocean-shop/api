import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Notification } from './notification.entity';

/** One row per admin who has read a notification: read state is personal. */
@Entity('notification_reads')
export class NotificationRead {
  @PrimaryColumn({ type: 'uuid', name: 'notification_id' })
  notificationId: string;

  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'read_at' })
  readAt: Date;

  @ManyToOne(() => Notification, (notification) => notification.reads, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
