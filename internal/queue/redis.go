package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"code-execution-engine/internal/models"

	"github.com/redis/go-redis/v9"
)

const (
	ExecutionQueue = "execution_queue"
	ResultQueue    = "result_queue"
)

// RedisQueue implements job queue using Redis
type RedisQueue struct {
	client *redis.Client
	ctx    context.Context
}

// NewRedisQueue creates a new Redis queue client
func NewRedisQueue(addr, password string, db int) *RedisQueue {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	return &RedisQueue{
		client: rdb,
		ctx:    context.Background(),
	}
}

// Push adds a job to the execution queue
func (q *RedisQueue) Push(job *models.ExecutionRequest) error {
	data, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("failed to marshal job: %w", err)
	}

	err = q.client.LPush(q.ctx, ExecutionQueue, data).Err()
	if err != nil {
		return fmt.Errorf("failed to push job to queue: %w", err)
	}

	return nil
}

// Pop retrieves a job from the execution queue (blocking)
func (q *RedisQueue) Pop(timeout time.Duration) (*models.ExecutionRequest, error) {
	result, err := q.client.BRPop(q.ctx, timeout, ExecutionQueue).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // No job available
		}
		return nil, fmt.Errorf("failed to pop job from queue: %w", err)
	}

	var job models.ExecutionRequest
	err = json.Unmarshal([]byte(result[1]), &job)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal job: %w", err)
	}

	return &job, nil
}

// PublishResult publishes execution result and stores it
func (q *RedisQueue) PublishResult(result *models.ExecutionResult) error {
	data, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("failed to marshal result: %w", err)
	}

	// Store result in Redis with expiration (for polling)
	resultKey := fmt.Sprintf("result_%s", result.ID)
	err = q.client.Set(q.ctx, resultKey, data, 10*time.Minute).Err()
	if err != nil {
		return fmt.Errorf("failed to store result: %w", err)
	}

	// Also publish for real-time subscribers
	err = q.client.Publish(q.ctx, resultKey, data).Err()
	if err != nil {
		return fmt.Errorf("failed to publish result: %w", err)
	}

	return nil
}

// GetResult retrieves a stored result
func (q *RedisQueue) GetResult(jobID string) (*models.ExecutionResult, error) {
	resultKey := fmt.Sprintf("result_%s", jobID)
	data, err := q.client.Get(q.ctx, resultKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // Result not ready yet
		}
		return nil, fmt.Errorf("failed to get result: %w", err)
	}

	var result models.ExecutionResult
	err = json.Unmarshal([]byte(data), &result)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal result: %w", err)
	}

	return &result, nil
}

// SubscribeToResult subscribes to execution results
func (q *RedisQueue) SubscribeToResult(jobID string) *redis.PubSub {
	return q.client.Subscribe(q.ctx, fmt.Sprintf("result_%s", jobID))
}

// Close closes the Redis connection
func (q *RedisQueue) Close() error {
	return q.client.Close()
}
