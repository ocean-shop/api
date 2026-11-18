import { ApiPropertyOptions, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import {
  DEFAULT_COLOR_SCHEME,
  HEX_COLOR_REGEX,
} from '../../constants/shop-settings.constants';
import { SHOP_SETTINGS_MESSAGES } from '../../constants/shop-settings-messages.constants';
import type { ColorSchemePatch } from '../../models/shop-settings.models';

const HEX_COLOR_VALIDATION = {
  message: SHOP_SETTINGS_MESSAGES.INVALID_HEX_COLOR,
} as const;

const colorProperty = (example: string): ApiPropertyOptions => ({
  type: String,
  nullable: true,
  example,
  description: 'Hex color #RRGGBB. `null` resets the token to the default.',
});

/** Every field optional: a missing token stays as it is. */
export class UpdateColorSchemeDto implements ColorSchemePatch {
  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.background))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly background?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.foreground))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly foreground?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.muted))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly muted?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.mutedLight))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly mutedLight?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.accent))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly accent?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.accentDark))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly accentDark?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.accentSoft))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly accentSoft?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.accentHighlight))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly accentHighlight?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.onAccentMuted))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly onAccentMuted?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.surfaceSoft))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly surfaceSoft?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.surface))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly surface?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.surfaceStrong))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly surfaceStrong?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.borderSoft))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly borderSoft?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.footerBorder))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly footerBorder?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.footer))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly footer?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.error))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly error?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.errorDark))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly errorDark?: string | null;

  @ApiPropertyOptional(colorProperty(DEFAULT_COLOR_SCHEME.errorBorder))
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, HEX_COLOR_VALIDATION)
  readonly errorBorder?: string | null;
}
