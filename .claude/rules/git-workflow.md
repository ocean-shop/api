# Git workflow rules

Apply these whenever running git or `gh` commands.

## Hard rules

- **Never push to `main`.** Never force-push to `main`. All changes reach `main` through a pull request.
- **Don't commit unless explicitly asked.** Making changes ≠ permission to commit. Same for `git push` and opening PRs.
- Never rewrite published history (`push --force`, `rebase` of pushed commits) without explicit permission. Prefer new commits over `--amend`.
- Never skip hooks (`--no-verify`) or bypass signing.
- Never commit `.env`, `coverage/`, `dist/`, `node_modules/`, `.idea/` (they are in `.gitignore`; don't force-add them).

## Branches

- If on `main` and asked to commit, create a branch first.
- Naming: kebab-case, optionally prefixed with the GitHub issue number: `20-implement-social-auth`, `cors-hotfix`, `orders-api`.

## Commits

- Conventional prefix + short capitalized imperative summary:
  - `feat: Add manual payment method`
  - `fix: Fix cors issue on prod`
  - `refactor: Extract product query repository`
  - also `test:`, `chore:`, `docs:` when fitting
- Stage specific files (`git add <path>`), not `git add -A`, and check `git status` / `git diff --staged` before committing.

## Before pushing / opening a PR

Run the CI steps locally and make sure they pass:

```bash
npm run build && npm run format:check && npm run lint:check && npm run test:cov
```

PRs target `main`. Include a short summary of what changed and why, and mention any new migrations or env variables.
