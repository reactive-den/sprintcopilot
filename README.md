# SprintCopilot 🚀

AI-powered sprint planning assistant that transforms feature descriptions into actionable development tickets with estimates, priorities, and dependencies.

## ✨ Features

- 🤖 **AI-Powered Analysis**: Uses OpenAI to understand and break down features
- 📋 **Smart Ticket Generation**: Creates detailed, actionable development tickets
- ⏱️ **Automatic Estimation**: Provides time estimates and t-shirt sizing
- 🎯 **Priority Ranking**: Intelligently prioritizes tickets based on dependencies
- 📊 **Sprint Planning**: Organizes tickets into sprints based on capacity
- 📤 **Export Options**: Export to CSV or JIRA-compatible format
- 🔄 **Iterative Refinement**: Clarifies requirements through interactive questions

## 🐳 Quick Start with Docker (Recommended)

The fastest way to get started - no Node.js installation required!

```bash
# 1. Clone the repository
git clone <repository-url>
cd sprintcopilot

# 2. Setup environment
make setup
# Edit .env and add your OPENAI_API_KEY

# 3. Start everything
make start

# 4. Open your browser
# Visit http://localhost:3000
```

That's it! The application and database are now running in Docker containers.

### Available Docker Commands

```bash
make help          # Show all available commands
make start         # Start all services
make stop          # Stop all services
make logs          # View logs
make health        # Check service health
make shell         # Open app shell
make db-shell      # Open database shell
```

📖 **Full Docker documentation**: [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md)

## 💻 Local Development (Without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- pnpm (recommended) or npm

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sprintcopilot
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Setup environment**

   ```bash
   cp .env.example .env
   # Edit .env and add your configuration
   ```

4. **Setup database**

   ```bash
   # Create PostgreSQL database
   createdb sprintcopilot

   # Run migrations
   pnpm prisma migrate deploy
   ```

5. **Start development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### Required Environment Variables

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=sk-your-api-key-here

# Database URL (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/sprintcopilot
```

### Optional Environment Variables

```env
# OpenAI Configuration
OPENAI_MODEL=gpt-4o-mini          # or gpt-4o for better quality
OPENAI_MAX_TOKENS=4000

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Application Limits
MAX_FEATURE_LENGTH=2000
MAX_TICKETS_PER_RUN=20
DEFAULT_SPRINT_CAPACITY=40
```

See [.env.example](.env.example) for complete configuration options.

## 📚 Documentation

- **[Docker Setup Guide](docs/DOCKER_SETUP.md)** - Complete Docker documentation
- **[Production Audit](docs/PRODUCTION_AUDIT.md)** - Production readiness checklist
- **[Database Connection Pooling](docs/DATABASE_CONNECTION_POOLING.md)** - Database configuration
- **[Technical Specs](docs/TECHNICAL_SPECS.md)** - Technical architecture
- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** - Development roadmap

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           SprintCopilot                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │       Next.js Frontend           │  │
│  │  • React 19                      │  │
│  │  • TailwindCSS                   │  │
│  │  • React Query                   │  │
│  └──────────────────────────────────┘  │
│                 │                       │
│  ┌──────────────────────────────────┐  │
│  │       API Routes (Next.js)       │  │
│  │  • /api/projects                 │  │
│  │  • /api/runs                     │  │
│  │  • /api/health                   │  │
│  └──────────────────────────────────┘  │
│                 │                       │
│  ┌──────────────────────────────────┐  │
│  │      LangGraph Pipeline          │  │
│  │  • Clarifier                     │  │
│  │  • HLD Drafter                   │  │
│  │  • Ticket Slicer                 │  │
│  │  • Estimator                     │  │
│  │  • Prioritizer                   │  │
│  └──────────────────────────────────┘  │
│                 │                       │
│  ┌──────────────────────────────────┐  │
│  │      PostgreSQL Database         │  │
│  │  • Projects                      │  │
│  │  • Runs                          │  │
│  │  • Tickets                       │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 🔒 Security

- ✅ Environment variable validation with Zod
- ✅ Comprehensive security headers
- ✅ Automated secret scanning
- ✅ Database connection pooling
- ✅ Rate limiting support
- ✅ Health check endpoints

Run security checks:

```bash
pnpm security:check
```

## 📦 Building for Production

```bash
# Build the application
pnpm build

# Build and run security check
pnpm build:check

# Start production server
pnpm start
```

## 🚀 Deployment

### Docker Deployment (Recommended)

```bash
# Build and start in production mode
docker-compose up -d

# Or using Make
make prod
```

### Manual Deployment

1. Build the application
2. Set environment variables
3. Run database migrations
4. Start the server

See [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md) for detailed deployment instructions.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

[MIT License](LICENSE)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [OpenAI](https://openai.com/)
- Uses [LangGraph](https://github.com/langchain-ai/langgraph) for AI workflows
- Database with [Prisma](https://www.prisma.io/)

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

---

**Made with ❤️ by the SprintCopilot Team**
