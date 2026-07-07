import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsOptional()
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
