# 🛠️ Technology Stack & Integration Guide

## 🎯 Complete Technology Stack

### Backend Technologies

#### Core Framework & Language
```go
// Go 1.21+ with key packages
"github.com/gin-gonic/gin"           // HTTP framework
"github.com/golang-jwt/jwt/v5"       // JWT authentication
"golang.org/x/crypto/bcrypt"         // Password hashing
"github.com/google/uuid"             // UUID generation
"github.com/go-playground/validator/v10" // Input validation
```

#### Database & ORM
```go
// PostgreSQL with GORM
"gorm.io/gorm"                       // ORM framework
"gorm.io/driver/postgres"            // PostgreSQL driver
"github.com/lib/pq"                  // Pure Go PostgreSQL driver

// Redis for caching & queues
"github.com/redis/go-redis/v9"       // Redis client
```

#### Authentication & Security
```go
// JWT & Security
"github.com/golang-jwt/jwt/v5"       // JWT tokens
"golang.org/x/crypto/bcrypt"         // Password hashing
"github.com/gorilla/sessions"        // Session management
"github.com/rs/cors"                 // CORS middleware

// Rate limiting
"golang.org/x/time/rate"             // Rate limiter
"github.com/ulule/limiter/v3"        // Advanced rate limiting
```

#### Email & Communication
```go
// Email services
"github.com/sendgrid/sendgrid-go"    // SendGrid integration
"gopkg.in/gomail.v2"                 // SMTP email
"github.com/aws/aws-sdk-go-v2/service/ses" // AWS SES

// WebSocket for real-time
"github.com/gorilla/websocket"       // WebSocket support
```

#### File Storage & CDN
```go
// AWS S3 integration
"github.com/aws/aws-sdk-go-v2/service/s3"
"github.com/aws/aws-sdk-go-v2/config"

// Image processing
"github.com/disintegration/imaging"  // Image resize/crop
```

### Frontend Technologies

#### React Ecosystem
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@monaco-editor/react": "^4.4.6",
    "axios": "^1.3.0",
    "socket.io-client": "^4.6.0"
  }
}
```

#### State Management
```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^1.9.0",
    "react-redux": "^8.0.0",
    "redux-persist": "^6.0.0"
  }
}
```

#### UI Components & Styling
```json
{
  "dependencies": {
    "@headlessui/react": "^1.7.0",
    "@heroicons/react": "^2.0.0",
    "tailwindcss": "^3.2.0",
    "framer-motion": "^9.0.0",
    "react-hot-toast": "^2.4.0"
  }
}
```

#### Authentication & Forms
```json
{
  "dependencies": {
    "react-hook-form": "^7.43.0",
    "@hookform/resolvers": "^2.9.0",
    "yup": "^1.0.0",
    "js-cookie": "^3.0.0"
  }
}
```

### Infrastructure & DevOps

#### Containerization
```dockerfile
# Multi-stage Docker builds
FROM golang:1.21-alpine AS builder
FROM node:18-alpine AS frontend-builder
FROM alpine:latest AS production
```

#### Cloud Services (AWS)
```yaml
Services:
  - ECS/EKS: Container orchestration
  - RDS: PostgreSQL managed database
  - ElastiCache: Redis managed cache
  - S3: File storage & static hosting
  - CloudFront: CDN
  - Route53: DNS management
  - ALB: Load balancing
  - ACM: SSL certificates
  - CloudWatch: Monitoring & logs
  - SES: Email service
```

#### Infrastructure as Code
```hcl
# Terraform for AWS
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

#### CI/CD Pipeline
```yaml
# GitHub Actions
name: Deploy to AWS
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
  build:
    runs-on: ubuntu-latest
  deploy:
    runs-on: ubuntu-latest
```

## 🔧 Required External APIs & Services

### 1. Email Service Integration

#### SendGrid (Recommended)
```go
// Setup
import "github.com/sendgrid/sendgrid-go"
import "github.com/sendgrid/sendgrid-go/helpers/mail"

type EmailService struct {
    client *sendgrid.Client
    from   string
}

func NewEmailService(apiKey, fromEmail string) *EmailService {
    return &EmailService{
        client: sendgrid.NewSendClient(apiKey),
        from:   fromEmail,
    }
}

// Templates needed:
// - Email verification
// - Password reset
// - Welcome email
// - Share notifications
```

