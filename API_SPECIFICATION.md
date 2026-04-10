# 📡 CodeRunner API Specification v2.0

## 🎯 Overview

Complete API specification for CodeRunner platform including authentication, code sharing, and user management.

## 🔐 Authentication APIs

### Base URL: `/auth`

#### 1. User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "email_verified": false,
    "created_at": "2026-04-07T20:00:00Z"
  }
}
```

**Error Responses:**
```json
// 400 Bad Request - Validation Error
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "username": ["Username must be 3-50 characters"],
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  }
}

// 409 Conflict - User Exists
{
  "success": false,
  "error": "User already exists",
  "message": "Username or email already registered"
}
```

#### 2. User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "tokens": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
    "expires_in": 3600
  },
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://cdn.coderunner.io/avatars/johndoe.jpg",
    "email_verified": true
  }
}
```

#### 3. Token Refresh
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "tokens": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

#### 4. User Profile
```http
GET /auth/profile
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "bio": "Full-stack developer passionate about clean code",
    "avatar_url": "https://cdn.coderunner.io/avatars/johndoe.jpg",
    "email_verified": true,
    "created_at": "2026-04-07T20:00:00Z",
    "stats": {
      "codes_executed": 1250,
      "codes_shared": 45,
      "total_runtime": "2h 30m"
    }
  }
}
```

#### 5. Update Profile
```http
PUT /auth/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "full_name": "John Smith",
  "bio": "Senior developer at TechCorp",
  "avatar_url": "https://cdn.coderunner.io/avatars/new-avatar.jpg"
}
```

