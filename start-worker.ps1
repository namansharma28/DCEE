# Set environment variables and start worker
$env:REDIS_ADDR = "localhost:6379"
$env:WORKER_COUNT = "4"

# Run Worker
go run .\cmd\worker\main.go
