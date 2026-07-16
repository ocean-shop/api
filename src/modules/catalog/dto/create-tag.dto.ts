import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTagDto {
  @IsUUID()
  @IsNotEmpty()
  readonly shopId: string;

  @IsString()
  @IsNotEmpty()
  readonly name: string;
}
