---
paths:
  - "**/*.spec.ts"
---

# Testing rules

Unit tests only (Jest 30 + ts-jest + `@nestjs/testing`). No e2e tests, no real DB, Redis or HTTP.

## Where and what

- Spec sits next to the file it tests: `tags.service.ts` → `tags.service.spec.ts` in the same folder.
- Test every service, repository, controller, helper, guard, decorator and processor you add or change.
- No tests needed for: `*.module.ts`, `entities/`, `dto/`, `models/`, `constants/`, `*.enum.ts`, `core/`, `main.ts`
  (excluded from coverage). Exception: DTOs with non-trivial validation/transform logic may get a spec (see `list-catalog-products-query.dto.spec.ts`).
- Global coverage threshold: **70%** for branches, functions, lines, statements. `npm run test:cov` must pass.

## Structure

```ts
describe('TagsService', () => {
  let service: TagsService;
  let tagRepository: TagRepository;

  beforeEach(async () => {
    const tagRepositoryMock = { findById: jest.fn(), save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService, { provide: TagRepository, useValue: tagRepositoryMock }],
    }).compile();

    service = module.get<TagsService>(TagsService);
    tagRepository = module.get<TagRepository>(TagRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

- Build a fresh `Test.createTestingModule` in `beforeEach`. Mock **every** dependency with `{ provide: X, useValue: { method: jest.fn() } }`.
- Name tests `it('should <behavior>')`. Group with nested `describe` per method when a file covers several.
- Arrange → act → assert, separated by blank lines.

## Mocking by layer

| Testing | Mock |
| --- | --- |
| Controller | the service; guards via `.overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })` (same for `RolesGuard`) |
| Service | repositories and other services |
| Repository | TypeORM repo via `{ provide: getRepositoryToken(Entity), useValue: typeOrmRepositoryMock }`; query builder as an object of `jest.fn().mockReturnThis()` chain methods plus a terminal (`getManyAndCount`, `getOne`, ...) |
| Helper | nothing: call the pure function directly |
| External HTTP (`fetch`) | assign `global.fetch = jest.fn()` |

- Set return values with `jest.mocked(dep.method).mockResolvedValue(...)` / `.mockReturnValue(...)`.
- Simulate DB constraint errors with a real `QueryFailedError` carrying `code` (e.g. `'23505'`) and `constraint`.
- If a test sets `process.env.X`, delete it in `afterEach`. Call `jest.clearAllMocks()` / `jest.restoreAllMocks()` in `afterEach` when using `spyOn` or global mocks.

## Assertions

- Assert **both** the result and the calls on mocks: `expect(result).toEqual(...)` + `expect(repo.save).toHaveBeenCalledWith(...)`.
- Cover the happy path, each branch/filter, and every thrown exception:
  `await expect(service.getTagById('x')).rejects.toThrow(NotFoundException);`
- Use `expect(...).not.toHaveBeenCalled()` to prove a branch was skipped.
- Test behavior, not private methods. Reach private logic through the public method.

## Allowed shortcuts in specs

ESLint relaxes `no-unsafe-*`, `unbound-method`, `require-await`, `no-unused-vars` for `*.spec.ts`. `as any` is allowed for partial fixtures (`{ id: '1' } as any`) when building the full entity adds nothing.

## Running

```bash
npx jest src/modules/catalog/services/tags   # one folder
npm run test                                  # all
npm run test:cov                              # all + coverage gate (what CI runs)
```
