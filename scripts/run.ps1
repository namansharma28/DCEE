# Code Execution Engine - PowerShell Runner
param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

Write-Host "🚀 Code Execution Engine - PowerShell Runner" -ForegroundColor Cyan
Write-Host ""

switch ($Command) {
    "help" {
        Write-Host "Available commands:" -ForegroundColor Yellow
        Write-Host "  .\scripts\run.ps1 build      - Build the Go binaries"
        Write-Host "  .\scripts\run.ps1 api        - Run the API server (requires Redis)"
        Write-Host "  .\scripts\run.ps1 simple-api - Run simple API server (no Redis/Docker)"
        Write-Host "  .\scripts\run.ps1 worker     - Run the worker service"
        Write-Host "  .\scripts\run.ps1 docker     - Start with Docker Compose"
        Write-Host "  .\scripts\run.ps1 test       - Test the API"
        Write-Host "  .\scripts\run.ps1 clean      - Clean build artifacts"
        Write-Host "  .\scripts\run.ps1 setup      - Setup development environment"
    }
    
    "setup" {
        Write-Host "🛠️ Setting up development environment..." -ForegroundColor Green
        go mod tidy
        go mod download
        Write-Host "✅ Development setup complete!" -ForegroundColor Green
    }
    
    "build" {
        Write-Host "🔨 Building binaries..." -ForegroundColor Green
        if (!(Test-Path "bin")) { New-Item -ItemType Directory -Path "bin" }
        go build -o bin\api.exe .\cmd\api
        go build -o bin\simple-api.exe .\cmd\simple-api
        go build -o bin\worker.exe .\cmd\worker
        Write-Host "✅ Build complete!" -ForegroundColor Green
    }
    
    "api" {
        Write-Host "🚀 Starting API server..." -ForegroundColor Green
        $env:PORT = "8080"
        $env:REDIS_ADDR = "localhost:6379"
        go run .\cmd\api\main.go
    }
    
    "simple-api" {
        Write-Host "🚀 Starting Simple API server (no Redis/Docker needed)..." -ForegroundColor Green
        $env:PORT = "8080"
        go run .\cmd\simple-api\main.go
    }
    
    "worker" {
        Write-Host "👷 Starting worker service..." -ForegroundColor Green
        $env:REDIS_ADDR = "localhost:6379"
        $env:WORKER_COUNT = "4"
        go run .\cmd\worker\main.go
    }
    
    "docker" {
        Write-Host "🐳 Starting with Docker Compose..." -ForegroundColor Green
        docker-compose up --build -d
        Write-Host "✅ Services started!" -ForegroundColor Green
        Write-Host "API: http://localhost:8080" -ForegroundColor Cyan
        Write-Host "Health: http://localhost:8080/health" -ForegroundColor Cyan
        Write-Host "Open examples\client.html in your browser" -ForegroundColor Yellow
    }
    
    "docker-stop" {
        Write-Host "🛑 Stopping Docker services..." -ForegroundColor Yellow
        docker-compose down
    }
    
    "docker-logs" {
        Write-Host "📋 Viewing Docker logs..." -ForegroundColor Cyan
        docker-compose logs -f
    }
    
    "test" {
        Write-Host "🧪 Testing API..." -ForegroundColor Green
        if (Get-Command python -ErrorAction SilentlyContinue) {
            Set-Location examples
            python test_api.py
            Set-Location ..
        } elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
            Set-Location examples
            python3 test_api.py
            Set-Location ..
        } else {
            Write-Host "❌ Python not found. Please install Python to run API tests." -ForegroundColor Red
        }
    }
    
    "clean" {
        Write-Host "🧹 Cleaning..." -ForegroundColor Yellow
        if (Test-Path "bin") { Remove-Item -Recurse -Force bin }
        docker system prune -f
        Write-Host "✅ Cleanup complete!" -ForegroundColor Green
    }
    
    default {
        Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
        Write-Host "Use '.\scripts\run.ps1 help' to see available commands" -ForegroundColor Yellow
    }
}