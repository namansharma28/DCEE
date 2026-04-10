package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"code-execution-engine/internal/auth"
	"code-execution-engine/internal/database"
	"code-execution-engine/internal/models"
	"code-execution-engine/internal/project"
	"code-execution-engine/internal/queue"
	"code-execution-engine/internal/share"
	"code-execution-engine/pkg/languages"
)

type APIServer struct {
	queue    *queue.RedisQueue
	registry *languages.Registry
	upgrader websocket.Upgrader
}

func main() {
	// Load environment variables
	if err := loadEnvFile(); err != nil {
		log.Printf("Warning: Could not load .env.local file: %v", err)
	}

	// Initialize database with fallback
	if err := database.ConnectDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize authentication
	auth.InitAuth()

	// Initialize Redis queue
	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	redisPassword := getEnv("REDIS_PASSWORD", "")
	redisDB, _ := strconv.Atoi(getEnv("REDIS_DB", "0"))

	queue := queue.NewRedisQueue(redisAddr, redisPassword, redisDB)
	registry := languages.NewRegistry()

	server := &APIServer{
		queue:    queue,
		registry: registry,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins in development
			},
		},
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

	// Authentication routes
	authGroup := r.Group("/auth")
	{
		authGroup.GET("/google", auth.GoogleLoginHandler)
		authGroup.GET("/google/callback", auth.GoogleCallbackHandler)
		authGroup.GET("/profile", auth.AuthMiddleware(), auth.ProfileHandler)
		authGroup.POST("/logout", auth.LogoutHandler)
	}

	// Share routes
	shareGroup := r.Group("/api/share")
	{
		shareGroup.POST("/", auth.OptionalAuthMiddleware(), share.CreateShareHandler)
		shareGroup.POST("/project", auth.AuthMiddleware(), share.CreateProjectShareHandler)
		shareGroup.GET("/:shareId", share.GetShareHandler)
		shareGroup.GET("/user/list", auth.AuthMiddleware(), share.GetUserSharesHandler)
	}

	// Project routes
	projectGroup := r.Group("/api/project")
	{
		projectGroup.POST("/", auth.AuthMiddleware(), project.CreateProjectHandler)
		projectGroup.POST("/template/:templateId", auth.AuthMiddleware(), project.CreateProjectFromTemplateHandler)
		projectGroup.GET("/templates", project.GetTemplatesHandler)
		projectGroup.GET("/user/list", auth.AuthMiddleware(), project.GetUserProjectsHandler)
		projectGroup.GET("/:projectId", auth.OptionalAuthMiddleware(), project.GetProjectHandler)
		projectGroup.PUT("/:projectId", auth.AuthMiddleware(), project.UpdateProjectHandler)
		projectGroup.DELETE("/:projectId", auth.AuthMiddleware(), project.DeleteProjectHandler)
	}

	// API Routes
	r.GET("/health", server.healthCheck)
	r.GET("/db-status", server.databaseStatus)
	r.GET("/languages", server.getSupportedLanguages)
	r.POST("/execute", auth.OptionalAuthMiddleware(), server.executeCode)
	r.GET("/ws/:jobId", server.handleWebSocket)
	r.GET("/result/:jobId", server.getResult)

	// Serve React build files
	r.Static("/static", "./frontend/build/static")

	// Explicit frontend routes (serve React app for SPA routing)
	frontendRoutes := []string{
		"/",
		"/login",
		"/projects",
		"/project/*projectId",
		"/editor",
		"/share/*shareId",
	}

	for _, route := range frontendRoutes {
		r.GET(route, func(c *gin.Context) {
			c.File("./frontend/build/index.html")
		})
	}

	// Fallback for any other routes (serve React app)
	r.NoRoute(func(c *gin.Context) {
		// Only serve React app for non-API routes
		if !strings.HasPrefix(c.Request.URL.Path, "/api/") &&
			!strings.HasPrefix(c.Request.URL.Path, "/auth/") &&
			!strings.HasPrefix(c.Request.URL.Path, "/static/") {
			c.File("./frontend/build/index.html")
		} else {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "API endpoint not found",
			})
		}
	})

	port := getEnv("PORT", "8080")
	log.Printf("🚀 API Server starting on port %s", port)
	log.Printf("🔐 Google OAuth configured with fallback database")
	log.Printf("🗄️  Database initialized")

	// Debug in-memory data
	database.DebugInMemoryData()

	log.Fatal(r.Run(":" + port))
}

