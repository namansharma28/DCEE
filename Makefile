# Code Execution Engine Makefile

.PHONY: help build run test clean docker-build docker-run docker-stop

# Default target
help:
	@echo "🚀 Code Execution Engine"
	@echo "Available commands:"
	@echo "  build        - Build the Go binaries"
	@echo "  run-api      - Run the API server"
	@echo "  run-worker   - Run the worker service"
	@echo "  test         - Run tests"
	@echo "  clean        - Clean build artifacts"
	@echo "  docker-build - Build Docker images"
	@echo "  docker-run   - Start services with Docker Compose"
	@echo "  docker-stop  - Stop Docker services"
	@echo "  docker-logs  - View Docker logs"
	@echo "  test-api     - Test the API endpoints"

# Build binaries
build:
	@echo "🔨 Building binaries..."
	go build -o bin/api ./cmd/api
	go build -o bin/worker ./cmd/worker
	@echo "✅ Build complete!"

# Run API server
run-api:
	@echo "🚀 Starting API server..."
	go run ./cmd/api/main.go

# Run worker service
run-worker:
	@echo "👷 Starting worker service..."
	go run ./cmd/worker/main.go

# Run tests
test:
	@echo "🧪 Running tests..."
	go test -v ./...

# Clean build artifacts
clean:
	@echo "🧹 Cleaning..."
	rm -rf bin/
	docker system prune -f

# Docker commands
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-run:
	@echo "🐳 Starting services with Docker Compose..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "API: http://localhost:8080"
	@echo "Health: http://localhost:8080/health"

docker-stop:
	@echo "🛑 Stopping Docker services..."
	docker-compose down

docker-logs:
	@echo "📋 Viewing Docker logs..."
	docker-compose logs -f

# Scale services
docker-scale:
	@echo "📈 Scaling services..."
	docker-compose up -d --scale worker=4 --scale api=2

# Test API endpoints
test-api:
	@echo "🧪 Testing API endpoints..."
	@if command -v python3 >/dev/null 2>&1; then \
		cd examples && python3 test_api.py; \
	else \
		echo "❌ Python3 not found. Please install Python3 to run API tests."; \
	fi

# Development setup
dev-setup:
	@echo "🛠️  Setting up development environment..."
	go mod tidy
	go mod download
	@echo "✅ Development setup complete!"

# Quick start (build and run with Docker)
quick-start: docker-build docker-run
	@echo "🎉 Quick start complete!"
	@echo "Open examples/client.html in your browser to test the system"

# Production deployment
deploy:
	@echo "🚀 Deploying to production..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production deployment complete!"

# Monitor services
monitor:
	@echo "📊 Monitoring services..."
	@while true; do \
		echo "=== $(shell date) ==="; \
		docker-compose ps; \
		echo ""; \
		sleep 5; \
	done