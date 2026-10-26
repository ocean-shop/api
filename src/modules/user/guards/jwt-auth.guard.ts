import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_MESSAGES } from '../constants/auth-messages.constants';
import { BEARER_PREFIX, TOKEN_TYPES } from '../constants/auth.constants';
import {
  AuthenticatedRequest,
  JwtPayload,
} from '../models/auth-request.models';
import { UserRepository } from '../repositories/user/user.repository';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(AUTH_MESSAGES.ACCESS_TOKEN_REQUIRED);
    }

    const payload = await this.verifyAccessToken(token);
    request.user = await this.withCurrentRole(payload);
    return true;
  }

  private async verifyAccessToken(token: string): Promise<JwtPayload> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException(AUTH_MESSAGES.ACCESS_TOKEN_INVALID);
    }

    if (payload.type !== TOKEN_TYPES.ACCESS) {
      throw new UnauthorizedException(AUTH_MESSAGES.ACCESS_TOKEN_INVALID);
    }

    return payload;
  }

  /**
   * The token's claims are a snapshot; a block or role change made after it
   * was issued must apply right away, so both are read from the database.
   */
  private async withCurrentRole(payload: JwtPayload): Promise<JwtPayload> {
    const state = await this.userRepository.findAuthState(payload.sub);

    if (!state?.isActive) {
      throw new UnauthorizedException(AUTH_MESSAGES.ACCESS_TOKEN_INVALID);
    }

    return { ...payload, role: state.role };
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const authHeader = request.headers.authorization;
    return authHeader?.startsWith(BEARER_PREFIX)
      ? authHeader.slice(BEARER_PREFIX.length)
      : undefined;
  }
}
