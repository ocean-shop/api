import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { OrderShippingMethod } from '../../orders/entities/enums/order.enum';

@Entity('users_shipping')
export class UserShipping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: OrderShippingMethod,
    enumName: 'order_shipping_method',
    name: 'method',
  })
  method: OrderShippingMethod;

  @Column({ type: 'varchar', length: 255, name: 'address' })
  address: string;

  @Column({ type: 'boolean', name: 'is_main', default: false })
  isMain: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