#### 6. Password Management
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePass123!"
}
```

```http
PUT /auth/change-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "current_password": "SecurePass123!",
  "new_password": "NewSecurePass123!"
}
```

## 🔗 Code Sharing APIs

### Base URL: `/share`

#### 1. Create Shareable Code
```http
POST /share/create
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Fibonacci Calculator",
  "description": "Efficient fibonacci implementation with memoization",
  "code": "def fibonacci(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fibonacci(n-1, memo) + fibonacci(n-2, memo)\n    return memo[n]\n\nprint(fibonacci(10))",
  "language": "python",
  "visibility": "public",
  "tags": ["algorithm", "recursion", "memoization"],
  "expires_at": null
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Code shared successfully",
  "share": {
    "id": "abc123def456",
    "title": "Fibonacci Calculator",
    "description": "Efficient fibonacci implementation with memoization",
    "language": "python",
    "visibility": "public",
    "tags": ["algorithm", "recursion", "memoization"],
    "url": "https://coderunner.io/share/abc123def456",
    "short_url": "https://cr.io/abc123",
    "created_at": "2026-04-07T20:00:00Z",
    "expires_at": null,
    "author": {
      "username": "johndoe",
      "avatar_url": "https://cdn.coderunner.io/avatars/johndoe.jpg"
    }
  }
}
```

#### 2. Get Shared Code
```http
GET /share/{share_id}
```

**Response (200 OK):**
```json
{
  "success": true,
  "share": {
    "id": "abc123def456",
    "title": "Fibonacci Calculator",
    "description": "Efficient fibonacci implementation with memoization",
    "code": "def fibonacci(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fibonacci(n-1, memo) + fibonacci(n-2, memo)\n    return memo[n]\n\nprint(fibonacci(10))",
    "language": "python",
    "visibility": "public",
    "tags": ["algorithm", "recursion", "memoization"],
    "created_at": "2026-04-07T20:00:00Z",
    "updated_at": "2026-04-07T20:00:00Z",
    "view_count": 1250,
    "like_count": 45,
    "fork_count": 12,
    "author": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "full_name": "John Doe",
      "avatar_url": "https://cdn.coderunner.io/avatars/johndoe.jpg"
    },
    "is_liked": false,
    "is_forked": false,
    "original_share": null
  }
}
```

#### 3. Fork Shared Code
```http
POST /share/{share_id}/fork
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Modified Fibonacci Calculator",
  "description": "Added input validation and error handling"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Code forked successfully",
  "fork": {
    "id": "def456ghi789",
    "title": "Modified Fibonacci Calculator",
    "original_share_id": "abc123def456",
    "url": "https://coderunner.io/share/def456ghi789"
  }
}
```

#### 4. Like/Unlike Code
```http
POST /share/{share_id}/like
Authorization: Bearer {access_token}
```

```http
DELETE /share/{share_id}/like
Authorization: Bearer {access_token}
```

#### 5. Public Gallery
```http
GET /share/public?page=1&limit=20&language=python&sort=popular&tags=algorithm
```

**Response (200 OK):**
```json
{
  "success": true,
  "shares": [
    {
      "id": "abc123def456",
      "title": "Fibonacci Calculator",
      "description": "Efficient fibonacci implementation...",
      "language": "python",
      "tags": ["algorithm", "recursion"],
      "created_at": "2026-04-07T20:00:00Z",
      "view_count": 1250,
      "like_count": 45,
      "fork_count": 12,
      "author": {
        "username": "johndoe",
        "avatar_url": "https://cdn.coderunner.io/avatars/johndoe.jpg"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "filters": {
    "language": "python",
    "sort": "popular",
    "tags": ["algorithm"]
  }
}
```

#### 6. User's Shares
```http
GET /share/my-shares?page=1&limit=10
Authorization: Bearer {access_token}
```

```http
GET /share/my-forks?page=1&limit=10
Authorization: Bearer {access_token}
```

```http
GET /share/my-likes?page=1&limit=10
Authorization: Bearer {access_token}
```

## 🚀 Enhanced Execution APIs

### Base URL: `/execute`

#### 1. Execute Code (Authenticated)
```http
POST /execute
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "code": "print('Hello, authenticated world!')",
  "language": "python",
  "save_to_history": true,
  "share_id": null
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Code execution queued successfully",
  "estimated_wait_time": "2s"
}
```

#### 2. Execution History
```http
GET /execute/history?page=1&limit=20&language=python
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "executions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "print('Hello, world!')",
      "language": "python",
      "output": "Hello, world!\n",
      "status": "success",
      "execution_time": 1250000000,
      "created_at": "2026-04-07T20:00:00Z",
      "share_id": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "total_pages": 63
  }
}
```

#### 3. Execution Statistics
```http
GET /execute/stats
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "total_executions": 1250,
    "successful_executions": 1180,
    "failed_executions": 70,
    "success_rate": 94.4,
    "total_runtime_ms": 9000000,
    "avg_execution_time_ms": 7200,
    "languages_used": {
      "python": 650,
      "javascript": 300,
      "cpp": 200,
      "java": 100
    },
    "executions_by_day": [
      {"date": "2026-04-07", "count": 25},
      {"date": "2026-04-06", "count": 30}
    ]
  }
}
```

## 🤝 Collaboration APIs

### Base URL: `/collaborate`

#### 1. Create Collaboration Session
```http
POST /collaborate/create
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Pair Programming Session",
  "code": "// Let's build something together",
  "language": "javascript",
  "max_participants": 5,
  "permissions": {
    "can_edit": true,
    "can_execute": true,
    "can_invite": false
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "session": {
    "id": "collab-550e8400-e29b-41d4",
    "title": "Pair Programming Session",
    "url": "https://coderunner.io/collaborate/collab-550e8400-e29b-41d4",
    "owner": {
      "username": "johndoe",
      "avatar_url": "https://cdn.coderunner.io/avatars/johndoe.jpg"
    },
    "created_at": "2026-04-07T20:00:00Z"
  }
}
```

#### 2. Join Collaboration Session
```http
POST /collaborate/{session_id}/join
Authorization: Bearer {access_token}
```

#### 3. WebSocket for Real-time Collaboration
```javascript
// WebSocket connection for real-time editing
const ws = new WebSocket('wss://api.coderunner.io/collaborate/{session_id}/ws?token={access_token}');