**Cost**: Free tier (100 emails/day), then $14.95/month for 40K emails

#### Alternative: AWS SES
```go
import "github.com/aws/aws-sdk-go-v2/service/ses"

// Lower cost but requires domain verification
// $0.10 per 1,000 emails
```

### 2. File Storage & CDN

#### AWS S3 + CloudFront
```go
type StorageService struct {
    s3Client    *s3.Client
    bucket      string
    cdnDomain   string
}

// Use cases:
// - User avatars
// - Shared code thumbnails
// - Static assets
// - Backup storage
```

**Cost**: S3 ~$0.023/GB/month, CloudFront ~$0.085/GB transfer

#### Alternative: Cloudinary
```go
// Image optimization and transformation
// Better for user-generated images
// $0.0018 per 1,000 transformations
```

### 3. Analytics & Monitoring

#### Google Analytics 4
```javascript
// Frontend tracking
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: 'CodeRunner',
  page_location: window.location.href
});

// Events to track:
// - Code executions
// - Share creations
// - User registrations
// - Collaboration sessions
```

#### Mixpanel (User Analytics)
```go
import "github.com/mixpanel/mixpanel-go"

type Analytics struct {
    mixpanel mixpanel.Mixpanel
}

// Track user behavior:
// - Feature usage
// - User journey
// - Retention metrics
// - A/B test results
```

**Cost**: Free tier (1K users), then $25/month for 10K users

#### Sentry (Error Tracking)
```go
import "github.com/getsentry/sentry-go"

// Automatic error capture
// Performance monitoring
// Release tracking
```

**Cost**: Free tier (5K errors/month), then $26/month for 50K errors

### 4. Real-time Communication

#### Socket.io / WebSockets
```javascript
// Frontend WebSocket client
import io from 'socket.io-client';

const socket = io('wss://api.coderunner.io', {
  auth: {
    token: accessToken
  }
});

// Use cases:
// - Real-time collaboration
// - Live execution results
// - User presence
// - Chat/comments
```

#### Alternative: Pusher
```go
// Managed WebSocket service
// Easier to scale
// $49/month for 500 concurrent connections
```

### 5. Search & Discovery

#### Elasticsearch (Self-hosted)
```go
import "github.com/elastic/go-elasticsearch/v8"

// Full-text search for:
// - Code content
// - User profiles
// - Share titles/descriptions
// - Tags and categories
```

#### Alternative: Algolia
```javascript
// Managed search service
// Instant search results
// $500/month for 100K operations
```

### 6. Payment Processing (Future)

#### Stripe
```go
import "github.com/stripe/stripe-go/v74"

// For premium features:
// - Increased execution limits
// - Private repositories
// - Advanced collaboration
// - Priority support
```

## 🗄️ Database Schema Design

### PostgreSQL Tables

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_created_at (created_at)
);

-- User Sessions (Refresh Tokens)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    INDEX idx_sessions_user_id (user_id),
    INDEX idx_sessions_token (refresh_token),
    INDEX idx_sessions_expires (expires_at)
);

-- Code Executions History
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    output TEXT,
    error TEXT,
    status VARCHAR(20) NOT NULL, -- success, error, timeout
    execution_time_ns BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    share_id UUID REFERENCES shared_codes(id) ON DELETE SET NULL,
    
    INDEX idx_executions_user_id (user_id),
    INDEX idx_executions_created_at (created_at),
    INDEX idx_executions_language (language),
    INDEX idx_executions_status (status)
);

-- Shared Codes
CREATE TABLE shared_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    visibility VARCHAR(20) DEFAULT 'public', -- public, private, unlisted
    tags TEXT[], -- PostgreSQL array for tags
    expires_at TIMESTAMP NULL,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,
    original_share_id UUID REFERENCES shared_codes(id) NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_shares_user_id (user_id),
    INDEX idx_shares_visibility (visibility),
    INDEX idx_shares_language (language),
    INDEX idx_shares_created_at (created_at),
    INDEX idx_shares_tags USING GIN (tags), -- GIN index for array search
    INDEX idx_shares_original (original_share_id)
);

