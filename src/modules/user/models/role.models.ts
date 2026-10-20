import { ADMIN_ROLES, ROLES } from '../constants/role.constants';

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
export type AdminRoleName = (typeof ADMIN_ROLES)[number];
