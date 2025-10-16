# SprintCopilot Makefile
# Convenient commands for Docker operations

.PHONY: help setup start stop restart logs build clean ps health shell db-shell

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)SprintCopilot - Docker Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

setup: ## Initial setup - copy .env file
	@echo "$(BLUE)Setting up SprintCopilot...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.docker .env; \
		echo "$(GREEN)✓ Created .env file from .env.docker$(NC)"; \
		echo "$(YELLOW)⚠ Please edit .env and add your OPENAI_API_KEY$(NC)"; \
	else \
		echo "$(YELLOW)⚠ .env file already exists$(NC)"; \
	fi

start: ## Start all services
	@echo "$(BLUE)Starting SprintCopilot...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Services started!$(NC)"
	@echo "$(GREEN)✓ App: http://localhost:3000$(NC)"
	@echo "$(GREEN)✓ Health: http://localhost:3000/api/health$(NC)"

stop: ## Stop all services
	@echo "$(BLUE)Stopping SprintCopilot...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart: ## Restart all services
	@echo "$(BLUE)Restarting SprintCopilot...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

logs: ## Show logs (use 'make logs service=app' for specific service)
	@if [ -z "$(service)" ]; then \
		docker-compose logs -f; \
	else \
		docker-compose logs -f $(service); \
	fi

build: ## Rebuild Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build --no-cache
	@echo "$(GREEN)✓ Build complete$(NC)"

clean: ## Stop and remove all containers, networks, and volumes
	@echo "$(RED)⚠ This will remove all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)✓ Cleanup complete$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

ps: ## Show running containers
	@docker-compose ps

health: ## Check health of services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "$(BLUE)Database:$(NC)"
	@docker-compose exec db pg_isready -U postgres || echo "$(RED)✗ Database not ready$(NC)"
	@echo ""
	@echo "$(BLUE)Application:$(NC)"
	@curl -s http://localhost:3000/api/health | jq '.' || echo "$(RED)✗ App not responding$(NC)"

shell: ## Open shell in app container
	@docker-compose exec app sh

db-shell: ## Open PostgreSQL shell
	@docker-compose exec db psql -U postgres -d sprintcopilot

migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	@docker-compose exec app npx prisma migrate deploy
	@echo "$(GREEN)✓ Migrations complete$(NC)"

seed: ## Seed database (if seed script exists)
	@echo "$(BLUE)Seeding database...$(NC)"
	@docker-compose exec app npx prisma db seed
	@echo "$(GREEN)✓ Seeding complete$(NC)"

dev: ## Start in development mode with logs
	@echo "$(BLUE)Starting in development mode...$(NC)"
	docker-compose up

prod: ## Start in production mode (detached)
	@echo "$(BLUE)Starting in production mode...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Production services started$(NC)"

update: ## Pull latest changes and rebuild
	@echo "$(BLUE)Updating SprintCopilot...$(NC)"
	git pull
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "$(GREEN)✓ Update complete$(NC)"
