import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import {
  ADMIN_ROLES,
  ROLES,
  ROLES_METADATA_KEY,
} from '../../constants/role.constants';
import { Roles } from '../../decorators/roles/roles.decorator';
import { JwtPayload } from '../../models/auth-request.models';
import { RolesGuard } from './roles.guard';

const handler = (): void => undefined;
class TestController {}

@Roles(...ADMIN_ROLES)
class AdminController {
  list(): void {}

  @Roles(ROLES.SUPER)
  remove(): void {}
}

class UndecoratedController {
  list(): void {}
}

const contextFor = (
  user?: Partial<JwtPayload>,
  target: { handler: () => void; controller: object } = {
    handler,
    controller: TestController,
  },
): ExecutionContext =>
  ({
    getHandler: () => target.handler,
    getClass: () => target.controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(async () => {
    reflector = { getAllAndOverride: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: reflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should read roles from the handler first, then from the controller', () => {
    reflector.getAllAndOverride.mockReturnValue([...ADMIN_ROLES]);

    guard.canActivate(contextFor({ role: ROLES.ADMIN }));

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      ROLES_METADATA_KEY,
      [handler, TestController],
    );
  });

  it.each([
    ['no roles metadata', undefined],
    ['an empty roles list', []],
  ])('should deny a route with %s', (_label, roles) => {
    reflector.getAllAndOverride.mockReturnValue(roles);

    expect(() => guard.canActivate(contextFor({ role: ROLES.SUPER }))).toThrow(
      new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED),
    );
  });

  it('should allow a user holding one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([...ADMIN_ROLES]);

    expect(guard.canActivate(contextFor({ role: ROLES.SUPER }))).toBe(true);
  });

  it.each([
    ['no user', undefined],
    ['a user without a role', { sub: 'user-1', role: null }],
  ])('should reject %s', (_label, user) => {
    reflector.getAllAndOverride.mockReturnValue([...ADMIN_ROLES]);

    expect(() => guard.canActivate(contextFor(user))).toThrow(
      new ForbiddenException(AUTH_MESSAGES.ROLE_INFO_MISSING),
    );
  });

  it('should reject a user without any of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([...ADMIN_ROLES]);

    expect(() => guard.canActivate(contextFor({ role: ROLES.USER }))).toThrow(
      new ForbiddenException(AUTH_MESSAGES.roleRequired(ADMIN_ROLES)),
    );
  });

  describe('with real @Roles metadata', () => {
    beforeEach(() => {
      guard = new RolesGuard(new Reflector());
    });

    it('should apply controller-level roles to an undecorated handler', () => {
      const contextAs = (role: string): ExecutionContext =>
        contextFor(
          { role },
          {
            handler: AdminController.prototype.list,
            controller: AdminController,
          },
        );

      expect(guard.canActivate(contextAs(ROLES.ADMIN))).toBe(true);
      expect(() => guard.canActivate(contextAs(ROLES.USER))).toThrow(
        new ForbiddenException(AUTH_MESSAGES.roleRequired(ADMIN_ROLES)),
      );
    });

    it('should let handler-level roles override the controller ones', () => {
      const context = contextFor(
        { role: ROLES.ADMIN },
        {
          handler: AdminController.prototype.remove,
          controller: AdminController,
        },
      );

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException(AUTH_MESSAGES.roleRequired([ROLES.SUPER])),
      );
    });

    it('should deny a route without any @Roles', () => {
      const context = contextFor(
        { role: ROLES.SUPER },
        {
          handler: UndecoratedController.prototype.list,
          controller: UndecoratedController,
        },
      );

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED),
      );
    });
  });
});
