package sandbox

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"code-execution-engine/internal/models"

	"github.com/google/uuid"
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

	// Determine if this is multi-file execution
	isMultiFile := len(req.Files) > 0
	var code string
	var mainFile string

	if isMultiFile {
		// Multi-file project execution
		mainFile = req.MainFile
		if mainFile == "" && len(req.Files) > 0 {
			mainFile = req.Files[0].Path
		}
	} else {
		// Single file execution (backward compatible)
		code = req.Code
		mainFile = s.getFilename(lang.Name)
	}

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

	// Execute based on language and file structure
	var output, stderr string
	var exitCode int
	var err error

	if isMultiFile {
		// Multi-file execution
		output, stderr, exitCode, err = s.executeMultiFile(req.Files, mainFile, lang, dockerArgs, req.Stdin)
	} else if len(lang.Compile) > 0 {
		// Single file with compilation (C++, Java)
		output, stderr, exitCode, err = s.executeWithCompilation(code, lang, dockerArgs, mainFile, req.Stdin)
	} else {
		// Single file interpreted (Python, JavaScript)
		output, stderr, exitCode, err = s.executeDirectly(code, lang, dockerArgs, mainFile, req.Stdin)
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
func (s *SimpleSandbox) executeDirectly(code string, lang models.Language, dockerArgs []string, filename string, stdin string) (string, string, int, error) {
	eofDelimiter := "EOF_" + strings.ReplaceAll(uuid.New().String(), "-", "")
	script := fmt.Sprintf("cat > /tmp/%s << '%s'\n%s\n%s\n%s",
		filename,
		eofDelimiter,
		code,
		eofDelimiter,
		strings.Join(lang.Run, " "))

	args := append(dockerArgs, "sh", "-c", script)

	return s.runDockerCommand(args, stdin, time.Duration(lang.Timeout)*time.Second)
}

// executeMultiFile runs multi-file projects
func (s *SimpleSandbox) executeMultiFile(files []models.ProjectFile, mainFile string, lang models.Language, dockerArgs []string, stdin string) (string, string, int, error) {
	// Build script to create all files
	var scriptParts []string
	eofDelimiter := "EOF_" + strings.ReplaceAll(uuid.New().String(), "-", "")

	// Create base directory first
	scriptParts = append(scriptParts, "mkdir -p /tmp/code")

	// Create all files with their folder structure
	for _, file := range files {
		// Create directory if file is in a folder
		if strings.Contains(file.Path, "/") {
			dir := file.Path[:strings.LastIndex(file.Path, "/")]
			scriptParts = append(scriptParts, fmt.Sprintf("mkdir -p /tmp/code/%s", dir))
		}

		// Write file content
		scriptParts = append(scriptParts, fmt.Sprintf("cat > /tmp/code/%s << '%s'\n%s\n%s", file.Path, eofDelimiter, file.Content, eofDelimiter))
	}

	// Add execution command — build from lang.Name so the right interpreter is
	// always used regardless of the actual filename.
	absMain := fmt.Sprintf("/tmp/code/%s", mainFile)
	if len(lang.Compile) > 0 {
		// Compiled language — substitute the main file path into the compile command.
		// Output binary to /tmp/code_bin to avoid collision with the /tmp/code source dir.
		compileArgs := make([]string, len(lang.Compile))
		for i, a := range lang.Compile {
			a = strings.ReplaceAll(a, "/tmp/code.cpp", absMain)
			a = strings.ReplaceAll(a, "/tmp/Main.java", absMain)
			// Redirect g++ output binary away from the source directory
			a = strings.ReplaceAll(a, "-o /tmp/code", "-o /tmp/code_bin")
			compileArgs[i] = a
		}
		compileCmd := strings.Join(compileArgs, " ")
		// Also fix the run command if it refers to the old binary path
		runArgs := make([]string, len(lang.Run))
		for i, a := range lang.Run {
			a = strings.ReplaceAll(a, "/tmp/code", "/tmp/code_bin")
			runArgs[i] = a
		}
		runCmd := strings.Join(runArgs, " ")
		scriptParts = append(scriptParts, fmt.Sprintf("cd /tmp/code && %s && %s", compileCmd, runCmd))
	} else {
		// Interpreted language — use lang.Name to pick the right interpreter
		var runCmd string
		switch lang.Name {
		case "python":
			runCmd = fmt.Sprintf("python3 %s", absMain)
		case "javascript":
			runCmd = fmt.Sprintf("node %s", absMain)
		default:
			// Generic fallback: substitute known placeholders then use as-is
			cmd := strings.Join(lang.Run, " ")
			cmd = strings.ReplaceAll(cmd, "/tmp/code.py", absMain)
			cmd = strings.ReplaceAll(cmd, "/tmp/code.js", absMain)
			runCmd = cmd
		}
		scriptParts = append(scriptParts, fmt.Sprintf("cd /tmp/code && %s", runCmd))
	}

	script := strings.Join(scriptParts, "\n")
	args := append(dockerArgs, "sh", "-c", script)

	return s.runDockerCommand(args, stdin, time.Duration(lang.Timeout)*time.Second)
}

// executeWithCompilation runs compiled languages
func (s *SimpleSandbox) executeWithCompilation(code string, lang models.Language, dockerArgs []string, filename string, stdin string) (string, string, int, error) {
	// Use heredoc to avoid escaping issues
	compileCmd := strings.Join(lang.Compile, " ")
	runCmd := strings.Join(lang.Run, " ")
	eofDelimiter := "EOF_" + strings.ReplaceAll(uuid.New().String(), "-", "")

	script := fmt.Sprintf("cat > /tmp/%s << '%s'\n%s\n%s\n%s && %s",
		filename,
		eofDelimiter,
		code,
		eofDelimiter,
		compileCmd,
		runCmd)

	args := append(dockerArgs, "sh", "-c", script)

	return s.runDockerCommand(args, stdin, time.Duration(lang.Timeout)*time.Second)
}

// runDockerCommand executes Docker command with timeout
func (s *SimpleSandbox) runDockerCommand(args []string, stdin string, timeout time.Duration) (string, string, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if stdin != "" {
		cmd.Stdin = strings.NewReader(stdin)
	}

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
