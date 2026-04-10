package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"code-execution-engine/internal/models"
	"code-execution-engine/pkg/languages"
)

type SimpleAPIServer struct {
	registry *languages.Registry
}

func main() {
	log.Println("🚀 Starting Simple API Server (No Redis/Docker required)")

	registry := languages.NewRegistry()
	server := &SimpleAPIServer{
		registry: registry,
	}

	// Setup Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Routes
	r.GET("/health", server.healthCheck)
	r.GET("/languages", server.getSupportedLanguages)
	r.POST("/execute", server.executeCodeSimple)

	port := getEnv("PORT", "8080")
	log.Printf("🌐 Simple API Server running on http://localhost:%s", port)
	log.Printf("📋 Health check: http://localhost:%s/health", port)
	log.Printf("🔧 Languages: http://localhost:%s/languages", port)
	log.Printf("💡 This is a simplified version for testing without Docker/Redis")
	log.Fatal(r.Run(":" + port))
}

func (s *SimpleAPIServer) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
		"service":   "code-execution-api-simple",
		"message":   "Simple API server running (no Docker/Redis)",
	})
}

func (s *SimpleAPIServer) getSupportedLanguages(c *gin.Context) {
	languages := s.registry.GetSupportedLanguages()
	c.JSON(http.StatusOK, gin.H{
		"languages": languages,
		"note":      "Docker execution not available in simple mode",
	})
}

func (s *SimpleAPIServer) executeCodeSimple(c *gin.Context) {
	var req struct {
		Code     string `json:"code" binding:"required"`
		Language string `json:"language" binding:"required"`
		UserID   string `json:"user_id,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate language
	if _, err := s.registry.GetLanguage(req.Language); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "Unsupported language",
			"language": req.Language,
		})
		return
	}

	// Create mock execution result (since we can't actually execute without Docker)
	jobID := uuid.New().String()

	// Simulate execution result
	result := models.ExecutionResult{
		ID:            jobID,
		Output:        "Mock output: Code would execute here in full system",
		Error:         "",
		ExecutionTime: time.Millisecond * 150,
		Status:        "success",
		ExitCode:      0,
		Completed:     time.Now(),
	}

	c.JSON(http.StatusOK, gin.H{
		"job_id":  jobID,
		"status":  "completed",
		"message": "Mock execution completed (Docker not available)",
		"result":  result,
		"note":    "This is a simulation. Install Docker for real code execution.",
	})
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
