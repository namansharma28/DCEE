package languages

import (
	"code-execution-engine/internal/models"
	"fmt"
)

// Registry holds all supported languages
type Registry struct {
	languages map[string]models.Language
}

// NewRegistry creates a new language registry
func NewRegistry() *Registry {
	r := &Registry{
		languages: make(map[string]models.Language),
	}
	r.loadDefaultLanguages()
	return r
}

// loadDefaultLanguages initializes supported languages
func (r *Registry) loadDefaultLanguages() {
	// Python
	r.languages["python"] = models.Language{
		Name:     "python",
		Image:    "python:3.11-alpine",
		Run:      []string{"python", "/tmp/code.py"},
		Timeout:  30,
		MemLimit: "128m",
	}

	// C++
	r.languages["cpp"] = models.Language{
		Name:     "cpp",
		Image:    "gcc:latest",
		Compile:  []string{"g++", "-o", "/tmp/code", "/tmp/code.cpp"},
		Run:      []string{"/tmp/code"},
		Timeout:  30,
		MemLimit: "128m",
	}

	// JavaScript (Node.js)
	r.languages["javascript"] = models.Language{
		Name:     "javascript",
		Image:    "node:18-alpine",
		Run:      []string{"node", "/tmp/code.js"},
		Timeout:  30,
		MemLimit: "128m",
	}

	// Java
	r.languages["java"] = models.Language{
		Name:     "java",
		Image:    "eclipse-temurin:17-alpine",
		Compile:  []string{"javac", "/tmp/Main.java"},
		Run:      []string{"java", "-cp", "/tmp", "Main"},
		Timeout:  30,
		MemLimit: "256m",
	}
}

// GetLanguage returns language configuration
func (r *Registry) GetLanguage(name string) (models.Language, error) {
	lang, exists := r.languages[name]
	if !exists {
		return models.Language{}, fmt.Errorf("unsupported language: %s", name)
	}
	return lang, nil
}

// GetSupportedLanguages returns list of supported languages
func (r *Registry) GetSupportedLanguages() []string {
	var languages []string
	for name := range r.languages {
		languages = append(languages, name)
	}
	return languages
}
