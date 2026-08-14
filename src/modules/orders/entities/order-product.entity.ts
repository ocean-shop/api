import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Product } from '../../catalog/entities/product.entity';
import { Order } from './order.entity';

@Entity('orders_products')
export class OrderProduct {
  @PrimaryColumn({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @PrimaryColumn({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: string;

  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
