import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Attribute } from './attribute.entity';
import { ProductVariation } from './product-variation.entity';

@Entity('variations_attributes')
export class VariationAttribute {
  @PrimaryColumn('uuid', { name: 'variation_id' })
  variationId: string;

  @PrimaryColumn('uuid', { name: 'attribute_type_id' })
  attributeTypeId: string;

  @ManyToOne(() => ProductVariation, (variation) => variation.attributes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variation_id' })
  variation: ProductVariation;

  @ManyToOne(() => Attribute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attribute_type_id' })
  attributeType: Attribute;
}
