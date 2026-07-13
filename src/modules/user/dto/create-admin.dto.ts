import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateAdminDto {
  @ValidateIf((o: CreateAdminDto) => !o.mobileNumber)
  @IsEmail()
  readonly email?: string;

  @ValidateIf((o: CreateAdminDto) => !o.email)
  @IsString()
  readonly mobileNumber?: string;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;

  @IsOptional()
  @IsIn(['admin', 'super'])
  readonly role?: 'admin' | 'super';

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly shopIds?: string[];
}
