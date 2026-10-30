import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { ROLES_METADATA_KEY } from '../../constants/role.constants';
import { RoleName } from '../../models/role.models';

export const Roles = (...roles: RoleName[]): CustomDecorator<string> =>
  SetMetadata(ROLES_METADATA_KEY, roles);
