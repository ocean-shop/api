import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Shop } from '../../catalog/entities/shop.entity';
import { User } from '../../user/entities/user.entity';
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderShippingMethod,
  OrderStatus,
} from './enums/order.enum';
import { OrderProduct } from './order-product.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'shop_id' })
  shopId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, name: 'shipping_number' })
  shippingNumber: string;

  @Column({ type: 'varchar', length: 100, name: 'order_number' })
  orderNumber: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'subtotal_amount',
    default: 0,
  })
  subtotalAmount: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'discount_amount',
    default: 0,
  })
  discountAmount: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: string;

  @Column({
    type: 'enum',
    enum: OrderPaymentMethod,
    enumName: 'order_payment_method',
    name: 'payment_method',
  })
  paymentMethod: OrderPaymentMethod;

  @Column({
    type: 'enum',
    enum: OrderPaymentStatus,
    enumName: 'order_payment_status',
    name: 'payment_status',
    default: OrderPaymentStatus.UNPAID,
  })
  paymentStatus: OrderPaymentStatus;

  @Column({
    type: 'enum',
    enum: OrderShippingMethod,
    enumName: 'order_shipping_method',
    name: 'shipping_method',
  })
  shippingMethod: OrderShippingMethod;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status',
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order, {
    cascade: true,
  })
  items: OrderProduct[];
}
