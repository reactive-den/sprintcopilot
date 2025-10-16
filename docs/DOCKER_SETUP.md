# Docker Setup Guide

Complete guide for running SprintCopilot with Docker.

## Quick Start (One Command)

```bash
# 1. Clone the repository
git clone <repository-url>
cd sprintcopilot

# 2. Setup environment
make setup
# Edit .env and add your OPENAI_API_KEY

# 3. Start everything
make start

# That's it! Visit http://localhost:3000
```

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- Make (optional, for convenience commands)

### Install Docker

**macOS:**

```bash
brew install --cask docker
```

**Linux:**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

**Windows:**
Download from [Docker Desktop](https://www.docker.com/products/docker-desktop)

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Compose                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Next.js    │    │  PostgreSQL  │  │
│  │     App      │───▶│   Database   │  │
│  │ Port: 3000   │    │ Port: 5432   │  │
│  └──────────────┘    └──────────────┘  │
│                                         │
│  Features:                              │
│  • Auto migrations                      │
│  • Health checks                        │
│  • Persistent data                      │
│  • Hot reload (dev)                     │
│                                         │
└─────────────────────────────────────────┘
```

## Setup Instructions

### 1. Environment Configuration

Copy the Docker environment template:

```bash
cp .env.docker .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 2. Start Services

**Using Make (Recommended):**

```bash
make start
```

**Using Docker Compose:**

```bash
docker-compose up -d
```

### 3. Verify Installation

Check service health:

```bash
make health
```

Or manually:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-16T04:50:00.000Z",
  "responseTime": "45ms",
  "services": {
    "database": { "status": "up", "type": "postgresql" },
    "redis": { "status": "not_configured", "type": "upstash" }
  }
}
```

## Available Commands

### Make Commands

```bash
make help          # Show all available commands
make setup         # Initial setup (copy .env)
make start         # Start all services
make stop          # Stop all services
make restart       # Restart all services
make logs          # Show logs (all services)
make logs service=app  # Show logs (specific service)
make build         # Rebuild Docker images
make clean         # Remove all containers and data
make ps            # Show running containers
make health        # Check service health
make shell         # Open shell in app container
make db-shell      # Open PostgreSQL shell
make migrate       # Run database migrations
make dev           # Start with logs (development)
make prod          # Start detached (production)
make update        # Pull changes and rebuild
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app

# Rebuild images
docker-compose build --no-cache

# Remove everything including volumes
docker-compose down -v

# Show running containers
docker-compose ps

# Execute command in container
docker-compose exec app sh
docker-compose exec db psql -U postgres -d sprintcopilot
```

## Development Workflow

### Starting Development

```bash
# Start with logs visible
make dev

# Or
docker-compose up
```

### Making Code Changes

The Docker setup automatically handles:

- ✅ Code changes (hot reload in dev mode)
- ✅ Database migrations (auto-run on startup)
- ✅ Dependency changes (rebuild required)

### Rebuilding After Changes

```bash
# If you change package.json or Dockerfile
make build
make start
```

### Viewing Logs

```bash
# All services
make logs

# Just the app
make logs service=app

# Just the database
make logs service=db
```

### Accessing Containers

```bash
# App container shell
make shell

# Database shell
make db-shell

# Or manually
docker-compose exec app sh
docker-compose exec db psql -U postgres -d sprintcopilot
```

## Production Deployment

### Building for Production

```bash
# Build optimized images
docker-compose build --no-cache

# Start in production mode
make prod
```

### Environment Variables

Ensure these are set in `.env`:

```env
NODE_ENV=production
OPENAI_API_KEY=sk-your-production-key
DATABASE_URL=postgresql://user:pass@db:5432/sprintcopilot
```

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3000
lsof -ti:3000

# Kill the process
lsof -ti:3000 | xargs kill -9

# Or change the port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Build Failures

```bash
# Clean build cache
docker system prune -a

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check if environment variables are set
docker-compose exec app env | grep OPENAI

# Verify .env file exists
ls -la .env
```

### Migrations Failing

```bash
# Run migrations manually
docker-compose exec app npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
docker-compose exec app npx prisma migrate reset

# Check migration status
docker-compose exec app npx prisma migrate status
```

## Data Management

### Backup Database

```bash
# Create backup
docker-compose exec db pg_dump -U postgres sprintcopilot > backup.sql

# Restore backup
docker-compose exec -T db psql -U postgres sprintcopilot < backup.sql
```

### Reset Database

```bash
# WARNING: This deletes all data
docker-compose down -v
docker-compose up -d
```

### View Database

```bash
# Open PostgreSQL shell
make db-shell

# Or
docker-compose exec db psql -U postgres -d sprintcopilot

# Common queries
\dt                    # List tables
\d+ projects          # Describe projects table
SELECT * FROM runs;   # Query runs
```

## Performance Optimization

### Build Cache

Docker caches layers for faster builds:

- Dependencies are cached unless `package.json` changes
- Source code changes don't require dependency reinstall

### Volume Mounts

Development mode uses volumes for hot reload:

```yaml
volumes:
  - ./src:/app/src
  - ./public:/app/public
```

### Multi-stage Build

Production image is optimized:

- Only includes runtime dependencies
- Smaller image size (~200MB vs ~1GB)
- Faster deployment

## Security

### Non-root User

App runs as non-root user `nextjs`:

```dockerfile
USER nextjs
```

### Health Checks

Automatic health monitoring:

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
  interval: 30s
  timeout: 10s
  retries: 3
```

### Network Isolation

Services communicate on private network:

```yaml
networks:
  sprintcopilot-network:
    driver: bridge
```

## Advanced Configuration

### Custom Database

Use external PostgreSQL:

```yaml
# docker-compose.yml
services:
  app:
    environment:
      DATABASE_URL: postgresql://user:pass@external-db:5432/db
```

### Add Redis

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Multiple Environments

```bash
# Development
docker-compose -f docker-compose.yml up

# Staging
docker-compose -f docker-compose.staging.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Docker Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker-compose build
      - name: Run tests
        run: docker-compose run app npm test
```

### GitLab CI

```yaml
build:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker-compose build
    - docker-compose run app npm test
```

## FAQ

**Q: Do I need to install Node.js?**
A: No, everything runs in Docker containers.

**Q: How do I update dependencies?**
A: Update `package.json`, then run `make build && make start`.

**Q: Can I use this in production?**
A: Yes, but consider using managed services for PostgreSQL.

**Q: How do I scale the application?**
A: Use Docker Swarm or Kubernetes for horizontal scaling.

**Q: What about Windows?**
A: Docker Desktop works on Windows. Use PowerShell or WSL2.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Docs**: [Main README](../README.md)
- **Docker**: [Docker Documentation](https://docs.docker.com)

---

**Last Updated**: January 16, 2025  
**Docker Version**: 20.10+  
**Docker Compose Version**: 2.0+
