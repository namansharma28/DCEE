package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Project represents a coding project with multiple files
type Project struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	Language    string             `bson:"language" json:"language"`

	// Owner information
	OwnerID   string `bson:"owner_id" json:"owner_id"`
	OwnerName string `bson:"owner_name" json:"owner_name"`

	// Project settings
	IsPublic bool     `bson:"is_public" json:"is_public"`
	Tags     []string `bson:"tags,omitempty" json:"tags,omitempty"`

	// Files in the project
	Files    []ProjectFile `bson:"files" json:"files"`
	MainFile string        `bson:"main_file,omitempty" json:"main_file,omitempty"` // Entry point file

	// Metadata
	CreatedAt  time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time `bson:"updated_at" json:"updated_at"`
	LastOpenAt time.Time `bson:"last_open_at" json:"last_open_at"`

	// Stats
	ViewCount int64 `bson:"view_count" json:"view_count"`
	StarCount int64 `bson:"star_count" json:"star_count"`
	ForkCount int64 `bson:"fork_count" json:"fork_count"`
}

// ProjectFile represents a single file within a project
type ProjectFile struct {
	ID       string `bson:"id" json:"id"`             // Unique file ID within project
	Name     string `bson:"name" json:"name"`         // File name (e.g., "main.py", "utils.js")
	Path     string `bson:"path" json:"path"`         // File path (e.g., "src/main.py")
	Content  string `bson:"content" json:"content"`   // File content
	Language string `bson:"language" json:"language"` // File language (can differ from project)
	Size     int64  `bson:"size" json:"size"`         // File size in bytes

	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

// ProjectRequest represents a request to create/update a project
type ProjectRequest struct {
	Name        string   `json:"name" binding:"required"`
	Description string   `json:"description,omitempty"`
	Language    string   `json:"language" binding:"required"`
	IsPublic    bool     `json:"is_public"`
	Tags        []string `json:"tags,omitempty"`
}

// ProjectUpdateRequest represents a request to update a project with files
type ProjectUpdateRequest struct {
	Name        string        `json:"name" binding:"required"`
	Description string        `json:"description,omitempty"`
	IsPublic    bool          `json:"is_public"`
	Tags        []string      `json:"tags,omitempty"`
	Files       []ProjectFile `json:"files,omitempty"`
}

// ProjectResponse represents the response when creating/updating a project
type ProjectResponse struct {
	Success bool    `json:"success"`
	Project Project `json:"project"`
	Message string  `json:"message"`
}

// ProjectListResponse represents a list of projects
type ProjectListResponse struct {
	Success  bool      `json:"success"`
	Projects []Project `json:"projects"`
	Total    int64     `json:"total"`
	Page     int       `json:"page"`
	Limit    int       `json:"limit"`
}

// FileRequest represents a request to create/update a file
type FileRequest struct {
	Name     string `json:"name" binding:"required"`
	Path     string `json:"path,omitempty"`
	Content  string `json:"content"`
	Language string `json:"language,omitempty"`
}

// FileResponse represents the response when creating/updating a file
type FileResponse struct {
	Success bool        `json:"success"`
	File    ProjectFile `json:"file"`
	Message string      `json:"message"`
}

// ProjectTemplate represents a project template
type ProjectTemplate struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Language    string        `json:"language"`
	Files       []ProjectFile `json:"files"`
	Tags        []string      `json:"tags"`
}

// GetDefaultTemplates returns default project templates
func GetDefaultTemplates() []ProjectTemplate {
	return []ProjectTemplate{
		{
			ID:          "python-hello",
			Name:        "Python Hello World",
			Description: "Simple Python project with main.py",
			Language:    "python",
			Files: []ProjectFile{
				{
					ID:       "main",
					Name:     "main.py",
					Path:     "main.py",
					Content:  "",
					Language: "python",
				},
			},
			Tags: []string{"python", "beginner", "hello-world"},
		},
		{
			ID:          "javascript-app",
			Name:        "JavaScript Application",
			Description: "Basic JavaScript project structure",
			Language:    "javascript",
			Files: []ProjectFile{
				{
					ID:       "main",
					Name:     "main.js",
					Path:     "main.js",
					Content:  "",
					Language: "javascript",
				},
			},
			Tags: []string{"javascript", "beginner", "app"},
		},
		{
			ID:          "cpp-program",
			Name:        "C++ Program",
			Description: "Basic C++ project with main file",
			Language:    "cpp",
			Files: []ProjectFile{
				{
					ID:       "main",
					Name:     "main.cpp",
					Path:     "main.cpp",
					Content:  "",
					Language: "cpp",
				},
			},
			Tags: []string{"cpp", "beginner", "program"},
		},
		{
			ID:          "java-app",
			Name:        "Java Application",
			Description: "Basic Java project with Main class",
			Language:    "java",
			Files: []ProjectFile{
				{
					ID:       "main",
					Name:     "Main.java",
					Path:     "Main.java",
					Content:  "",
					Language: "java",
				},
			},
			Tags: []string{"java", "beginner", "application"},
		},
	}
}
