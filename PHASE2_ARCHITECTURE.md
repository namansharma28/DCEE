# 🚀 Phase 2: Authentication, Sharing & Cloud Deployment

## 🎯 Overview

Transform CodeRunner from a local execution engine into a full-featured cloud platform with user accounts, code sharing, and scalable deployment.

## 🏗️ Enhanced System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD PLATFORM ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Load Balancer  │    │   CDN (Static)  │
│                 │    │                 │    │                 │
│ • Auth UI       │◄──►│ • SSL/TLS       │◄──►│ • React Build   │
│ • Share Modal   │    │ • Rate Limiting │    │ • Assets Cache  │
│ • User Profile  │    │ • Health Checks │    │ • Global Edge   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌─────────────────┐                │
         │              │   API Gateway   │                │
         │              │                 │                │
         └──────────────►│ • JWT Validation│◄───────────────┘
                        │ • Rate Limiting │
                        │ • Request Routing│
                        └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │   Auth Service  │ │   API Service   │ │  Share Service  │
          │                 │ │                 │ │                 │
          │ • Registration  │ │ • Code Execute  │ │ • Public Links  │
          │ • Login/Logout  │ │ • User Context  │ │ • Collaboration │
          │ • JWT Tokens    │ │ • History       │ │ • Permissions   │
          └─────────────────┘ └─────────────────┘ └─────────────────┘
                    │            │            │
                    └────────────┼────────────┘
                                 │
                    ┌─────────────────────────────┐
                    │       Data Layer            │
                    │                             │
                    │ ┌─────────┐ ┌─────────┐    │
                    │ │PostgreSQL│ │  Redis  │    │
                    │ │         │ │         │    │
                    │ │• Users  │ │• Sessions│    │
                    │ │• Shares │ │• Queue   │    │
                    │ │• History│ │• Cache   │    │
                    │ └─────────┘ └─────────┘    │
                    └─────────────────────────────┘
                                 │
                    ┌─────────────────────────────┐
                    │      Worker Pool            │
                    │                             │
                    │ ┌─────┐ ┌─────┐ ┌─────┐    │
                    │ │ Pod │ │ Pod │ │ Pod │    │
                    │ │  1  │ │  2  │ │  N  │    │
                    │ └─────┘ └─────┘ └─────┘    │
                    └─────────────────────────────┘
```

## 🔐 Authentication System

### Required APIs & Components

#### 1. User Management APIs
```go
// User Registration
POST /auth/register
{
  "username": "string",
  "email": "string", 
  "password": "string",
  "full_name": "string"
}

// User Login
POST /auth/login
{
  "email": "string",
  "password": "string"
}

// Token Refresh
POST /auth/refresh
{
  "refresh_token": "string"
}

// User Profile
GET /auth/profile
PUT /auth/profile
{
  "full_name": "string",
  "bio": "string",
  "avatar_url": "string"
}

// Password Management
POST /auth/forgot-password
POST /auth/reset-password
PUT /auth/change-password
```

#### 2. Database Schema (PostgreSQL)
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- User sessions (for refresh tokens)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Email verification tokens
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. JWT Token Structure
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "username": "johndoe",
    "iat": 1640995200,
    "exp": 1640998800,
    "iss": "coderunner.io",
    "aud": "coderunner-api"
  }
}
```

#### 4. Required Go Packages
```go
// Authentication & Security
"github.com/golang-jwt/jwt/v5"
"golang.org/x/crypto/bcrypt"
"github.com/google/uuid"

// Database
"github.com/lib/pq"           // PostgreSQL driver
"gorm.io/gorm"               // ORM
"gorm.io/driver/postgres"    // GORM PostgreSQL

// Email
"github.com/sendgrid/sendgrid-go"
"gopkg.in/gomail.v2"

// Validation
"github.com/go-playground/validator/v10"
```

## 🔗 Code Sharing System

### Required APIs & Components

