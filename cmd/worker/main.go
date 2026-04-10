package main

import (
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"code-execution-engine/internal/executor"
	"code-execution-engine/internal/queue"
	"code-execution-engine/pkg/languages"
	"code-execution-engine/pkg/sandbox"
)

func main() {
	// Initialize Redis queue
	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	redisPassword := getEnv("REDIS_PASSWORD", "")
	redisDB, _ := strconv.Atoi(getEnv("REDIS_DB", "0"))

	queue := queue.NewRedisQueue(redisAddr, redisPassword, redisDB)
	defer queue.Close()

	// Initialize sandbox
	sandbox, err := sandbox.NewSandbox()
	if err != nil {
		log.Fatalf("Failed to initialize sandbox: %v", err)
	}

	// Initialize language registry
	registry := languages.NewRegistry()

	// Create worker pool
	workerCount, _ := strconv.Atoi(getEnv("WORKER_COUNT", "4"))
	workerPool := executor.NewWorkerPool(workerCount, queue, sandbox, registry)

	// Start worker pool
	workerPool.Start()

	// Wait for interrupt signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	log.Println("Worker service started. Press Ctrl+C to exit.")
	<-c

	log.Println("Shutting down worker service...")
	workerPool.Stop()
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
