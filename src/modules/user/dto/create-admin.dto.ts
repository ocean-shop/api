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
import { ADMIN_ROLES } from '../constants/role.constants';
import type { AdminRoleName } from '../models/role.models';

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
  @IsIn(ADMIN_ROLES)
  readonly role?: AdminRoleName;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly shopIds?: string[];
}
