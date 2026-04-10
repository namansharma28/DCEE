@echo off
echo 🚀 Code Execution Engine - Windows Runner
echo.

if "%1"=="help" goto help
if "%1"=="build" goto build
if "%1"=="api" goto api
if "%1"=="worker" goto worker
if "%1"=="docker" goto docker
if "%1"=="test" goto test
if "%1"=="clean" goto clean

:help
echo Available commands:
echo   run.bat build    - Build the Go binaries
echo   run.bat api      - Run the API server
echo   run.bat worker   - Run the worker service
echo   run.bat docker   - Start with Docker Compose
echo   run.bat test     - Test the API
echo   run.bat clean    - Clean build artifacts
goto end

:build
echo 🔨 Building binaries...
if not exist bin mkdir bin
go build -o bin\api.exe .\cmd\api
go build -o bin\worker.exe .\cmd\worker
echo ✅ Build complete!
goto end

:api
echo 🚀 Starting API server...
go run .\cmd\api\main.go
goto end

:worker
echo 👷 Starting worker service...
go run .\cmd\worker\main.go
goto end

:docker
echo 🐳 Starting with Docker Compose...
docker-compose up --build -d
echo ✅ Services started!
echo API: http://localhost:8080
echo Health: http://localhost:8080/health
echo Open examples\client.html in your browser
goto end

:test
echo 🧪 Testing API...
cd examples
python test_api.py
cd ..
goto end

:clean
echo 🧹 Cleaning...
if exist bin rmdir /s /q bin
docker system prune -f
goto end

:end