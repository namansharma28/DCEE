package sandbox

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"code-execution-engine/internal/models"
)

// SimpleSandbox provides secure code execution using Docker CLI
type SimpleSandbox struct{}

// NewSimpleSandbox creates a new simple Docker sandbox
func NewSimpleSandbox() (*SimpleSandbox, error) {
	// Check if Docker is available
	cmd := exec.Command("docker", "version")
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("Docker is not available: %w", err)
	}
	return &SimpleSandbox{}, nil
}

// ExecuteCode runs code in a secure Docker container using CLI
func (s *SimpleSandbox) ExecuteCode(req *models.ExecutionRequest, lang models.Language) (*models.ExecutionResult, error) {
	start := time.Now()

	result := &models.ExecutionResult{
		ID:        req.ID,
		Completed: time.Now(),
	}

	// Create temporary container name
	containerName := fmt.Sprintf("code-exec-%s", req.ID)

	// Write code to temporary file
	filename := s.getFilename(lang.Name)

	// Prepare Docker run command with different security for compiled vs interpreted languages
	var dockerArgs []string
	if len(lang.Compile) > 0 {
		// Compiled languages need a writable filesystem to create and execute binaries
		dockerArgs = []string{
			"run",
			"--rm",
			"--name", containerName,
			"--network", "none",
			"--memory", lang.MemLimit,
			"--cpus", "0.5",
			"--tmpfs", "/tmp:rw,exec,size=100m", // Allow execution for compiled binaries
			"--tmpfs", "/var/tmp:rw,exec,size=50m", // Additional temp space
			"-i",
			lang.Image,
		}
	} else {
		// Interpreted languages can use read-only with restricted tmpfs
		dockerArgs = []string{
			"run",
			"--rm",
			"--name", containerName,
			"--network", "none",
			"--memory", lang.MemLimit,
			"--cpus", "0.5",
			"--read-only",
			"--tmpfs", "/tmp:rw,nosuid,size=100m",
			"-i",
			lang.Image,
		}
	}

	// Execute based on language
	var output, stderr string
	var exitCode int
	var err error

	if len(lang.Compile) > 0 {
		// Languages that need compilation (C++, Java)
		output, stderr, exitCode, err = s.executeWithCompilation(req.Code, lang, dockerArgs, filename)
	} else {
		// Interpreted languages (Python, JavaScript)
		output, stderr, exitCode, err = s.executeDirectly(req.Code, lang, dockerArgs, filename)
	}

	result.ExecutionTime = time.Since(start)
	result.Output = output
	result.Error = stderr
	result.ExitCode = exitCode

	if err != nil {
		if strings.Contains(err.Error(), "timeout") {
			result.Status = "timeout"
			result.Error = "Execution timeout"
		} else {
			result.Status = "error"
			if result.Error == "" {
				result.Error = err.Error()
			}
		}
	} else if exitCode == 0 {
		result.Status = "success"
	} else {
		result.Status = "error"
	}

	return result, nil
}

// executeDirectly runs interpreted languages
func (s *SimpleSandbox) executeDirectly(code string, lang models.Language, dockerArgs []string, filename string) (string, string, int, error) {
	// Use echo with proper escaping for interpreted languages
	script := fmt.Sprintf("cat > /tmp/%s << 'EOF'\n%s\nEOF\n%s",
		filename,
		code,
		strings.Join(lang.Run, " "))

	args := append(dockerArgs, "sh", "-c", script)

	return s.runDockerCommand(args, time.Duration(lang.Timeout)*time.Second)
}

// executeWithCompilation runs compiled languages
func (s *SimpleSandbox) executeWithCompilation(code string, lang models.Language, dockerArgs []string, filename string) (string, string, int, error) {
	// Use heredoc to avoid escaping issues
	compileCmd := strings.Join(lang.Compile, " ")
	runCmd := strings.Join(lang.Run, " ")

	script := fmt.Sprintf("cat > /tmp/%s << 'EOF'\n%s\nEOF\n%s && %s",
		filename,
		code,
		compileCmd,
		runCmd)

	args := append(dockerArgs, "sh", "-c", script)

	return s.runDockerCommand(args, time.Duration(lang.Timeout)*time.Second)
}

// runDockerCommand executes Docker command with timeout
func (s *SimpleSandbox) runDockerCommand(args []string, timeout time.Duration) (string, string, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	exitCode := 0
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			exitCode = exitError.ExitCode()
		} else {
			return "", "", 1, err
		}
	}

	return stdout.String(), stderr.String(), exitCode, nil
}

// getFilename returns appropriate filename for language
func (s *SimpleSandbox) getFilename(language string) string {
	switch language {
	case "python":
		return "code.py"
	case "cpp":
		return "code.cpp"
	case "javascript":
		return "code.js"
	case "java":
		return "Main.java"
	default:
		return "code.txt"
	}
}

// escapeCode properly escapes code for shell execution
func (s *SimpleSandbox) escapeCode(code string) string {
	// Simple escaping - replace quotes and newlines
	escaped := strings.ReplaceAll(code, `"`, `\"`)
	escaped = strings.ReplaceAll(escaped, "`", "\\`")
	escaped = strings.ReplaceAll(escaped, "$", "\\$")
	return fmt.Sprintf(`"%s"`, escaped)
}
