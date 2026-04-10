package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CodeShare represents a shared code snippet
type CodeShare struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ShareID     string             `bson:"share_id" json:"share_id"`                           // Unique shareable ID (e.g., "abc123")
	Title       string             `bson:"title" json:"title"`                                 // Optional title for the share
	Code        string             `bson:"code" json:"code"`                                   // The actual code
	Language    string             `bson:"language" json:"language"`                           // Programming language
	Description string             `bson:"description,omitempty" json:"description,omitempty"` // Optional description

	// Author information
	AuthorID    string `bson:"author_id,omitempty" json:"author_id,omitempty"`       // User ID (empty for anonymous)
	AuthorName  string `bson:"author_name,omitempty" json:"author_name,omitempty"`   // Display name
	AuthorEmail string `bson:"author_email,omitempty" json:"author_email,omitempty"` // Email (for attribution)

	// Execution result (optional)
	HasResult bool             `bson:"has_result" json:"has_result"`
	Result    *ExecutionResult `bson:"result,omitempty" json:"result,omitempty"`

	// Metadata
	IsPublic  bool       `bson:"is_public" json:"is_public"`   // Public or private share
	ViewCount int64      `bson:"view_count" json:"view_count"` // Number of views
	CreatedAt time.Time  `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time  `bson:"updated_at" json:"updated_at"`
	ExpiresAt *time.Time `bson:"expires_at,omitempty" json:"expires_at,omitempty"` // Optional expiration

	// Tags and categories
	Tags     []string `bson:"tags,omitempty" json:"tags,omitempty"`
	Category string   `bson:"category,omitempty" json:"category,omitempty"`
}

// ProjectShare represents a shared project with multiple files
type ProjectShare struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ShareID     string             `bson:"share_id" json:"share_id"`                           // Unique shareable ID
	Title       string             `bson:"title" json:"title"`                                 // Project title
	Description string             `bson:"description,omitempty" json:"description,omitempty"` // Project description
	Language    string             `bson:"language" json:"language"`                           // Primary language

	// Project files
	Files    []ProjectFile `bson:"files" json:"files"`                             // All project files
	MainFile string        `bson:"main_file,omitempty" json:"main_file,omitempty"` // Entry point file ID

	// Author information
	AuthorID    string `bson:"author_id,omitempty" json:"author_id,omitempty"`
	AuthorName  string `bson:"author_name,omitempty" json:"author_name,omitempty"`
	AuthorEmail string `bson:"author_email,omitempty" json:"author_email,omitempty"`

	// Original project reference
	OriginalProjectID string `bson:"original_project_id,omitempty" json:"original_project_id,omitempty"`

	// Metadata
	IsPublic  bool       `bson:"is_public" json:"is_public"`
	ViewCount int64      `bson:"view_count" json:"view_count"`
	CreatedAt time.Time  `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time  `bson:"updated_at" json:"updated_at"`
	ExpiresAt *time.Time `bson:"expires_at,omitempty" json:"expires_at,omitempty"`

	// Tags and categories
	Tags     []string `bson:"tags,omitempty" json:"tags,omitempty"`
	Category string   `bson:"category,omitempty" json:"category,omitempty"`
}

// ShareRequest represents a request to create a share
type ShareRequest struct {
	Title         string   `json:"title,omitempty"`
	Code          string   `json:"code" binding:"required"`
	Language      string   `json:"language" binding:"required"`
	Description   string   `json:"description,omitempty"`
	IsPublic      bool     `json:"is_public"`
	Tags          []string `json:"tags,omitempty"`
	Category      string   `json:"category,omitempty"`
	IncludeResult bool     `json:"include_result,omitempty"` // Whether to include execution result
}

// ProjectShareRequest represents a request to share a project
type ProjectShareRequest struct {
	ProjectID   string   `json:"project_id" binding:"required"`
	Title       string   `json:"title,omitempty"`
	Description string   `json:"description,omitempty"`
	IsPublic    bool     `json:"is_public"`
	Tags        []string `json:"tags,omitempty"`
	Category    string   `json:"category,omitempty"`
}

// ShareResponse represents the response when creating a share
type ShareResponse struct {
	Success   bool      `json:"success"`
	ShareID   string    `json:"share_id"`
	ShareURL  string    `json:"share_url"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

// ShareListResponse represents a list of shares for a user
type ShareListResponse struct {
	Success bool        `json:"success"`
	Shares  []CodeShare `json:"shares"`
	Total   int64       `json:"total"`
	Page    int         `json:"page"`
	Limit   int         `json:"limit"`
}
