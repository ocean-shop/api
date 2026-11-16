import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Product } from './product.entity';

/**
 * One-way link from a product to a product shown next to it on the storefront
 * ("related products"). Both products always belong to `shopId`: the composite
 * foreign keys in the migration enforce it.
 */
@Entity('products_related')
export class ProductRelated {
  @PrimaryColumn({ type: 'uuid', name: 'product_id' })
  productId: string;

  @PrimaryColumn({ type: 'uuid', name: 'related_product_id' })
  relatedProductId: string;

  @Column({ type: 'uuid', name: 'shop_id' })
  shopId: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'related_product_id' })
  relatedProduct: Product;
}
