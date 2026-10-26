import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UserSessionService } from '../user-session/user-session.service';

@Injectable()
export class LogoutService {
  constructor(
    private readonly authService: AuthService,
    private readonly userSessionService: UserSessionService,
  ) {}

  /**
   * Revokes the session the token was issued for. An expired or already
   * rotated token still identifies it, so logout always ends that session.
   */
  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const { sub, sid } = this.authService.verifyRefreshToken(refreshToken, {
        ignoreExpiration: true,
      });
      await this.userSessionService.revokeSession(sid, sub);
    } catch {
      // Logout never fails: the cookie is cleared either way.
    }
  }
}