-- Share Interactions
CREATE TABLE share_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID REFERENCES shared_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(share_id, user_id),
    INDEX idx_likes_share_id (share_id),
    INDEX idx_likes_user_id (user_id)
);

CREATE TABLE share_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID REFERENCES shared_codes(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    viewed_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_views_share_id (share_id),
    INDEX idx_views_viewer_id (viewer_id),
    INDEX idx_views_viewed_at (viewed_at)
);

-- Collaboration Sessions
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    max_participants INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    
    INDEX idx_collab_owner_id (owner_id),
    INDEX idx_collab_active (is_active),
    INDEX idx_collab_created_at (created_at)
);

CREATE TABLE collaboration_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB, -- {can_edit: true, can_execute: true}
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP NULL,
    
    UNIQUE(session_id, user_id),
    INDEX idx_participants_session_id (session_id),
    INDEX idx_participants_user_id (user_id)
);
```

### Redis Data Structures

```redis
# Job Queue (existing)
LPUSH "job_queue" '{"id":"uuid","code":"...","language":"python"}'

# User Sessions Cache
SET "session:user_id" '{"user_id":"uuid","username":"johndoe"}' EX 3600

# Rate Limiting
INCR "rate_limit:user_id:execute" EX 3600
INCR "rate_limit:ip:auth" EX 60

# Real-time Collaboration
HSET "collab:session_id" "code" "current_code_content"
HSET "collab:session_id" "participants" "user1,user2,user3"

# Popular Shares Cache
ZADD "popular_shares" 1250 "share_id_1" 980 "share_id_2"

# Search Cache
SET "search:fibonacci:python" '[{"id":"share1"},{"id":"share2"}]' EX 300
```

## 🚀 Development Environment Setup

### 1. Local Development Stack

```bash
# Prerequisites
- Go 1.21+
- Node.js 18+
- Docker Desktop
- PostgreSQL 15+
- Redis 7+

# Environment Variables (.env)
DATABASE_URL=postgres://user:pass@localhost:5432/coderunner
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key
SENDGRID_API_KEY=your-sendgrid-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET=coderunner-dev
```

### 2. Docker Development Setup

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: coderunner
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  api:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://dev:devpass@postgres:5432/coderunner
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /var/run/docker.sock:/var/run/docker.sock
      
volumes:
  postgres_data:
```

### 3. Frontend Development

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@vitejs/plugin-react": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "eslint": "^8.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.0.0",
    "typescript": "^4.9.0",
    "vite": "^4.0.0",
    "vitest": "^0.28.0"
  }
}
```

## 📊 Cost Analysis & Scaling

### Monthly Costs (Estimated)

#### Small Scale (1K users, 10K executions/month)
```
AWS Infrastructure:
- ECS Tasks (2 API + 3 Workers): $40
- RDS db.t3.micro: $15
- ElastiCache cache.t3.micro: $15
- ALB + CloudFront: $25
- S3 Storage (10GB): $2
- SES (5K emails): $0.50

External Services:
- SendGrid (40K emails): $15
- Sentry (5K errors): Free
- Mixpanel (1K users): Free

Total: ~$112/month
```

#### Medium Scale (10K users, 100K executions/month)
```
AWS Infrastructure:
- ECS Tasks (5 API + 10 Workers): $120
- RDS db.t3.small: $30
- ElastiCache cache.t3.small: $30
- ALB + CloudFront: $40
- S3 Storage (100GB): $20
- SES (50K emails): $5

External Services:
- SendGrid (100K emails): $30
- Sentry (50K errors): $26
- Mixpanel (10K users): $25

Total: ~$326/month
```

#### Large Scale (100K users, 1M executions/month)
```
AWS Infrastructure:
- EKS Cluster + Nodes: $500
- RDS db.r5.large: $200
- ElastiCache cluster: $150
- ALB + CloudFront: $100
- S3 Storage (1TB): $200
- SES (500K emails): $50

External Services:
- SendGrid (500K emails): $90
- Sentry (500K errors): $199
- Mixpanel (100K users): $833

Total: ~$2,322/month
```

This comprehensive technology stack provides everything needed to build a scalable, production-ready CodeRunner platform with authentication, sharing, and cloud deployment capabilities. 🚀