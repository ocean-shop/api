import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ListAttributesQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly name?: string;
}
