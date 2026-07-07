import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsUrl()
  readonly url?: string;
}
