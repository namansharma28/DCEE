package sandbox

import "code-execution-engine/internal/models"

// Sandbox defines the interface for code execution environments
type Sandbox interface {
	ExecuteCode(req *models.ExecutionRequest, lang models.Language) (*models.ExecutionResult, error)
}

// NewSandbox creates a sandbox — tries Docker first, falls back to local execution
func NewSandbox() (Sandbox, error) {
	return NewSandboxWithFallback()
}
