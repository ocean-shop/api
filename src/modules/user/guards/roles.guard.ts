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

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_METADATA_KEY,
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
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
