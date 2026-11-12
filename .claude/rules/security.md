# Security rules

## Secrets

- Never hardcode secrets, tokens, API keys, passwords or connection strings in code, tests, docs or commits. Read them from env via `ConfigService`.
- New env variables: add to `.env.example` with a placeholder value and a comment. Never put real values there.
- Never log secrets, JWTs, refresh tokens, OTP codes, passwords, cookies, `Authorization` headers or full request bodies. Keep PII (emails, phones) in logs to the minimum needed.
- Never print the contents of `.env` in output or send it to external services.

## Files you must never edit

- `.env` (local secrets; edit `.env.example` instead)
- `package-lock.json` by hand (change it only via `npm install <pkg>` / `npm uninstall <pkg>`, and only when asked)
- Generated output: `dist/`, `coverage/`, `node_modules/`
- Already-applied migrations in `src/core/db/migrations/` (add a new migration instead)
- `.github/workflows/*` and `railway.json` unless explicitly asked

## Input validation

- Every body, query and param goes through a DTO with `class-validator` decorators. The global `ValidationPipe({ whitelist: true, transform: true })` strips unknown fields; don't disable it.
- UUID path params use `ParseUUIDPipe`. Bound strings with `@MaxLength`, numbers with `@Min`/`@Max`, arrays with `@ArrayMaxSize` where relevant; validate nested objects with `@ValidateNested()` + `@Type()`.
- Never build SQL by string concatenation. Use QueryBuilder parameters (`'tag.name ILIKE :name', { name: \`%${v}%\` }`) or `$1` placeholders in `query()`.
- Never accept sort columns / field names straight from input: map them through a whitelist constant.

## AuthN / AuthZ

- Protect non-public routes with `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`. Admin routes use `ADMIN_ROLES`.
- For client routes that touch a user's own data, check ownership with `request.user` in the service (see `helpers/access`), not just the role.
- Passwords/OTPs are hashed with `bcryptjs`; never store or return them in plain text. Never return sensitive entity fields (hashes, tokens) in responses.
- Keep auth cookies `httpOnly`, `secure` in production (see `helpers/auth-cookie`).
- Don't widen CORS origins or disable throttling without being asked.
