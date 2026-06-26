package sandbox

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"code-execution-engine/internal/models"
)

// LocalSandbox executes code using locally installed runtimes (no Docker).
// Used as a fallback in development when Docker is not available.
type LocalSandbox struct{}

// NewLocalSandbox creates a local sandbox instance
func NewLocalSandbox() (*LocalSandbox, error) {
	return &LocalSandbox{}, nil
}

// ExecuteCode runs code using local system executors
func (s *LocalSandbox) ExecuteCode(req *models.ExecutionRequest, lang models.Language) (*models.ExecutionResult, error) {
	start := time.Now()

	result := &models.ExecutionResult{
		ID:        req.ID,
		Completed: time.Now(),
	}

	// Create a temp directory for this execution
	tmpDir, err := os.MkdirTemp("", "coderun-"+req.ID+"-")
	if err != nil {
		result.Status = "error"
		result.Error = "Failed to create temp directory"
		return result, nil
	}
	defer os.RemoveAll(tmpDir)

	var mainFilePath string

	if len(req.Files) > 0 {
		// Multi-file execution
		for _, file := range req.Files {
			if file.Name == ".gitkeep" || file.Name == ".folder" {
				continue
			}
			filePath := filepath.Join(tmpDir, filepath.FromSlash(file.Path))
			dir := filepath.Dir(filePath)
			if err := os.MkdirAll(dir, 0755); err != nil {
				continue
			}
			if err := os.WriteFile(filePath, []byte(file.Content), 0644); err != nil {
				continue
			}
		}
		if req.MainFile != "" {
			mainFilePath = filepath.Join(tmpDir, filepath.FromSlash(req.MainFile))
		} else if len(req.Files) > 0 {
			mainFilePath = filepath.Join(tmpDir, filepath.FromSlash(req.Files[0].Path))
		}
	} else {
		// Single file execution
		ext := s.getExtension(lang.Name)
		mainFilePath = filepath.Join(tmpDir, "code"+ext)
		if err := os.WriteFile(mainFilePath, []byte(req.Code), 0644); err != nil {
			result.Status = "error"
			result.Error = "Failed to write code file"
			return result, nil
		}
	}

	timeout := time.Duration(lang.Timeout) * time.Second
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	var stdout, stderr bytes.Buffer
	var exitCode int

	// Compile if needed (C++, Java)
	if len(lang.Compile) > 0 {
		compileArgs := s.buildLocalArgs(lang.Compile, tmpDir, mainFilePath)
		compileCmd := exec.Command(compileArgs[0], compileArgs[1:]...)
		compileCmd.Dir = tmpDir
		compileCmd.Stdout = &stdout
		compileCmd.Stderr = &stderr

		if err := compileCmd.Run(); err != nil {
			if exitError, ok := err.(*exec.ExitError); ok {
				exitCode = exitError.ExitCode()
			}
			result.Status = "error"
			result.Output = stdout.String()
			result.Error = stderr.String()
			result.ExitCode = exitCode
			result.ExecutionTime = time.Since(start)
			return result, nil
		}
		stdout.Reset()
		stderr.Reset()
	}

	// Run
	runArgs := s.buildLocalArgs(lang.Run, tmpDir, mainFilePath)
	runCmd := exec.Command(runArgs[0], runArgs[1:]...)
	runCmd.Dir = tmpDir
	runCmd.Stdout = &stdout
	runCmd.Stderr = &stderr
	if req.Stdin != "" {
		runCmd.Stdin = strings.NewReader(req.Stdin)
	}

	doneCh := make(chan error, 1)
	go func() { doneCh <- runCmd.Run() }()

	select {
	case err := <-doneCh:
		if err != nil {
			if exitError, ok := err.(*exec.ExitError); ok {
				exitCode = exitError.ExitCode()
			}
			result.Status = "error"
		} else {
			exitCode = 0
			result.Status = "success"
		}
	case <-time.After(timeout):
		if runCmd.Process != nil {
			runCmd.Process.Kill()
		}
		result.Status = "timeout"
		result.Error = "Execution timeout"
		result.ExecutionTime = time.Since(start)
		return result, nil
	}

	result.Output = stdout.String()
	result.Error = stderr.String()
	result.ExitCode = exitCode
	result.ExecutionTime = time.Since(start)

	if exitCode != 0 && result.Status != "error" {
		result.Status = "error"
	}

	return result, nil
}

// buildLocalArgs replaces Docker container paths with local tmp paths
func (s *LocalSandbox) buildLocalArgs(args []string, tmpDir, mainFilePath string) []string {
	result := make([]string, len(args))
	compiledBinary := filepath.Join(tmpDir, "code")
	for i, arg := range args {
		// Replace Docker container source paths with local paths
		arg = strings.ReplaceAll(arg, "/tmp/code.py", mainFilePath)
		arg = strings.ReplaceAll(arg, "/tmp/code.js", mainFilePath)
		arg = strings.ReplaceAll(arg, "/tmp/code.cpp", mainFilePath)
		arg = strings.ReplaceAll(arg, "/tmp/Main.java", mainFilePath)
		// Replace compiled binary placeholder ONLY when it is the full token,
		// not as a prefix of "/tmp/code.py" etc. (those were already replaced above)
		if arg == "/tmp/code" {
			arg = compiledBinary
		}
		result[i] = arg
	}
	return result
}


// getExtension returns the file extension for a language
func (s *LocalSandbox) getExtension(language string) string {
	switch language {
	case "python":
		return ".py"
	case "cpp":
		return ".cpp"
	case "javascript":
		return ".js"
	case "java":
		return ".java"
	default:
		return ".txt"
	}
}

// checkLocalRuntime checks if a runtime is available locally
func checkLocalRuntime(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

// GetAvailableRuntimes returns which local runtimes are available
func GetAvailableRuntimes() []string {
	runtimes := []string{"python3", "python", "node", "g++", "javac"}
	var available []string
	for _, r := range runtimes {
		if checkLocalRuntime(r) {
			available = append(available, r)
		}
	}
	return available
}

// IsDockerAvailable checks if Docker is running
func IsDockerAvailable() bool {
	cmd := exec.Command("docker", "version")
	return cmd.Run() == nil
}

// NewSandboxWithFallback tries Docker first, falls back to local execution
func NewSandboxWithFallback() (Sandbox, error) {
	if IsDockerAvailable() {
		s, err := NewSimpleSandbox()
		if err == nil {
			fmt.Println("✅ Using Docker sandbox for code execution")
			return s, nil
		}
	}

	fmt.Println("⚠️  Docker not available — using local sandbox (dev mode, limited security)")
	return NewLocalSandbox()
}
