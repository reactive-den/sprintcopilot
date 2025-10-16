# Contributing to SprintCopilot

Thank you for your interest in contributing to SprintCopilot! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Docker Development](#docker-development)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.17.0 (use `.nvmrc` file)
- **pnpm**: Latest version
- **Docker**: For containerized development (optional)
- **PostgreSQL**: v16+ (or use Docker)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/sprintcopilot.git
   cd sprintcopilot
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/sprintcopilot.git
   ```

## 💻 Development Setup

### 1. Install Node.js Version

Use the correct Node.js version:

```bash
# If using nvm
nvm use

# If using fnm
fnm use

# If using asdf
asdf install nodejs
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in the required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: Your OpenAI API key
- `UPSTASH_REDIS_REST_URL`: (Optional) Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN`: (Optional) Upstash Redis token

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev
```

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at http://localhost:3000

## 🔄 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 3. Commit Your Changes

We use conventional commits:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in component"
git commit -m "docs: update README"
```

Commit types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks

### 4. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

## 📏 Code Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Use type aliases for unions/intersections

### Code Style

- **Formatting**: Prettier (runs automatically on save)
- **Linting**: ESLint (runs automatically on save)
- **Line Length**: Max 80-120 characters
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required

### File Organization

```
src/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   └── [pages]/     # Page components
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and configs
└── types/           # TypeScript type definitions
```

### Naming Conventions

- **Files**: `kebab-case.ts` or `PascalCase.tsx` for components
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### Writing Tests

- Place tests next to the code they test or in `__tests__/`
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies

Example:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { title: 'Test' };

    // Act
    const result = render(<MyComponent {...props} />);

    // Assert
    expect(result.getByText('Test')).toBeInTheDocument();
  });
});
```

## 📝 Submitting Changes

### Before Submitting

1. **Run all checks**:

   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   pnpm format:check
   ```

2. **Ensure your branch is up to date**:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

3. **Push your changes**:
   ```bash
   git push origin your-branch-name
   ```

### Create a Pull Request

1. Go to the repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template with:
   - Clear description of changes
   - Related issue numbers
   - Screenshots (if UI changes)
   - Testing steps

### PR Review Process

- Address review comments promptly
- Keep discussions focused and professional
- Update your PR based on feedback
- Ensure CI checks pass

## 🐳 Docker Development

### Using Docker Compose

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f app

# Stop services
docker compose down

# Rebuild and start
docker compose up -d --build
```

### Using Makefile

```bash
# Setup environment
make setup

# Start services
make start

# View logs
make logs

# Stop services
make stop

# Restart services
make restart
```

See [Docker Setup Guide](docs/DOCKER_SETUP.md) for more details.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## 📞 Getting Help

- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the [docs/](docs/) directory

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to SprintCopilot! 🎉
