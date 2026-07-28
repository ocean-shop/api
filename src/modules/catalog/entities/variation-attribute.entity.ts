import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariation } from './product-variation.entity';

@Entity('variation_attributes')
export class VariationAttribute {
  @PrimaryColumn('uuid', { name: 'variation_id' })
  variationId: string;

  @PrimaryColumn({ type: 'varchar', length: 255 })
  name: string;

  @PrimaryColumn({ type: 'varchar', length: 255 })
  value: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ProductVariation, (variation) => variation.attributes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variation_id' })
  variation: ProductVariation;
}
