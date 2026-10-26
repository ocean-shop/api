import { ROLES, ROLES_METADATA_KEY } from '../constants/role.constants';
import { Roles } from './roles.decorator';

describe('Roles decorator', () => {
  it('should store the required roles on the handler', () => {
    class TestController {
      @Roles(ROLES.ADMIN, ROLES.SUPER)
      handle(): void {}
    }

    const metadata: unknown = Reflect.getMetadata(
      ROLES_METADATA_KEY,
      TestController.prototype.handle,
    );

    expect(metadata).toEqual([ROLES.ADMIN, ROLES.SUPER]);
  });
});
