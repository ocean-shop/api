import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
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
}
