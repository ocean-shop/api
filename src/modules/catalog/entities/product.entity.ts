import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Attribute } from './attribute.entity';
import { Category } from './category.entity';
import { ProductStatus, ProductType } from './enums/product.enum';
import { ProductImage } from './product-image.entity';
import { Shop } from './shop.entity';
import { Tag } from './tag.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'shop_id' })
  shopId: string;

  @Column({
    type: 'enum',
    enum: ProductType,
    enumName: 'product_type',
    default: ProductType.SIMPLE,
  })
  type: ProductType;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  landing: string | null;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    enumName: 'product_status',
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ type: 'boolean', default: true })
  available: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

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

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'products_categories',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'products_tags',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @ManyToMany(() => Attribute)
  @JoinTable({
    name: 'products_attributes',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'attribute_type_id',
      referencedColumnName: 'id',
    },
  })
  attributes: Attribute[];

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
  })
  images: ProductImage[];
}
