import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly name?: string;
}
