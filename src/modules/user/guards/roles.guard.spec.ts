import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_MESSAGES } from '../constants/auth-messages.constants';
import { ADMIN_ROLES, ROLES_METADATA_KEY } from '../constants/role.constants';
import { JwtPayload } from '../models/auth-request.models';
import { RolesGuard } from './roles.guard';

const handler = (): void => undefined;

const contextFor = (user?: Partial<JwtPayload>): ExecutionContext =>
  ({
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { get: jest.Mock };

  beforeEach(async () => {
    reflector = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: reflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should allow a route without required roles', () => {
    reflector.get.mockReturnValue(undefined);

    expect(guard.canActivate(contextFor())).toBe(true);
    expect(reflector.get).toHaveBeenCalledWith(ROLES_METADATA_KEY, handler);
  });

  it('should allow a user holding one of the required roles', () => {
    reflector.get.mockReturnValue([...ADMIN_ROLES]);

    expect(guard.canActivate(contextFor({ role: 'super' }))).toBe(true);
  });

  it.each([
    ['no user', undefined],
    ['a user without a role', { sub: 'user-1', role: null }],
  ])('should reject %s', (_label, user) => {
    reflector.get.mockReturnValue([...ADMIN_ROLES]);

    expect(() => guard.canActivate(contextFor(user))).toThrow(
      new ForbiddenException(AUTH_MESSAGES.ROLE_INFO_MISSING),
    );
  });

  it('should reject a user without any of the required roles', () => {
    reflector.get.mockReturnValue([...ADMIN_ROLES]);

    expect(() => guard.canActivate(contextFor({ role: 'user' }))).toThrow(
      new ForbiddenException(AUTH_MESSAGES.roleRequired(ADMIN_ROLES)),
    );
  });
});
