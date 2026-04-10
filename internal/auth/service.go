package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"code-execution-engine/internal/database"
	"code-execution-engine/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var (
	jwtSecret    = []byte(os.Getenv("JWT_SECRET"))
	googleConfig *oauth2.Config
)

// InitAuth initializes the authentication service
func InitAuth() {
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("your-super-secret-jwt-key-change-in-production")
	}

	googleConfig = &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  "http://localhost:8080/auth/google/callback",
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

// GenerateState generates a random state for OAuth
func GenerateState() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// GetGoogleAuthURL returns the Google OAuth URL
func GetGoogleAuthURL(state string) string {
	return googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

// ExchangeCodeForToken exchanges the OAuth code for user info
func ExchangeCodeForToken(code string) (*models.GoogleUserInfo, error) {
	token, err := googleConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %v", err)
	}

	// Get user info from Google
	client := googleConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var userInfo models.GoogleUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, fmt.Errorf("failed to parse user info: %v", err)
	}

	return &userInfo, nil
}

// CreateOrUpdateUser creates a new user or updates existing user
func CreateOrUpdateUser(googleUser *models.GoogleUserInfo) (*models.User, error) {
	// Check if user exists
	existingUser, err := database.GetUserByGoogleID(googleUser.ID)

	now := time.Now()

	if err != nil {
		// Create new user
		username := generateUsername(googleUser.Email)

		newUser := &models.User{
			ID:              primitive.NewObjectID(),
			GoogleID:        googleUser.ID,
			Email:           googleUser.Email,
			Name:            googleUser.Name,
			Picture:         googleUser.Picture,
			Username:        username,
			Bio:             "",
			CreatedAt:       now,
			UpdatedAt:       now,
			LastLoginAt:     now,
			TotalExecutions: 0,
			TotalShares:     0,
		}

		err := database.CreateUser(newUser)
		if err != nil {
			return nil, fmt.Errorf("failed to create user: %v", err)
		}

		return newUser, nil
	}

	// Update existing user
	existingUser.Name = googleUser.Name
	existingUser.Picture = googleUser.Picture
	existingUser.UpdatedAt = now
	existingUser.LastLoginAt = now

	err = database.UpdateUser(existingUser)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %v", err)
	}

	return existingUser, nil
}

// generateUsername creates a unique username from email
func generateUsername(email string) string {
	parts := strings.Split(email, "@")
	baseUsername := parts[0]

	// Remove special characters
	username := strings.ReplaceAll(baseUsername, ".", "")
	username = strings.ReplaceAll(username, "+", "")
	username = strings.ReplaceAll(username, "-", "")

	// Add random suffix to ensure uniqueness
	suffix := uuid.New().String()[:8]
	return username + "_" + suffix
}

// GenerateJWT generates a JWT token for the user
func GenerateJWT(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID.Hex(),
		"email":    user.Email,
		"username": user.Username,
		"name":     user.Name,
		"picture":  user.Picture,
		"iat":      time.Now().Unix(),
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // 24 hours
		"iss":      "coderunner",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// GenerateRefreshToken generates a refresh token
func GenerateRefreshToken() string {
	return uuid.New().String()
}

// CreateSession creates a new user session
func CreateSession(userID primitive.ObjectID, refreshToken, ipAddress, userAgent string) error {
	session := &models.UserSession{
		ID:           primitive.NewObjectID(),
		UserID:       userID,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(time.Hour * 24 * 30), // 30 days
		CreatedAt:    time.Now(),
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}

	return database.CreateSession(session)
}

// ValidateJWT validates a JWT token
func ValidateJWT(tokenString string) (*jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return &claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// GetUserByID retrieves a user by ID
func GetUserByID(userID string) (*models.User, error) {
	return database.GetUserByID(userID)
}
