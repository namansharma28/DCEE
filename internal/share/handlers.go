package share

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strconv"
	"time"

	"code-execution-engine/internal/database"
	"code-execution-engine/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CreateShareHandler creates a new code share
func CreateShareHandler(c *gin.Context) {
	var req models.ShareRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Generate unique share ID
	shareID := generateShareID()

	// Get user info from context (if authenticated)
	var authorID, authorName, authorEmail string
	if userID, exists := c.Get("user_id"); exists {
		authorID = userID.(string)
		if name, exists := c.Get("name"); exists {
			authorName = name.(string)
		}
		if email, exists := c.Get("email"); exists {
			authorEmail = email.(string)
		}
	}

	// Create share object
	share := &models.CodeShare{
		ID:          primitive.NewObjectID(),
		ShareID:     shareID,
		Title:       req.Title,
		Code:        req.Code,
		Language:    req.Language,
		Description: req.Description,
		AuthorID:    authorID,
		AuthorName:  authorName,
		AuthorEmail: authorEmail,
		IsPublic:    req.IsPublic,
		ViewCount:   0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Tags:        req.Tags,
		Category:    req.Category,
	}

	// Save to database
	if err := database.CreateShare(share); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create share",
			"message": "Could not save code share to database",
		})
		return
	}

	// Return success response
	shareURL := "/share/" + shareID
	c.JSON(http.StatusCreated, models.ShareResponse{
		Success:   true,
		ShareID:   shareID,
		ShareURL:  shareURL,
		Message:   "Code shared successfully",
		CreatedAt: share.CreatedAt,
	})
}

// GetShareHandler retrieves a shared code snippet or project
func GetShareHandler(c *gin.Context) {
	shareID := c.Param("shareId")
	if shareID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Share ID is required",
		})
		return
	}

	// Try to get as project share first
	projectShare, err := database.GetProjectShareByID(shareID)
	if err == nil {
		// Return project share data
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"share":   projectShare,
			"type":    "project",
		})
		return
	}

	// If not found as project share, try as code share
	share, err := database.GetShareByID(shareID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Share not found",
			"message": "The requested share does not exist or has been removed",
		})
		return
	}

	// Update view count (async, don't wait for result)
	go database.UpdateShareViewCount(shareID)

	// Return share data
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"share":   share,
		"type":    "code",
	})
}

// GetUserSharesHandler retrieves all shares for a user
func GetUserSharesHandler(c *gin.Context) {
	// Check authentication
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Get user shares
	shares, total, err := database.GetUserShares(userID.(string), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to retrieve shares",
		})
		return
	}

	// Return shares list
	c.JSON(http.StatusOK, models.ShareListResponse{
		Success: true,
		Shares:  shares,
		Total:   total,
		Page:    page,
		Limit:   limit,
	})
}

// generateShareID creates a unique shareable ID
func generateShareID() string {
	// Generate 6 random bytes (12 hex characters)
	bytes := make([]byte, 6)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// CreateProjectShareHandler creates a new project share
func CreateProjectShareHandler(c *gin.Context) {
	// Check authentication
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	var req models.ProjectShareRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get the project
	project, err := database.GetProjectByID(req.ProjectID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Project not found",
		})
		return
	}

	// Check if user owns the project
	if project.OwnerID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "Access denied",
		})
		return
	}

	// Get user info
	userName, _ := c.Get("name")
	userEmail, _ := c.Get("email")

	// Generate unique share ID
	shareID := generateShareID()
	if shareID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to generate share ID",
		})
		return
	}

	// Create project share
	projectShare := &models.ProjectShare{
		ID:                primitive.NewObjectID(),
		ShareID:           shareID,
		Title:             req.Title,
		Description:       req.Description,
		Language:          project.Language,
		Files:             project.Files,
		MainFile:          project.MainFile,
		AuthorID:          userID.(string),
		AuthorName:        userName.(string),
		AuthorEmail:       userEmail.(string),
		OriginalProjectID: req.ProjectID,
		IsPublic:          req.IsPublic,
		ViewCount:         0,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
		Tags:              req.Tags,
		Category:          req.Category,
	}

	// Use title from request or project name
	if projectShare.Title == "" {
		projectShare.Title = project.Name
	}

	// Use description from request or project description
	if projectShare.Description == "" {
		projectShare.Description = project.Description
	}

	// Save to database
	if err := database.CreateProjectShare(projectShare); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create project share",
		})
		return
	}

	// Update user stats (if function exists)
	// database.IncrementUserShares(userID.(string))

	c.JSON(http.StatusCreated, models.ShareResponse{
		Success:   true,
		ShareID:   shareID,
		ShareURL:  "/share/" + shareID,
		Message:   "Project shared successfully",
		CreatedAt: projectShare.CreatedAt,
	})
}
