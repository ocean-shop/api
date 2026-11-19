import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Shop } from '../../catalog/entities/shop.entity';
import type { ColorSchemeOverrides } from '../models/shop-settings.models';

@Entity('shop_settings')
export class ShopSettings {
  @PrimaryColumn({ type: 'uuid', name: 'shop_id' })
  shopId: string;

  @OneToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @Column({ type: 'boolean', name: 'use_ukrposhta', default: false })
  useUkrposhta: boolean;

  @Column({ type: 'boolean', name: 'use_phone_login', default: false })
  usePhoneLogin: boolean;

  @Column({ type: 'boolean', name: 'use_automatic_payment', default: false })
  useAutomaticPayment: boolean;

  @Column({ type: 'boolean', name: 'use_one_click_purchase', default: false })
  useOneClickPurchase: boolean;

  @Column({
    type: 'jsonb',
    name: 'color_scheme',
    default: () => "'{}'::jsonb",
  })
  colorScheme: ColorSchemeOverrides;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
