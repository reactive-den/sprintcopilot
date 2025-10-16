# Package Scripts Reference

This document provides a comprehensive guide to all available npm/pnpm scripts in the project.

## 📋 Table of Contents

- [Development](#development)
- [Build & Start](#build--start)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Database](#database)
- [Security & Validation](#security--validation)
- [Docker](#docker)
- [CI/CD](#cicd)
- [Utilities](#utilities)

---

## 🚀 Development

### `pnpm dev`

Start the Next.js development server with Turbopack.

```bash
pnpm dev
```

- Runs on http://localhost:3000
- Hot module replacement enabled
- Fast refresh for React components

### `pnpm dev:debug`

Start development server with Node.js debugger enabled.

```bash
pnpm dev:debug
```

- Enables Chrome DevTools debugging
- Attach debugger on port 9229
- Useful for debugging server-side code

---

## 🏗️ Build & Start

### `pnpm build`

Create an optimized production build.

```bash
pnpm build
```

- Uses Turbopack for faster builds
- Generates static pages
- Optimizes assets and bundles

### `pnpm build:analyze`

Build with bundle analysis enabled.

```bash
pnpm build:analyze
```

- Analyzes bundle sizes
- Identifies large dependencies
- Helps optimize bundle size

### `pnpm build:check`

Build and run security checks.

```bash
pnpm build:check
```

- Runs production build
- Checks for exposed secrets
- Validates build integrity

### `pnpm start`

Start the production server.

```bash
pnpm start
```

- Serves the production build
- Runs on http://localhost:3000
- Requires `pnpm build` first

---

## 📏 Code Quality

### `pnpm lint`

Run ESLint to check for code issues.

```bash
pnpm lint
```

- Checks TypeScript/JavaScript files
- Reports style violations
- Identifies potential bugs

### `pnpm lint:fix`

Run ESLint and automatically fix issues.

```bash
pnpm lint:fix
```

- Fixes auto-fixable issues
- Formats code according to rules
- Updates files in place

### `pnpm format`

Format all code files with Prettier.

```bash
pnpm format
```

- Formats JS, TS, JSON, CSS, MD files
- Applies consistent style
- Respects .gitignore

### `pnpm format:check`

Check if files are formatted correctly.

```bash
pnpm format:check
```

- Validates formatting
- Doesn't modify files
- Useful for CI/CD

### `pnpm type-check`

Run TypeScript type checking.

```bash
pnpm type-check
```

- Validates TypeScript types
- Doesn't emit files
- Catches type errors

### `pnpm validate`

Run all code quality checks.

```bash
pnpm validate
```

- Runs type-check, lint, and format:check
- Comprehensive validation
- Recommended before commits

---

## 🧪 Testing

### `pnpm test`

Run all tests with Vitest.

```bash
pnpm test
```

- Runs unit and integration tests
- Fast execution with Vitest
- Watch mode by default in dev

### `pnpm test:watch`

Run tests in watch mode.

```bash
pnpm test:watch
```

- Re-runs tests on file changes
- Interactive mode
- Useful during development

### `pnpm test:ui`

Run tests with Vitest UI.

```bash
pnpm test:ui
```

- Opens browser-based test UI
- Visual test results
- Interactive debugging

### `pnpm test:coverage`

Run tests with coverage report.

```bash
pnpm test:coverage
```

- Generates coverage report
- Shows untested code
- Creates coverage/ directory

### `pnpm test:api`

Run API integration tests.

```bash
pnpm test:api
```

- Tests API endpoints
- Validates responses
- Checks error handling

---

## 🗄️ Database

### `pnpm db:generate`

Generate Prisma Client.

```bash
pnpm db:generate
```

- Creates type-safe database client
- Updates based on schema
- Required after schema changes

### `pnpm db:push`

Push schema changes to database.

```bash
pnpm db:push
```

- Syncs schema without migrations
- Useful for prototyping
- May cause data loss

### `pnpm db:migrate`

Create and apply a new migration.

```bash
pnpm db:migrate
```

- Creates migration files
- Applies to database
- Safe for production

### `pnpm db:migrate:deploy`

Apply pending migrations (production).

```bash
pnpm db:migrate:deploy
```

- Applies migrations only
- No interactive prompts
- Safe for CI/CD

### `pnpm db:migrate:reset`

Reset database and apply all migrations.

```bash
pnpm db:migrate:reset
```

- ⚠️ Deletes all data
- Reapplies all migrations
- Use with caution

### `pnpm db:studio`

Open Prisma Studio.

```bash
pnpm db:studio
```

- Visual database browser
- Edit data directly
- Runs on http://localhost:5555

### `pnpm db:seed`

Seed the database with initial data.

```bash
pnpm db:seed
```

- Populates database
- Uses prisma/seed.ts
- Useful for development

---

## 🔒 Security & Validation

### `pnpm security:check`

Check for exposed secrets in build.

```bash
pnpm security:check
```

- Scans build output
- Detects API keys, tokens
- Prevents secret leaks

### `pnpm security:audit`

Run security audit on dependencies.

```bash
pnpm security:audit
```

- Checks for vulnerabilities
- Reports security issues
- Recommends updates

---

## 🐳 Docker

### `pnpm docker:build`

Build Docker images.

```bash
pnpm docker:build
```

- Builds app and database images
- Uses docker-compose.yml
- Caches layers for speed

### `pnpm docker:up`

Start Docker containers.

```bash
pnpm docker:up
```

- Starts all services
- Runs in detached mode
- Applies migrations automatically

### `pnpm docker:down`

Stop and remove Docker containers.

```bash
pnpm docker:down
```

- Stops all services
- Removes containers
- Preserves volumes

### `pnpm docker:logs`

View application logs.

```bash
pnpm docker:logs
```

- Follows log output
- Shows real-time logs
- Press Ctrl+C to exit

### `pnpm docker:restart`

Restart the application container.

```bash
pnpm docker:restart
```

- Restarts app only
- Keeps database running
- Quick reload

---

## 🔄 CI/CD

### `pnpm ci`

Run full CI pipeline.

```bash
pnpm ci
```

- Validates code quality
- Runs all tests
- Creates production build
- Recommended for CI/CD

### `pnpm ci:test`

Run CI test suite.

```bash
pnpm ci:test
```

- Type checking
- Linting
- Test coverage
- Faster than full CI

---

## 🛠️ Utilities

### `pnpm clean`

Clean build cache.

```bash
pnpm clean
```

- Removes .next directory
- Clears node_modules cache
- Fixes build issues

### `pnpm clean:all`

Deep clean all generated files.

```bash
pnpm clean:all
```

- Removes all build artifacts
- Clears coverage reports
- Fresh start

### `pnpm update:deps`

Interactively update dependencies.

```bash
pnpm update:deps
```

- Shows available updates
- Interactive selection
- Updates package.json

### `pnpm check:deps`

Check for outdated dependencies.

```bash
pnpm check:deps
```

- Lists outdated packages
- Shows current vs latest
- Doesn't modify files

---

## 🔗 Git Hooks

### `precommit`

Runs automatically before commits.

- Lints staged files
- Formats code
- Prevents bad commits

### `postinstall`

Runs after `pnpm install`.

- Generates Prisma Client
- Ensures database types
- Automatic setup

### `prepare`

Runs after install (Husky setup).

- Installs git hooks
- Configures Husky
- One-time setup

---

## 💡 Common Workflows

### Starting Development

```bash
pnpm install          # Install dependencies
pnpm db:migrate       # Set up database
pnpm dev              # Start dev server
```

### Before Committing

```bash
pnpm validate         # Check code quality
pnpm test             # Run tests
git add .
git commit -m "..."   # Triggers precommit hook
```

### Production Deployment

```bash
pnpm ci               # Full CI pipeline
pnpm db:migrate:deploy # Apply migrations
pnpm start            # Start production server
```

### Docker Development

```bash
pnpm docker:build     # Build images
pnpm docker:up        # Start services
pnpm docker:logs      # View logs
pnpm docker:down      # Stop services
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vitest Documentation](https://vitest.dev)
- [Docker Documentation](https://docs.docker.com)

For more information, see [CONTRIBUTING.md](../CONTRIBUTING.md)
