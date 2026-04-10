package auth

import (
	"encoding/json"
	"net/http"
	"strings"

	"code-execution-engine/internal/models"

	"github.com/gin-gonic/gin"
)

// GoogleLoginHandler initiates Google OAuth login
func GoogleLoginHandler(c *gin.Context) {
	state := GenerateState()

	// Store state in session/cookie for validation
	c.SetCookie("oauth_state", state, 600, "/", "", false, true) // 10 minutes

	authURL := GetGoogleAuthURL(state)

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"auth_url": authURL,
	})
}

// GoogleCallbackHandler handles Google OAuth callback
func GoogleCallbackHandler(c *gin.Context) {
	// Validate state
	storedState, err := c.Cookie("oauth_state")
	if err != nil || storedState != c.Query("state") {
		c.JSON(http.StatusBadRequest, models.AuthError{
			Success: false,
			Error:   "invalid_state",
			Message: "Invalid OAuth state parameter",
		})
		return
	}

	// Clear the state cookie
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	// Exchange code for user info
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, models.AuthError{
			Success: false,
			Error:   "missing_code",
			Message: "Authorization code is missing",
		})
		return
	}

	googleUser, err := ExchangeCodeForToken(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.AuthError{
			Success: false,
			Error:   "oauth_exchange_failed",
			Message: "Failed to exchange authorization code",
		})
		return
	}

	// Create or update user
	user, err := CreateOrUpdateUser(googleUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.AuthError{
			Success: false,
			Error:   "user_creation_failed",
			Message: "Failed to create or update user",
		})
		return
	}

	// Generate JWT token
	accessToken, err := GenerateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.AuthError{
			Success: false,
			Error:   "token_generation_failed",
			Message: "Failed to generate access token",
		})
		return
	}

	// Generate refresh token
	refreshToken := GenerateRefreshToken()

	// Create session
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	err = CreateSession(user.ID, refreshToken, ipAddress, userAgent)
	if err != nil {
		// Log error but don't fail the login
		// In production, you might want to handle this differently
	}

	// Set HTTP-only cookie for refresh token
	c.SetCookie("refresh_token", refreshToken, 30*24*3600, "/", "", false, true) // 30 days

	// Convert user to JSON for the HTML response
	userJSON, err := json.Marshal(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.AuthError{
			Success: false,
			Error:   "json_marshal_failed",
			Message: "Failed to process user data",
		})
		return
	}

	// Return HTML page that handles token storage and redirects to frontend
	htmlResponse := `
<!DOCTYPE html>
<html>
<head>
    <title>Login Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f;
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .spinner {
            border: 3px solid #333;
            border-top: 3px solid #dc2626;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 {
            color: #dc2626;
            margin-bottom: 0.5rem;
        }
        p {
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>Login Successful!</h1>
        <p>Redirecting to your workspace...</p>
    </div>
    <script>
        // Store auth data in localStorage
        const authData = {
            access_token: "` + accessToken + `",
            refresh_token: "` + refreshToken + `",
            user: ` + string(userJSON) + `
        };
        
        localStorage.setItem('access_token', authData.access_token);
        localStorage.setItem('refresh_token', authData.refresh_token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        
        // Redirect to projects after a short delay
        setTimeout(() => {
            window.location.href = '/projects';
        }, 1500);
    </script>
</body>
</html>`

	c.Header("Content-Type", "text/html")
	c.String(http.StatusOK, htmlResponse)
}

// ProfileHandler returns the current user's profile
func ProfileHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.AuthError{
			Success: false,
			Error:   "unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	user, err := GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, models.AuthError{
			Success: false,
			Error:   "user_not_found",
			Message: "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user,
	})
}

// LogoutHandler handles user logout
func LogoutHandler(c *gin.Context) {
	// Clear the refresh token cookie
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)

	// In a more complete implementation, you would:
	// 1. Invalidate the refresh token in the database
	// 2. Add the JWT to a blacklist (if you maintain one)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})
}

// AuthMiddleware validates JWT tokens
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.AuthError{
				Success: false,
				Error:   "missing_token",
				Message: "Authorization header is required",
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, models.AuthError{
				Success: false,
				Error:   "invalid_token_format",
				Message: "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		token := parts[1]
		claims, err := ValidateJWT(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.AuthError{
				Success: false,
				Error:   "invalid_token",
				Message: "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("user_id", (*claims)["user_id"])
		c.Set("email", (*claims)["email"])
		c.Set("username", (*claims)["username"])
		c.Set("name", (*claims)["name"])

		c.Next()
	}
}

// OptionalAuthMiddleware validates JWT tokens but doesn't require them
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		token := parts[1]
		claims, err := ValidateJWT(token)
		if err != nil {
			c.Next()
			return
		}

		// Set user info in context
		c.Set("user_id", (*claims)["user_id"])
		c.Set("email", (*claims)["email"])
		c.Set("username", (*claims)["username"])
		c.Set("name", (*claims)["name"])

		c.Next()
	}
}
