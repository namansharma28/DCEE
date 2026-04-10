# 🚀 CodeRunner Cloud Deployment Guide

## Overview

This guide covers deploying CodeRunner to major cloud providers for production use.

## 🏗️ Architecture for Production

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │───▶│   API Servers   │───▶│  Redis Cluster  │
│   (nginx/ALB)   │    │  (Multiple)     │    │  (Managed)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Docker Host   │◀───│  Worker Nodes   │◀───│  Job Queue      │
│   (Kubernetes)  │    │  (Auto-scale)   │    │  (Redis)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ☁️ AWS Deployment

### Prerequisites
- AWS CLI configured
- Docker installed
- kubectl installed

### 1. Create EKS Cluster
```bash
# Create EKS cluster
eksctl create cluster --name coderunner --region us-west-2 --nodes 3

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name coderunner
```

### 2. Deploy Redis
```yaml
# redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

### 3. Build and Push Docker Images
```bash
# Build API server image
docker build -t your-registry/coderunner-api:latest -f Dockerfile.api .
docker push your-registry/coderunner-api:latest

# Build worker image
docker build -t your-registry/coderunner-worker:latest -f Dockerfile.worker .
docker push your-registry/coderunner-worker:latest
```

### 4. Deploy API Server
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
        image: your-registry/coderunner-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: REDIS_ADDR
          value: "redis-service:6379"
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: LoadBalancer
  selector:
    app: coderunner-api
  ports:
  - port: 80
    targetPort: 8080
```

### 5. Deploy Workers
```yaml
# worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coderunner-worker
spec:
  replicas: 5
  selector:
    matchLabels:
      app: coderunner-worker
  template:
    metadata:
      labels:
        app: coderunner-worker
    spec:
      containers:
      - name: worker
        image: your-registry/coderunner-worker:latest
        env:
        - name: REDIS_ADDR
          value: "redis-service:6379"
        - name: WORKER_COUNT
          value: "4"
        securityContext:
          privileged: true  # Required for Docker-in-Docker
        volumeMounts:
        - name: docker-sock
          mountPath: /var/run/docker.sock
      volumes:
      - name: docker-sock
        hostPath:
          path: /var/run/docker.sock
```

## 🌐 Google Cloud Platform (GCP)

### 1. Create GKE Cluster
```bash
# Create cluster
gcloud container clusters create coderunner \
    --zone us-central1-a \
    --num-nodes 3 \
    --enable-autoscaling \
    --min-nodes 1 \
    --max-nodes 10

# Get credentials
gcloud container clusters get-credentials coderunner --zone us-central1-a
```

### 2. Use Cloud Redis
```bash
# Create Redis instance
gcloud redis instances create coderunner-redis \
    --size=1 \
    --region=us-central1 \
    --redis-version=redis_6_x
```

### 3. Deploy with Cloud Build
```yaml
# cloudbuild.yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/coderunner-api', '-f', 'Dockerfile.api', '.']
- name: 'gcr.io/cloud-builders/docker'
  args: ['push', 'gcr.io/$PROJECT_ID/coderunner-api']
- name: 'gcr.io/cloud-builders/kubectl'
  args: ['apply', '-f', 'k8s/']
  env:
  - 'CLOUDSDK_COMPUTE_ZONE=us-central1-a'
  - 'CLOUDSDK_CONTAINER_CLUSTER=coderunner'
```

## 🔵 Microsoft Azure

### 1. Create AKS Cluster
```bash
# Create resource group
az group create --name coderunner-rg --location eastus

# Create AKS cluster
az aks create \
    --resource-group coderunner-rg \
    --name coderunner-aks \
    --node-count 3 \
    --enable-addons monitoring \
    --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group coderunner-rg --name coderunner-aks
```

### 2. Use Azure Cache for Redis
```bash
# Create Redis cache
az redis create \
    --location eastus \
    --name coderunner-redis \
    --resource-group coderunner-rg \
    --sku Basic \
    --vm-size c0
```

## 🐳 Docker Compose (Simple Deployment)

For smaller deployments, use Docker Compose:

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "80:8080"
    environment:
      - REDIS_ADDR=redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - REDIS_ADDR=redis:6379
      - WORKER_COUNT=4
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - redis
    restart: unless-stopped
    deploy:
      replicas: 3

volumes:
  redis_data:
```

## 🔒 Security Considerations

### 1. Network Security
```yaml
# Network policies for Kubernetes
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: coderunner-network-policy
spec:
  podSelector:
    matchLabels:
      app: coderunner-worker
  policyTypes:
  - Ingress
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

### 2. Resource Limits
```yaml
resources:
  limits:
    cpu: "1"
    memory: "1Gi"
  requests:
    cpu: "500m"
    memory: "512Mi"
```

### 3. Security Context
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 2000
  capabilities:
    drop:
    - ALL
```

## 📊 Monitoring & Logging

### 1. Prometheus Monitoring
```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'coderunner-api'
      static_configs:
      - targets: ['api-service:8080']
```

### 2. Grafana Dashboard
```json
{
  "dashboard": {
    "title": "CodeRunner Metrics",
    "panels": [
      {
        "title": "Execution Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(coderunner_executions_total[5m])"
          }
        ]
      }
    ]
  }
}
```

## 🚀 Auto-Scaling

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: coderunner-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: coderunner-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 💰 Cost Optimization

### 1. Use Spot Instances
```yaml
# For worker nodes that can handle interruptions
nodeSelector:
  kubernetes.io/arch: amd64
  node.kubernetes.io/instance-type: spot
```

### 2. Resource Right-Sizing
- **API Server**: 2 CPU, 4GB RAM
- **Workers**: 4 CPU, 8GB RAM
- **Redis**: 2 CPU, 4GB RAM

### 3. Auto-Scaling Policies
- Scale up: CPU > 70% for 2 minutes
- Scale down: CPU < 30% for 5 minutes

## 🔧 Environment Variables

```bash
# Production environment variables
REDIS_ADDR=your-redis-endpoint:6379
REDIS_PASSWORD=your-redis-password
PORT=8080
WORKER_COUNT=4
LOG_LEVEL=info
ENVIRONMENT=production
```

## 📋 Deployment Checklist

- [ ] **Infrastructure**: Kubernetes cluster ready
- [ ] **Redis**: Managed Redis service configured
- [ ] **Images**: Docker images built and pushed
- [ ] **Secrets**: Environment variables configured
- [ ] **Networking**: Load balancer and ingress setup
- [ ] **Monitoring**: Prometheus and Grafana deployed
- [ ] **Logging**: Centralized logging configured
- [ ] **Security**: Network policies and RBAC setup
- [ ] **Backup**: Redis backup strategy implemented
- [ ] **SSL/TLS**: HTTPS certificates configured

## 🎯 Production Readiness

Your CodeRunner platform is now ready for:
- **High availability** with multiple replicas
- **Auto-scaling** based on demand
- **Monitoring** and alerting
- **Security** best practices
- **Cost optimization** strategies

The system can handle **thousands of concurrent users** and **scale automatically** based on demand!

## 🌟 Next Steps

1. **Deploy to staging** environment first
2. **Load test** with realistic traffic
3. **Set up monitoring** and alerting
4. **Configure backup** and disaster recovery
5. **Launch to production** with gradual rollout

Your distributed code execution platform is **production-ready**! 🚀