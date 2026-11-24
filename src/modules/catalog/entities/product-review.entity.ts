import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ProductReviewStatus } from './enums/product-review.enum';
import { Product } from './product.entity';
import { Shop } from './shop.entity';

/**
 * Customer review of a product. The product always belongs to `shopId`: the
 * composite foreign key in the migration enforces it.
 */
@Entity('product_reviews')
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'shop_id' })
  shopId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  advantages: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  drawbacks: string | null;

  @Column({ type: 'varchar', length: 5000 })
  comment: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({
    type: 'enum',
    enum: ProductReviewStatus,
    enumName: 'product_review_status',
    default: ProductReviewStatus.PENDING,
  })
  status: ProductReviewStatus;

  @Column({ type: 'boolean', name: 'approved_purchase', default: false })
  approvedPurchase: boolean;

  /** How many shoppers marked the review as useful. */
  @Column({ type: 'int', name: 'is_useful', default: 0 })
  isUseful: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}
