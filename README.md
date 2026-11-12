# Ocean Shop API

Backend for **Ocean Shop**, a multi-shop e-commerce platform. It covers the catalog, orders, users and auth, statistics and settings.

The API serves two clients:

- **Admin panel**: shop managers with the `admin` or `super` role.
- **Client storefront**: customers with the `user` role, or anonymous visitors.

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | [NestJS 11](https://nestjs.com), TypeScript 5 |
| Database | PostgreSQL + TypeORM (migrations only, `synchronize: false`) |
| Queue / cache | BullMQ + Redis (both optional) |
| Auth | JWT (access + refresh), OTP by email / SMS, `bcryptjs` |
| Email | [Resend](https://resend.com) + Handlebars templates |
| SMS | [TurboSMS](https://turbosms.ua) |
| Images | [Cloudinary](https://cloudinary.com) |
| Docs | Swagger / OpenAPI |
| Tests | Jest 30 (coverage ≥ 70% enforced) |
| Deploy | [Railway](https://railway.com) (`railway.json`) |

## Getting started

### Prerequisites

- Node.js 22 (same as CI)
- PostgreSQL
- Redis (optional, needed only for the email queue and the response cache)

### Setup

```bash
npm ci                    # install dependencies from the lockfile
cp .env.example .env      # then fill in the values (see below)
npm run migration:run     # apply database migrations
npm run seed              # seed roles (admin, super, user) and base users
npm run start:dev         # start in watch mode
```

The API listens on `http://localhost:3000` by default. Swagger UI is served at `/docs` (configurable through `SWAGGER_PATH`) and at `/`.

### Environment variables

All variables are documented in [`.env.example`](.env.example). The main groups:

| Group | Variables | Notes |
| --- | --- | --- |
| Server | `PORT`, `APP_ENV`, `CORS_ORIGIN`, `SWAGGER_ENABLED`, `SWAGGER_PATH` | `APP_ENV` is `develop` or `production` and picks the built-in CORS allowlist |
| Database | `DATABASE_URL`, `DATABASE_SSL`, `MIGRATION_DATABASE_URL` | `MIGRATION_DATABASE_URL` is only for prod migrations through the public proxy |
| Auth | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OTP_EXPIRE`, `REFRESH_EXPIRE_TIME` | **Required.** The app won't start without the JWT secrets |
| Email | `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_EMAIL`, `MANUAL_PAYMENT_*` | Sent over Resend's HTTPS API (SMTP is blocked on many hosts) |
| SMS | `TURBOSMS_API_TOKEN`, `TURBOSMS_SENDER`, `TURBOSMS_API_URL` | Phone OTP delivery |
| Images | `CLOUDINARY_URL` (or `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET`), `CLOUDINARY_PRODUCTS_FOLDER` | Product image uploads |
| Queue / cache | `EMAIL_QUEUE_ENABLED`, `REDIS_URL`, `CACHE_ENABLED` | See below |

**Running without Redis.** Set `EMAIL_QUEUE_ENABLED=false` to send emails inline. Leave `REDIS_URL` unset (or set `CACHE_ENABLED=false`) to serve the storefront straight from Postgres. Redis failures always fall back to Postgres and never fail a request.

## Scripts

| Task | Command |
| --- | --- |
| Dev server (watch) | `npm run start:dev` |
| Debug server | `npm run start:debug` |
| Build | `npm run build` |
| Run prod build | `npm run start:prod` |
| Unit tests | `npm run test` (one file: `npx jest path/to/file.spec.ts`) |
| Tests with coverage | `npm run test:cov` |
| Lint (fix / check) | `npm run lint` / `npm run lint:check` |
| Format (write / check) | `npm run format:write` / `npm run format:check` |
| Format + lint + tests | `npm run check` |
| Migrations | `npm run migration:run` / `npm run migration:revert` |
| Seed | `npm run seed` |

## API overview

Full, interactive docs live in Swagger. Protected routes take a Bearer JWT; auth also sets `httpOnly` cookies. The main route groups:

| Module | Routes | Purpose |
| --- | --- | --- |
| Catalog | `catalog/shops`, `catalog/categories`, `catalog/tags`, `catalog/attributes`, `catalog/products`, `catalog/images` | Admin management of shops, categories, tags, attributes, products/variations and images |
| Catalog (storefront) | `catalog/products-client`, `catalog/categories-client`, `catalog/favorites-client` | Public catalog browsing (cached in Redis) and user favorites |
| Orders | `orders`, `orders-client` | Admin order management; customer checkout and order history |
| User | `user/auth`, `user/auth/client` | Admin and customer authentication (OTP, JWT, refresh sessions) |
| User (admin) | `user/admins`, `user/users`, `user/settings` | Manage admins, customers and account settings |
| User (storefront) | `user/client/profile`, `user/client/shipping`, `user/client/contacts`, `user/client/dashboard` | Customer profile, shipping addresses, "contact us" form, dashboard |
| Statistic | `statistic` | Shop statistics for the admin panel |
| Settings | `settings/cache` | Cache administration |

User-facing messages are in Ukrainian.

## Project structure

```
src/
├── main.ts           # bootstrap: CORS, ValidationPipe, Swagger, cookie-parser
├── app.module.ts     # config, TypeORM, core and feature modules
├── core/             # infrastructure only, no business logic
│   ├── cache/        # Redis response cache
│   ├── config/       # APP_ENV and CORS allowlists
│   ├── db/           # data source, migrations, seeders
│   ├── mail/         # Resend + Handlebars email templates
│   ├── queue/        # BullMQ registration
│   └── response/     # pagination and list response helpers
└── modules/
    ├── catalog/      # shops, categories, tags, attributes, products, images, favorites
    ├── orders/       # orders, statuses, order emails
    ├── settings/     # cache admin
    ├── statistic/    # shop statistics
    └── user/         # auth, users, admins, profile, shipping, roles and guards
```

Each request flows **Controller → Service → Repository**, and only repositories touch TypeORM. When a resource has both admin and storefront endpoints, its code is split into `admin/` and `client/` subfolders, with shared logic in `common/`. Every file lives in its own folder next to its `*.spec.ts`.

## Database

Schema changes go **only** through migrations in `src/core/db/migrations`. Never edit a migration that has already been applied; add a new one instead.

```bash
npm run migration:run      # apply pending migrations
npm run migration:revert   # roll back the last migration
```

## Contributing

1. Branch off `main` (kebab-case, optionally prefixed with the issue number, e.g. `20-implement-social-auth`). Never push to `main` directly.
2. Commit with a conventional prefix: `feat:`, `fix:`, `refactor:`, `test:`, `chore:` or `docs:`.
3. Before opening a PR, run the same checks as CI:

   ```bash
   npm run build && npm run format:check && npm run lint:check && npm run test:cov
   ```

4. Open a PR against `main`. Mention any new migrations or env variables in it.

Detailed conventions for contributors and AI assistants live in [`.claude/`](.claude/CLAUDE.md).

## Deployment

The app deploys to Railway using [`railway.json`](railway.json):

- **Build:** `npm ci && npm run build`
- **Pre-deploy:** `npm run migration:run:prod && npm run seed:prod`
- **Start:** `npm run start:prod`

Set `APP_ENV=production`, the production secrets and `DATABASE_URL` (private network) in the Railway service. Set `MIGRATION_DATABASE_URL` (public proxy) too, because the pre-deploy container runs before the private network resolves.

## License

UNLICENSED. Private project.
