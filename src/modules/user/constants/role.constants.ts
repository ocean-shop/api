export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER: 'super',
} as const;

export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER] as const;
export const ALL_ROLES = [ROLES.USER, ROLES.ADMIN, ROLES.SUPER] as const;

/** Metadata key the `Roles` decorator writes and `RolesGuard` reads. */
export const ROLES_METADATA_KEY = 'roles';
