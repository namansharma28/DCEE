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
					Content:  "# Welcome to your Python project!\n\ndef main():\n    print(\"Hello, World!\")\n    print(\"This is your new Python project.\")\n\nif __name__ == \"__main__\":\n    main()\n",
					Language: "python",
				},
				{
					ID:       "utils",
					Name:     "utils.py",
					Path:     "utils.py",
					Content:  "# Utility functions for your project\n\ndef greet(name):\n    return f\"Hello, {name}!\"\n\ndef calculate_sum(a, b):\n    return a + b\n",
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
					Content:  "// Welcome to your JavaScript project!\n\nfunction main() {\n    console.log('Hello, World!');\n    console.log('This is your new JavaScript project.');\n    \n    // Example usage\n    const result = calculateSum(5, 3);\n    console.log(`5 + 3 = ${result}`);\n}\n\nfunction calculateSum(a, b) {\n    return a + b;\n}\n\n// Run the main function\nmain();\n",
					Language: "javascript",
				},
				{
					ID:       "utils",
					Name:     "utils.js",
					Path:     "utils.js",
					Content:  "// Utility functions for your project\n\nfunction greet(name) {\n    return `Hello, ${name}!`;\n}\n\nfunction formatDate(date) {\n    return date.toLocaleDateString();\n}\n\nmodule.exports = {\n    greet,\n    formatDate\n};\n",
					Language: "javascript",
				},
			},
			Tags: []string{"javascript", "beginner", "app"},
		},
		{
			ID:          "cpp-program",
			Name:        "C++ Program",
			Description: "Basic C++ project with header files",
			Language:    "cpp",
			Files: []ProjectFile{
				{
					ID:       "main",
					Name:     "main.cpp",
					Path:     "main.cpp",
					Content:  "#include <iostream>\n#include \"utils.h\"\n\nint main() {\n    std::cout << \"Hello, World!\" << std::endl;\n    std::cout << \"This is your new C++ project.\" << std::endl;\n    \n    // Example usage\n    int result = calculateSum(5, 3);\n    std::cout << \"5 + 3 = \" << result << std::endl;\n    \n    return 0;\n}\n",
					Language: "cpp",
				},
				{
					ID:       "utils_h",
					Name:     "utils.h",
					Path:     "utils.h",
					Content:  "#ifndef UTILS_H\n#define UTILS_H\n\n#include <string>\n\n// Function declarations\nint calculateSum(int a, int b);\nstd::string greet(const std::string& name);\n\n#endif // UTILS_H\n",
					Language: "cpp",
				},
				{
					ID:       "utils_cpp",
					Name:     "utils.cpp",
					Path:     "utils.cpp",
					Content:  "#include \"utils.h\"\n\nint calculateSum(int a, int b) {\n    return a + b;\n}\n\nstd::string greet(const std::string& name) {\n    return \"Hello, \" + name + \"!\";\n}\n",
					Language: "cpp",
				},
			},
			Tags: []string{"cpp", "beginner", "program"},
		},
		{
			ID:          "java-app",
			Name:        "Java Application",
			Description: "Basic Java project with classes",
			Language:    "java",
			Files: []ProjectFile{
				{
					ID:       "main",
					Name:     "Main.java",
					Path:     "Main.java",
					Content:  "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n        System.out.println(\"This is your new Java project.\");\n        \n        // Example usage\n        Utils utils = new Utils();\n        int result = utils.calculateSum(5, 3);\n        System.out.println(\"5 + 3 = \" + result);\n    }\n}\n",
					Language: "java",
				},
				{
					ID:       "utils",
					Name:     "Utils.java",
					Path:     "Utils.java",
					Content:  "public class Utils {\n    \n    public int calculateSum(int a, int b) {\n        return a + b;\n    }\n    \n    public String greet(String name) {\n        return \"Hello, \" + name + \"!\";\n    }\n    \n    public String getCurrentTime() {\n        return java.time.LocalDateTime.now().toString();\n    }\n}\n",
					Language: "java",
				},
			},
			Tags: []string{"java", "beginner", "application"},
		},
	}
}
