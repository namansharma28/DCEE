package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents a user in the system
type User struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	GoogleID    string             `bson:"google_id" json:"google_id"`
	Email       string             `bson:"email" json:"email"`
	Name        string             `bson:"name" json:"name"`
	Picture     string             `bson:"picture" json:"picture"`
	Username    string             `bson:"username" json:"username"`
	Bio         string             `bson:"bio" json:"bio"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
	LastLoginAt time.Time          `bson:"last_login_at" json:"last_login_at"`
	
	// Stats
	TotalExecutions int `bson:"total_executions" json:"total_executions"`
	TotalShares     int `bson:"total_shares" json:"total_shares"`
}

// UserSession represents a user session for JWT refresh tokens
type UserSession struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID       primitive.ObjectID `bson:"user_id" json:"user_id"`
	RefreshToken string             `bson:"refresh_token" json:"refresh_token"`
	ExpiresAt    time.Time          `bson:"expires_at" json:"expires_at"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
	IPAddress    string             `bson:"ip_address" json:"ip_address"`
	UserAgent    string             `bson:"user_agent" json:"user_agent"`
}

// GoogleUserInfo represents the user info from Google OAuth
type GoogleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// JWTClaims represents the JWT token claims
type JWTClaims struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Picture  string `json:"picture"`
}

// LoginResponse represents the response after successful login
type LoginResponse struct {
	Success      bool   `json:"success"`
	Message      string `json:"message"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	User         User   `json:"user"`
}

// AuthError represents authentication errors
type AuthError struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Message string `json:"message"`
}