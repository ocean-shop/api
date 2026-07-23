import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAttributeDto {
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly value: string;
}
