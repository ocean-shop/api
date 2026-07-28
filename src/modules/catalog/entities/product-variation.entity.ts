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
import { Product } from './product.entity';
import { VariationAttribute } from './variation-attribute.entity';
import { VariationImage } from './variation-image.entity';

@Entity('product_variations')
export class ProductVariation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  price: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'old_price',
    nullable: true,
  })
  oldPrice: string | null;

  @Column({ type: 'boolean', default: true })
  available: boolean;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Product, (product) => product.variations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => VariationAttribute, (attribute) => attribute.variation, {
    cascade: true,
  })
  attributes: VariationAttribute[];

  @OneToMany(() => VariationImage, (image) => image.variation, {
    cascade: true,
  })
  images: VariationImage[];
}
