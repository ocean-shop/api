import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariation } from './product-variation.entity';

@Entity('variation_images')
export class VariationImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'variation_id' })
  variationId: string;

  @Column({ type: 'varchar', length: 1000 })
  url: string;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ProductVariation, (variation) => variation.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variation_id' })
  variation: ProductVariation;
}
