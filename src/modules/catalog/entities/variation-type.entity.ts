import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VariationTypeName } from './enums/variation-type.enum';

@Entity('variation_types')
export class VariationType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: VariationTypeName,
    enumName: 'variation_type_name',
  })
  name: VariationTypeName;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
