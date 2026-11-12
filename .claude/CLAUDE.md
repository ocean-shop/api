# CLAUDE.md

## Project overview

Ocean Shop API: the backend for a multi-shop e-commerce platform (catalog, orders, users/auth, statistics, settings).
It serves two audiences: an **admin panel** (shop managers, roles `admin` / `super`) and a **client storefront** (role `user` or anonymous).

Stack: NestJS 11, TypeScript 5, TypeORM 1 + PostgreSQL, BullMQ + Redis (optional email queue and response cache), Jest 30, Swagger.
External services: Resend (email), TurboSMS (OTP by SMS), Cloudinary (product images). Deployed on Railway (`railway.json`).
User-facing messages (in `constants/*-messages.constants.ts`) are in **Ukrainian**.

## Setup and commands

```bash
npm ci                      # install (use ci, the lockfile is the source of truth)
cp .env.example .env        # then fill in DATABASE_URL, JWT_* secrets, etc.
npm run migration:run       # apply DB migrations
npm run seed                # seed base data (roles, etc.)
npm run start:dev           # run locally in watch mode (Swagger UI at /docs and /)
```

| Task | Command |
| --- | --- |
| Build | `npm run build` |
| Run prod build | `npm run start:prod` |
| Unit tests | `npm run test` (single file: `npx jest path/to/file.spec.ts`) |
| Coverage (≥ 70% enforced) | `npm run test:cov` |
| Lint (auto-fix / check) | `npm run lint` / `npm run lint:check` |
| Format (write / check) | `npm run format:write` / `npm run format:check` |
| Everything except build | `npm run check` |
| Migrations | `npm run migration:run` / `npm run migration:revert` |

Redis is optional locally: `EMAIL_QUEUE_ENABLED=false` sends emails inline, and the cache turns off without `REDIS_URL`.

## Workflow: before finishing a task

Run the same steps as GitHub Actions CI (`.github/workflows/ci.yml`), in this order, and make sure all pass:

```bash
npm run build
npm run format:check
npm run lint:check
npm run test:cov
```

If formatting fails, run `npm run format:write`; if lint fails, run `npm run lint` and fix what remains by hand.

## Architecture notes

- Layering: **Controller → Service → Repository**. Only repositories touch TypeORM.
- `src/core/` = infrastructure (db, cache, mail, queue, response helpers, config). No business logic.
- `src/modules/` = feature modules: `catalog`, `orders`, `user`, `settings`, `statistic`.
- Admin and client code paths are split into `admin/` and `client/` subfolders (shared logic in `common/`).
- Schema changes only through migrations in `src/core/db/migrations` (`synchronize: false`).
- Details: `.claude/rules/architecture.md`.

## Conventions that differ from defaults

- `type` aliases, never `interface`. Prefer `as const` objects + union types over new TS `enum`s.
- Every testable file lives in its own folder with its spec: `services/tags/tags.service.ts` + `tags.service.spec.ts`.
- No inline magic strings/numbers: messages, limits, tokens go in `constants/`.
- Explicit return types on public service/repository methods. No `any` in production code.
- Read env via `ConfigService`, not `process.env`, in new code.
- Details: `.claude/rules/code-style.md`.

## Rules

Topic rules live in `.claude/rules/`. Some load only when matching files are touched:

| Rule | Applies to |
| --- | --- |
| `architecture.md` | all `src/**/*.ts` |
| `code-style.md` | all `src/**/*.ts` |
| `testing.md` | `**/*.spec.ts` |
| `api.md` | controllers, DTOs, guards, decorators |
| `database.md` | entities, repositories, migrations, data-source |
| `git-workflow.md` | always (git operations) |
| `security.md` | always |

## Skills

Step-by-step workflows in `.claude/skills/` (invoke with `/<name>` or let Claude pick them up automatically):

| Skill | Use for |
| --- | --- |
| `add-endpoint` | new route or CRUD resource: DTO → repository → service → controller → specs → module → CI |
| `add-migration` | schema change: entity + new migration with correct timestamp, real `down()`, run/revert/run check |
