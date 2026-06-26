package project

import (
	"net/http"
	"strconv"
	"time"

	"code-execution-engine/internal/database"
	"code-execution-engine/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CreateProjectHandler creates a new project
func CreateProjectHandler(c *gin.Context) {
	// Check authentication
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	var req models.ProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get user info
	userName, _ := c.Get("name")

	// Create project
	project := &models.Project{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Language:    req.Language,
		OwnerID:     userID.(string),
		OwnerName:   userName.(string),
		IsPublic:    req.IsPublic,
		Tags:        req.Tags,
		Files:       []models.ProjectFile{}, // Start with empty files
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		LastOpenAt:  time.Now(),
	}

	// Add default main file based on language
	mainFile := createDefaultMainFile(req.Language)
	project.Files = append(project.Files, mainFile)
	project.MainFile = mainFile.ID

	// Save to database
	if err := database.CreateProject(project); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create project",
		})
		return
	}

	c.JSON(http.StatusCreated, models.ProjectResponse{
		Success: true,
		Project: *project,
		Message: "Project created successfully",
	})
}

// CreateProjectFromTemplateHandler creates a project from a template
func CreateProjectFromTemplateHandler(c *gin.Context) {
	// Check authentication
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	templateID := c.Param("templateId")
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format",
		})
		return
	}

	// Find template
	templates := models.GetDefaultTemplates()
	var selectedTemplate *models.ProjectTemplate
	for _, template := range templates {
		if template.ID == templateID {
			selectedTemplate = &template
			break
		}
	}

	if selectedTemplate == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Template not found",
		})
		return
	}

	// Get user info
	userName, _ := c.Get("name")

	// Create project from template
	project := &models.Project{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Language:    selectedTemplate.Language,
		OwnerID:     userID.(string),
		OwnerName:   userName.(string),
		IsPublic:    false, // Default to private
		Tags:        selectedTemplate.Tags,
		Files:       make([]models.ProjectFile, len(selectedTemplate.Files)),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		LastOpenAt:  time.Now(),
	}

	// Copy files from template
	for i, templateFile := range selectedTemplate.Files {
		project.Files[i] = models.ProjectFile{
			ID:        templateFile.ID,
			Name:      templateFile.Name,
			Path:      templateFile.Path,
			Content:   templateFile.Content,
			Language:  templateFile.Language,
			Size:      int64(len(templateFile.Content)),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
	}

	// Set main file
	if len(project.Files) > 0 {
		project.MainFile = project.Files[0].ID
	}

	// Save to database
	if err := database.CreateProject(project); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create project",
		})
		return
	}

	c.JSON(http.StatusCreated, models.ProjectResponse{
		Success: true,
		Project: *project,
		Message: "Project created from template successfully",
	})
}

// GetProjectHandler retrieves a project by ID
func GetProjectHandler(c *gin.Context) {
	projectID := c.Param("projectId")

	project, err := database.GetProjectByID(projectID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Project not found",
		})
		return
	}

	// Check if user has access (owner or public project)
	userID, authenticated := c.Get("user_id")
	if !project.IsPublic && (!authenticated || userID.(string) != project.OwnerID) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "Access denied",
		})
		return
	}

	// Update last open time if user is owner
	if authenticated && userID.(string) == project.OwnerID {
		project.LastOpenAt = time.Now()
		database.UpdateProject(project)
	}

	c.JSON(http.StatusOK, models.ProjectResponse{
		Success: true,
		Project: *project,
		Message: "Project retrieved successfully",
	})
}

// GetUserProjectsHandler retrieves all projects for a user
func GetUserProjectsHandler(c *gin.Context) {
	// Check authentication
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	projects, total, err := database.GetUserProjects(userID.(string), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to retrieve projects",
		})
		return
	}

	c.JSON(http.StatusOK, models.ProjectListResponse{
		Success:  true,
		Projects: projects,
		Total:    total,
		Page:     page,
		Limit:    limit,
	})
}

// UpdateProjectHandler updates a project
func UpdateProjectHandler(c *gin.Context) {
	projectID := c.Param("projectId")

	// Check authentication
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	// Get existing project
	project, err := database.GetProjectByID(projectID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Project not found",
		})
		return
	}

	// Check ownership
	if project.OwnerID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "Access denied",
		})
		return
	}

	var req models.ProjectUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Update project fields
	project.Name = req.Name
	project.Description = req.Description
	project.IsPublic = req.IsPublic
	project.Tags = req.Tags
	project.UpdatedAt = time.Now()

	// Update files if provided
	if req.Files != nil {
		// Update file sizes and timestamps
		for i := range req.Files {
			req.Files[i].Size = int64(len(req.Files[i].Content))
			req.Files[i].UpdatedAt = time.Now()
			// Keep original created_at if it exists, otherwise set it now
			if req.Files[i].CreatedAt.IsZero() {
				req.Files[i].CreatedAt = time.Now()
			}
		}
		project.Files = req.Files
	}

	if err := database.UpdateProject(project); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update project",
		})
		return
	}

	c.JSON(http.StatusOK, models.ProjectResponse{
		Success: true,
		Project: *project,
		Message: "Project updated successfully",
	})
}

// DeleteProjectHandler deletes a project
func DeleteProjectHandler(c *gin.Context) {
	projectID := c.Param("projectId")

	// Check authentication
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	if err := database.DeleteProject(projectID, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete project",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Project deleted successfully",
	})
}

// GetTemplatesHandler returns available project templates
func GetTemplatesHandler(c *gin.Context) {
	templates := models.GetDefaultTemplates()

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"templates": templates,
	})
}

// createDefaultMainFile creates a default main file for a language
func createDefaultMainFile(language string) models.ProjectFile {
	now := time.Now()

	switch language {
	case "python":
		return models.ProjectFile{
			ID:        "main",
			Name:      "main.py",
			Path:      "main.py",
			Content:   "",
			Language:  "python",
			Size:      0,
			CreatedAt: now,
			UpdatedAt: now,
		}
	case "javascript":
		return models.ProjectFile{
			ID:        "main",
			Name:      "main.js",
			Path:      "main.js",
			Content:   "",
			Language:  "javascript",
			Size:      0,
			CreatedAt: now,
			UpdatedAt: now,
		}
	case "cpp":
		return models.ProjectFile{
			ID:        "main",
			Name:      "main.cpp",
			Path:      "main.cpp",
			Content:   "",
			Language:  "cpp",
			Size:      0,
			CreatedAt: now,
			UpdatedAt: now,
		}
	case "java":
		return models.ProjectFile{
			ID:        "main",
			Name:      "Main.java",
			Path:      "Main.java",
			Content:   "",
			Language:  "java",
			Size:      0,
			CreatedAt: now,
			UpdatedAt: now,
		}
	default:
		return models.ProjectFile{
			ID:        "main",
			Name:      "main.txt",
			Path:      "main.txt",
			Content:   "",
			Language:  "plaintext",
			Size:      0,
			CreatedAt: now,
			UpdatedAt: now,
		}
	}
}
