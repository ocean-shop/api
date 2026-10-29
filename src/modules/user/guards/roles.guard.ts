import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_MESSAGES } from '../constants/auth-messages.constants';
import { ROLES_METADATA_KEY } from '../constants/role.constants';
import { AuthenticatedRequest } from '../models/auth-request.models';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * `@Roles` may sit on the handler or on the whole controller; the handler
   * wins. A route behind this guard without any `@Roles` is denied, so a
   * forgotten decorator never opens it to every signed-in user.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      string[] | undefined
    >(ROLES_METADATA_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles?.length) {
      throw new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED);
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException(AUTH_MESSAGES.ROLE_INFO_MISSING);
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(AUTH_MESSAGES.roleRequired(requiredRoles));
    }

    return true;
  }
}
