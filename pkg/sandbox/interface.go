package sandbox

import "code-execution-engine/internal/models"

// Sandbox defines the interface for code execution environments
type Sandbox interface {
	ExecuteCode(req *models.ExecutionRequest, lang models.Language) (*models.ExecutionResult, error)
}

// NewSandbox creates a SimpleSandbox (CLI-based Docker execution)
func NewSandbox() (Sandbox, error) {
	return NewSimpleSandbox()
}
