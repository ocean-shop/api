import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { UpdateColorSchemeDto } from './update-color-scheme.dto';

export class UpdateShopSettingsDto {
  @ApiPropertyOptional({ description: 'Offer Ukrposhta delivery at checkout' })
  @IsOptional()
  @IsBoolean()
  readonly useUkrposhta?: boolean;

  @ApiPropertyOptional({ description: 'Allow storefront login by phone OTP' })
  @IsOptional()
  @IsBoolean()
  readonly usePhoneLogin?: boolean;

  @ApiPropertyOptional({ description: 'Accept online (automatic) payments' })
  @IsOptional()
  @IsBoolean()
  readonly useAutomaticPayment?: boolean;

  @ApiPropertyOptional({ description: 'Show the "buy in one click" form' })
  @IsOptional()
  @IsBoolean()
  readonly useOneClickPurchase?: boolean;

  @ApiPropertyOptional({
    type: UpdateColorSchemeDto,
    description:
      'Partial palette: only the sent tokens change, `null` resets a token.',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateColorSchemeDto)
  readonly colorScheme?: UpdateColorSchemeDto;
}