#### 1. Code Sharing APIs
```go
// Create shareable link
POST /share/create
{
  "code": "string",
  "language": "string",
  "title": "string",
  "description": "string",
  "visibility": "public|private|unlisted",
  "expires_at": "timestamp|null"
}

// Get shared code
GET /share/{share_id}
Response: {
  "id": "string",
  "code": "string", 
  "language": "string",
  "title": "string",
  "description": "string",
  "author": {
    "username": "string",
    "avatar_url": "string"
  },
  "created_at": "timestamp",
  "view_count": "number",
  "fork_count": "number"
}

// Fork shared code
POST /share/{share_id}/fork
Response: {
  "new_share_id": "string"
}

// User's shared codes
GET /share/my-shares
GET /share/my-forks

// Public gallery
GET /share/public?page=1&limit=20&language=python&sort=popular
```

#### 2. Database Schema (Sharing)
```sql
-- Shared codes table
CREATE TABLE shared_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    visibility VARCHAR(20) DEFAULT 'public', -- public, private, unlisted
    expires_at TIMESTAMP NULL,
    view_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,
    original_share_id UUID REFERENCES shared_codes(id) NULL, -- for forks
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Share views tracking
CREATE TABLE share_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID REFERENCES shared_codes(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    viewed_at TIMESTAMP DEFAULT NOW()
);

-- Share likes/favorites
CREATE TABLE share_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID REFERENCES shared_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(share_id, user_id)
);
```

#### 3. Real-time Collaboration APIs
```go
// WebSocket for collaborative editing
WS /collaborate/{share_id}

// Collaborative session management
POST /collaborate/{share_id}/join
DELETE /collaborate/{share_id}/leave

// Operational Transform for real-time editing
POST /collaborate/{share_id}/operation
{
  "type": "insert|delete|retain",
  "position": "number",
  "content": "string",
  "user_id": "string"
}
```

## ☁️ Cloud Deployment Architecture

### 1. AWS Deployment Stack

#### Infrastructure Components
```yaml
# AWS Services Required:
- ECS/EKS: Container orchestration
- RDS: PostgreSQL database
- ElastiCache: Redis cluster
- ALB: Application Load Balancer
- CloudFront: CDN for static assets
- Route53: DNS management
- ACM: SSL certificates
- S3: Static file storage
- ECR: Container registry
- CloudWatch: Monitoring & logs
- IAM: Access management
```

#### Terraform Configuration
```hcl
# VPC and Networking
resource "aws_vpc" "coderunner_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier     = "coderunner-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  
  db_name  = "coderunner"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "redis" {
  name       = "coderunner-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "coderunner-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "coderunner-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
```

#### Docker Compose for AWS ECS
```yaml
version: '3.8'
services:
  api:
    image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/coderunner-api:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${RDS_CONNECTION_STRING}
      - REDIS_ADDR=${ELASTICACHE_ENDPOINT}
      - JWT_SECRET=${JWT_SECRET}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    depends_on:
      - redis
    deploy:
      replicas: 3
      
  worker:
    image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/coderunner-worker:latest
    environment:
      - DATABASE_URL=${RDS_CONNECTION_STRING}
      - REDIS_ADDR=${ELASTICACHE_ENDPOINT}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    deploy:
      replicas: 5
```

### 2. Google Cloud Platform (GCP) Stack

#### Infrastructure Components
```yaml
# GCP Services Required:
- GKE: Kubernetes cluster
- Cloud SQL: PostgreSQL
- Memorystore: Redis
- Cloud Load Balancing: HTTP(S) load balancer
- Cloud CDN: Content delivery
- Cloud DNS: Domain management
- Cloud Storage: Static files
- Container Registry: Docker images
- Cloud Monitoring: Observability
- Cloud IAM: Access control
```

#### Kubernetes Deployment
```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coderunner-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: coderunner-api
  template:
    metadata:
      labels:
        app: coderunner-api
    spec:
      containers:
      - name: api
        image: gcr.io/PROJECT_ID/coderunner-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: connection-string
        - name: REDIS_ADDR
          value: "redis-service:6379"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 3. Microsoft Azure Stack

#### Infrastructure Components
```yaml
# Azure Services Required:
- AKS: Kubernetes service
- Azure Database for PostgreSQL: Managed database
- Azure Cache for Redis: Redis service
- Application Gateway: Load balancer
- Azure CDN: Content delivery
- Azure DNS: Domain management
- Azure Storage: Blob storage
- Container Registry: Docker images
- Azure Monitor: Observability
- Azure Active Directory: Identity
```

## 📧 External Service Integrations

### 1. Email Services
```go
// SendGrid Integration
type EmailService struct {
    client *sendgrid.Client
    from   string
}

