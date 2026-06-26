package models

import (
	"time"
)

// ExecutionRequest represents a code execution request
type ExecutionRequest struct {
	ID       string        `json:"id" bson:"_id"`
	Code     string        `json:"code" bson:"code"`
	Language string        `json:"language" bson:"language"`
	UserID   string        `json:"user_id,omitempty" bson:"user_id,omitempty"`
	Files    []ProjectFile `json:"files,omitempty" bson:"files,omitempty"`
	MainFile string        `json:"main_file,omitempty" bson:"main_file,omitempty"`
	Status   string        `json:"status" bson:"status"` // pending, running, completed, failed
	Created  time.Time     `json:"created" bson:"created"`
}

// ExecutionResult represents the result of code execution
type ExecutionResult struct {
	ID            string        `json:"id" bson:"_id"`
	Output        string        `json:"output" bson:"output"`
	Error         string        `json:"error" bson:"error"`
	ExecutionTime time.Duration `json:"execution_time" bson:"execution_time"`
	Status        string        `json:"status" bson:"status"` // success, error, timeout
	ExitCode      int           `json:"exit_code" bson:"exit_code"`
	Completed     time.Time     `json:"completed" bson:"completed"`
}

// Language defines how each programming language is executed
type Language struct {
	Name     string   `json:"name"`
	Image    string   `json:"image"`
	Compile  []string `json:"compile,omitempty"`
	Run      []string `json:"run"`
	Timeout  int      `json:"timeout"` // seconds
	MemLimit string   `json:"mem_limit"`
}

// WebSocketMessage for real-time communication
type WebSocketMessage struct {
	Type    string      `json:"type"` // output, error, status, complete
	Content interface{} `json:"content"`
	JobID   string      `json:"job_id"`
}
