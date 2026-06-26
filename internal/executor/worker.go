package executor

import (
	"fmt"
	"log"
	"time"

	"code-execution-engine/internal/models"
	"code-execution-engine/internal/queue"
	"code-execution-engine/pkg/languages"
	"code-execution-engine/pkg/sandbox"
)

// Worker processes execution jobs from the queue
type Worker struct {
	id       int
	queue    *queue.RedisQueue
	sandbox  sandbox.Sandbox
	registry *languages.Registry
	stopCh   chan bool
}

// NewWorker creates a new worker instance
func NewWorker(id int, queue *queue.RedisQueue, sandbox sandbox.Sandbox, registry *languages.Registry) *Worker {
	return &Worker{
		id:       id,
		queue:    queue,
		sandbox:  sandbox,
		registry: registry,
		stopCh:   make(chan bool),
	}
}

// Start begins processing jobs
func (w *Worker) Start() {
	log.Printf("Worker %d started", w.id)

	for {
		select {
		case <-w.stopCh:
			log.Printf("Worker %d stopped", w.id)
			return
		default:
			w.processJob()
		}
	}
}

// Stop gracefully stops the worker
func (w *Worker) Stop() {
	w.stopCh <- true
}

// processJob processes a single job from the queue
func (w *Worker) processJob() {
	// Pop job from queue with timeout
	job, err := w.queue.Pop(5 * time.Second)
	if err != nil {
		// Only log non-timeout errors
		if err.Error() != "redis: nil" {
			log.Printf("Worker %d: Error popping job: %v", w.id, err)
		}
		return
	}

	if job == nil {
		// No job available, continue
		return
	}

	log.Printf("Worker %d: Processing job %s (Language: %s, Files: %d)",
		w.id, job.ID, job.Language, len(job.Files))

	// Get language configuration
	lang, err := w.registry.GetLanguage(job.Language)
	if err != nil {
		log.Printf("Worker %d: Unsupported language %s for job %s", w.id, job.Language, job.ID)
		w.publishError(job.ID, fmt.Sprintf("Unsupported language: %s", job.Language))
		return
	}

	// Update job status to running
	job.Status = "running"

	// Execute code in sandbox
	log.Printf("Worker %d: Executing job %s in sandbox", w.id, job.ID)
	result, err := w.sandbox.ExecuteCode(job, lang)
	if err != nil {
		log.Printf("Worker %d: Execution failed for job %s: %v", w.id, job.ID, err)
		w.publishError(job.ID, fmt.Sprintf("Execution failed: %v", err))
		return
	}

	// Publish result
	log.Printf("Worker %d: Publishing result for job %s (Status: %s)", w.id, job.ID, result.Status)
	if err := w.queue.PublishResult(result); err != nil {
		log.Printf("Worker %d: Error publishing result: %v", w.id, err)
		return
	}

	log.Printf("Worker %d: Completed job %s in %v", w.id, job.ID, result.ExecutionTime)
}

// publishError publishes an error result
func (w *Worker) publishError(jobID, errorMsg string) {
	result := &models.ExecutionResult{
		ID:        jobID,
		Status:    "error",
		Error:     errorMsg,
		ExitCode:  1,
		Completed: time.Now(),
	}

	if err := w.queue.PublishResult(result); err != nil {
		log.Printf("Worker %d: Error publishing error result: %v", w.id, err)
	}
}

// WorkerPool manages multiple workers
type WorkerPool struct {
	workers []*Worker
	size    int
}

// NewWorkerPool creates a new worker pool
func NewWorkerPool(size int, queue *queue.RedisQueue, sandbox sandbox.Sandbox, registry *languages.Registry) *WorkerPool {
	workers := make([]*Worker, size)
	for i := 0; i < size; i++ {
		workers[i] = NewWorker(i+1, queue, sandbox, registry)
	}

	return &WorkerPool{
		workers: workers,
		size:    size,
	}
}

// Start starts all workers in the pool
func (wp *WorkerPool) Start() {
	log.Printf("Starting worker pool with %d workers", wp.size)
	for _, worker := range wp.workers {
		go worker.Start()
	}
}

// Stop stops all workers in the pool
func (wp *WorkerPool) Stop() {
	log.Printf("Stopping worker pool")
	for _, worker := range wp.workers {
		worker.Stop()
	}
}