func (e *EmailService) SendVerificationEmail(to, token string) error {
    message := mail.NewSingleEmail(
        mail.NewEmail("CodeRunner", e.from),
        "Verify your email address",
        mail.NewEmail("", to),
        fmt.Sprintf("Click here to verify: https://coderunner.io/verify?token=%s", token),
    )
    
    _, err := e.client.Send(message)
    return err
}

// Alternative: AWS SES, Mailgun, Postmark
```

### 2. File Storage (Avatars, Assets)
```go
// AWS S3 Integration
type StorageService struct {
    s3Client *s3.Client
    bucket   string
}

func (s *StorageService) UploadAvatar(userID string, file io.Reader) (string, error) {
    key := fmt.Sprintf("avatars/%s/%s.jpg", userID, uuid.New().String())
    
    _, err := s.s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
        Bucket: aws.String(s.bucket),
        Key:    aws.String(key),
        Body:   file,
        ACL:    "public-read",
    })
    
    if err != nil {
        return "", err
    }
    
    return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.bucket, key), nil
}
```

### 3. Analytics & Monitoring
```go
// Google Analytics 4
// Mixpanel for user events
// Sentry for error tracking
// DataDog/New Relic for APM

type AnalyticsService struct {
    mixpanel *mixpanel.Client
    sentry   *sentry.Client
}

func (a *AnalyticsService) TrackCodeExecution(userID, language string, success bool) {
    a.mixpanel.Track(userID, "code_executed", map[string]interface{}{
        "language": language,
        "success":  success,
        "timestamp": time.Now(),
    })
}
```

## 🔧 Development Roadmap

### Phase 2.1: Authentication (2-3 weeks)
1. **Week 1**: Database setup, user models, JWT implementation
2. **Week 2**: Registration/login APIs, email verification
3. **Week 3**: Frontend auth UI, protected routes, user profiles

### Phase 2.2: Code Sharing (2-3 weeks)
1. **Week 1**: Share creation, public links, database schema
2. **Week 2**: Public gallery, search, fork functionality
3. **Week 3**: Real-time collaboration, operational transform

### Phase 2.3: Cloud Deployment (1-2 weeks)
1. **Week 1**: Infrastructure as Code (Terraform/CloudFormation)
2. **Week 2**: CI/CD pipelines, monitoring, production deployment

## 💰 Cost Estimation (Monthly)

### AWS (Small Scale - 1000 users)
```
- ECS Tasks (3 API + 5 Workers): ~$50
- RDS db.t3.micro: ~$15
- ElastiCache cache.t3.micro: ~$15
- ALB: ~$20
- CloudFront: ~$10
- Route53: ~$1
- S3 Storage: ~$5
- Total: ~$116/month
```

### GCP (Small Scale - 1000 users)
```
- GKE Cluster: ~$75
- Cloud SQL db-f1-micro: ~$10
- Memorystore 1GB: ~$25
- Load Balancer: ~$20
- Cloud CDN: ~$10
- Cloud Storage: ~$5
- Total: ~$145/month
```

### Azure (Small Scale - 1000 users)
```
- AKS Cluster: ~$70
- Azure Database Basic: ~$15
- Azure Cache Basic: ~$20
- Application Gateway: ~$25
- Azure CDN: ~$10
- Blob Storage: ~$5
- Total: ~$145/month
```

## 🚀 Next Steps

1. **Choose Cloud Provider**: AWS recommended for cost-effectiveness
2. **Set up Development Environment**: Local PostgreSQL + Redis
3. **Implement Authentication**: Start with JWT-based auth
4. **Database Migration**: Add user tables to existing system
5. **Frontend Updates**: Add auth UI components
6. **API Extensions**: Extend existing APIs with user context
7. **Sharing System**: Build on top of authenticated system
8. **Cloud Infrastructure**: Terraform + CI/CD setup
9. **Production Deployment**: Gradual rollout with monitoring

Ready to start with any specific component! 🎯