// Message types:
// 1. Operation (text changes)
{
  "type": "operation",
  "operation": {
    "type": "insert",
    "position": 10,
    "content": "Hello",
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}

// 2. Cursor position
{
  "type": "cursor",
  "position": 25,
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}

// 3. User joined/left
{
  "type": "user_joined",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "avatar_url": "https://cdn.coderunner.io/avatars/johndoe.jpg"
  }
}

// 4. Code execution
{
  "type": "execution",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 🔍 Search & Discovery APIs

### Base URL: `/search`

#### 1. Global Search
```http
GET /search?q=fibonacci&type=shares&language=python&sort=relevance
```

**Response (200 OK):**
```json
{
  "success": true,
  "results": {
    "shares": [
      {
        "id": "abc123def456",
        "title": "Fibonacci Calculator",
        "description": "Efficient fibonacci implementation...",
        "language": "python",
        "author": {
          "username": "johndoe",
          "avatar_url": "https://cdn.coderunner.io/avatars/johndoe.jpg"
        },
        "relevance_score": 0.95
      }
    ],
    "users": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "fibonacci_master",
        "full_name": "Alice Johnson",
        "avatar_url": "https://cdn.coderunner.io/avatars/alice.jpg",
        "bio": "Algorithm enthusiast specializing in fibonacci sequences"
      }
    ]
  },
  "total_results": 25,
  "search_time_ms": 45
}
```

## 📊 Analytics APIs

### Base URL: `/analytics`

#### 1. Platform Statistics
```http
GET /analytics/platform
Authorization: Bearer {admin_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "total_users": 10000,
    "active_users_24h": 1500,
    "total_executions": 500000,
    "executions_24h": 5000,
    "total_shares": 25000,
    "shares_24h": 150,
    "popular_languages": {
      "python": 45.2,
      "javascript": 28.7,
      "cpp": 15.1,
      "java": 11.0
    },
    "server_stats": {
      "avg_response_time_ms": 120,
      "success_rate": 99.5,
      "active_workers": 15,
      "queue_length": 5
    }
  }
}
```

## 🔧 Admin APIs

### Base URL: `/admin`

#### 1. User Management
```http
GET /admin/users?page=1&limit=50&status=active
Authorization: Bearer {admin_token}
```

```http
PUT /admin/users/{user_id}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "suspended",
  "reason": "Terms of service violation"
}
```

#### 2. Content Moderation
```http
GET /admin/shares/reported?page=1&limit=20
Authorization: Bearer {admin_token}
```

```http
PUT /admin/shares/{share_id}/moderate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "hide",
  "reason": "Inappropriate content"
}
```

## 🚨 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "error_code",
  "message": "Human readable error message",
  "details": {
    "field": ["Specific validation error"]
  },
  "timestamp": "2026-04-07T20:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `202 Accepted` - Request accepted (async processing)
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## 🔐 Authentication & Authorization

### JWT Token Format
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImpvaG5kb2UiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTY0MDk5ODgwMCwiaXNzIjoiY29kZXJ1bm5lci5pbyIsImF1ZCI6ImNvZGVydW5uZXItYXBpIn0.signature
```

### Rate Limiting
- **Authentication endpoints**: 5 requests per minute per IP
- **Execution endpoints**: 100 requests per hour per user
- **Share creation**: 20 requests per hour per user
- **General API**: 1000 requests per hour per user

### Permissions
- **Public**: Can view public shares, execute code (limited)
- **Authenticated**: Full execution, create shares, collaborate
- **Premium**: Higher rate limits, private shares, advanced features
- **Admin**: User management, content moderation, analytics

This comprehensive API specification provides the foundation for building a full-featured CodeRunner platform with authentication, sharing, and collaboration capabilities. 🚀