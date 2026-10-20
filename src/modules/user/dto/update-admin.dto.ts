import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ADMIN_ROLES } from '../constants/role.constants';
import type { AdminRoleName } from '../models/role.models';

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
  @IsIn(ADMIN_ROLES)
  readonly role?: AdminRoleName;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly shopIds?: string[];
}
