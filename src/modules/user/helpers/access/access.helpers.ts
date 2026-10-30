import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import { ROLES } from '../../constants/role.constants';
import { User } from '../../entities/user.entity';
import { JwtPayload } from '../../models/auth-request.models';

/**
 * A client may only touch their own data; admins act on behalf of any user, and
 * a call without a requester comes from trusted server code.
 */
export function assertCanAccessUser(
  userId: string | null,
  requester?: JwtPayload,
): void {
  if (requester?.role === ROLES.USER && requester.sub !== userId) {
    throw new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED);
  }
}

/** Only an active user with one of the given roles may sign in through a flow. */
export function assertCanSignIn(
  user: User,
  allowedRoles: readonly string[],
): void {
  if (!user.role?.name || !allowedRoles.includes(user.role.name)) {
    throw new BadRequestException(AUTH_MESSAGES.ACCESS_DENIED);
  }
  if (!user.isActive) {
    throw new ForbiddenException(AUTH_MESSAGES.USER_BLOCKED);
  }
}