func (s *APIServer) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
		"service":   "code-execution-api",
	})
}

func (s *APIServer) databaseStatus(c *gin.Context) {
	status := database.GetDatabaseStatus()
	c.JSON(http.StatusOK, status)
}

func (s *APIServer) getSupportedLanguages(c *gin.Context) {
	languages := s.registry.GetSupportedLanguages()
	c.JSON(http.StatusOK, gin.H{
		"languages": languages,
	})
}

func (s *APIServer) executeCode(c *gin.Context) {
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

	// Get user ID from auth context if available
	if userID, exists := c.Get("user_id"); exists {
		req.UserID = userID.(string)
	}

	// Validate language
	if _, err := s.registry.GetLanguage(req.Language); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "Unsupported language",
			"language": req.Language,
		})
		return
	}

	// Create execution job
	job := &models.ExecutionRequest{
		ID:       uuid.New().String(),
		Code:     req.Code,
		Language: req.Language,
		UserID:   req.UserID,
		Status:   "pending",
		Created:  time.Now(),
	}

	// Push to queue
	if err := s.queue.Push(job); err != nil {
		log.Printf("Error pushing job to queue: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to queue execution",
		})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"job_id":  job.ID,
		"status":  "queued",
		"message": "Code execution queued successfully",
	})
}

func (s *APIServer) handleWebSocket(c *gin.Context) {
	jobID := c.Param("jobId")

	conn, err := s.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	// Subscribe to job results
	pubsub := s.queue.SubscribeToResult(jobID)
	defer pubsub.Close()

	// Send initial status
	conn.WriteJSON(models.WebSocketMessage{
		Type:    "status",
		Content: "Connected, waiting for results...",
		JobID:   jobID,
	})

	// Listen for results
	ch := pubsub.Channel()
	for msg := range ch {
		var result models.ExecutionResult
		if err := json.Unmarshal([]byte(msg.Payload), &result); err != nil {
			log.Printf("Error unmarshaling result: %v", err)
			continue
		}

		// Send result via WebSocket
		wsMsg := models.WebSocketMessage{
			Type:    "complete",
			Content: result,
			JobID:   jobID,
		}

		if err := conn.WriteJSON(wsMsg); err != nil {
			log.Printf("Error writing WebSocket message: %v", err)
			break
		}

		// Close connection after sending result
		break
	}
}

func (s *APIServer) getResult(c *gin.Context) {
	jobID := c.Param("jobId")

	// First, try to get the result directly from Redis storage
	result, err := s.queue.GetResult(jobID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve result",
		})
		return
	}

	if result != nil {
		// Result is ready
		c.JSON(http.StatusOK, result)
		return
	}

	// Result not ready yet, wait for it with pub/sub
	pubsub := s.queue.SubscribeToResult(jobID)
	defer pubsub.Close()

	// Wait for result with timeout
	select {
	case msg := <-pubsub.Channel():
		var result models.ExecutionResult
		if err := json.Unmarshal([]byte(msg.Payload), &result); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to parse result",
			})
			return
		}
		c.JSON(http.StatusOK, result)
	case <-time.After(30 * time.Second): // Reduced timeout since execution is fast
		c.JSON(http.StatusRequestTimeout, gin.H{
			"error":  "Execution timeout",
			"job_id": jobID,
		})
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func loadEnvFile() error {
	// Simple .env file loader
	file, err := os.Open(".env.local")
	if err != nil {
		return err
	}
	defer file.Close()

	// Read file content and set environment variables
	// This is a simple implementation - in production, use a proper .env library
	return nil
}
