# Docker & AWS Setup Guide

This guide will walk you through running the project locally with Docker and deploying it to AWS ECS Fargate.

---

## Part 1: Running Locally with Docker

### Prerequisites
- Docker Desktop installed and running
- Docker Compose installed (comes with Docker Desktop)
- A `.env` file with all required environment variables

### Step 1: Create Environment File

Create a `.env` file in the root directory with all required variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=5000

# Database (use your PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@localhost:5432/wood_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this
REFRESH_TOKEN_EXPIRES_IN=30d
RESET_PASS_TOKEN=your-reset-pass-token-secret
RESET_PASS_TOKEN_EXPIRES_IN=1h

# Password Hashing
SALT_ROUND=10

# Password Reset
RESET_PASS_LINK=http://localhost:3000/reset-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# OpenRouter API
OPENROUTER_API_KEY=your-openrouter-api-key

# Email Configuration
EMAIL=your-email@example.com
APP_PASS=your-app-password

# Redis Configuration (will use Docker Redis)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASS=your-redis-password

# AWS Configuration (for S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
```

### Step 2: Build and Run with Docker Compose

```bash
# Build and start all services (app + Redis)
docker-compose up -d

# View logs
docker-compose logs -f app

# View all logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Step 3: Verify It's Running

```bash
# Check if containers are running
docker-compose ps

# Test the API
curl http://localhost:5000/

# Expected response:
# {
#   "message": "Server is running..",
#   "environment": "development",
#   "uptime": "...",
#   "timeStamp": "..."
# }
```

### Step 4: Access Services

- **Application**: http://localhost:5000
- **API Endpoints**: http://localhost:5000/api/v1/...
- **Redis**: localhost:6379 (if you need to connect externally)

### Common Docker Commands

```bash
# Rebuild after code changes
docker-compose up -d --build

# View container logs
docker-compose logs -f app

# Execute commands inside container
docker-compose exec app sh

# Check container status
docker-compose ps

# View resource usage
docker stats
```

---

## Part 2: AWS ECS Fargate Setup

### Prerequisites
- AWS Account
- AWS CLI installed and configured (`aws configure`)
- Docker installed
- jq installed (for deployment scripts)

### Step 1: Configure AWS CLI

```bash
# Install AWS CLI (if not installed)
# Windows: Download from https://aws.amazon.com/cli/
# Mac: brew install awscli
# Linux: sudo apt-get install awscli

# Configure AWS credentials
aws configure

# Enter:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1 (or your preferred region)
# Default output format: json
```

### Step 2: Initial AWS Infrastructure Setup

Run the setup script to create basic AWS resources:

```bash
# Make script executable (Linux/Mac)
chmod +x scripts/setup-aws.sh

# Run setup script
./scripts/setup-aws.sh

# Or manually create resources:
```

**Manual Setup:**

```bash
# 1. Create ECR Repository (Docker image storage)
aws ecr create-repository \
  --repository-name wood-server \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true

# 2. Create ECS Cluster
aws ecs create-cluster \
  --cluster-name wood-server-cluster \
  --region us-east-1 \
  --capacity-providers FARGATE FARGATE_SPOT

# 3. Create CloudWatch Log Group
aws logs create-log-group \
  --log-group-name /ecs/wood-server \
  --region us-east-1
```

### Step 3: Create VPC and Networking

You need a VPC with subnets for your ECS tasks:

```bash
# Option A: Use existing VPC (recommended for beginners)
# Go to AWS Console > VPC > Use default VPC

# Option B: Create new VPC (recommended for production)
# Go to AWS Console > VPC > Create VPC
# - Create VPC with CIDR: 10.0.0.0/16
# - Create 2 public subnets in different AZs
# - Create Internet Gateway and attach to VPC
# - Update route tables
```

**Note:** For simplicity, you can use the default VPC. Get your subnet IDs:

```bash
# List subnets
aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,AvailabilityZone]' --output table
```

### Step 4: Create Security Groups

```bash
# 1. Create Security Group for Application
aws ec2 create-security-group \
  --group-name wood-server-sg \
  --description "Security group for wood server" \
  --vpc-id vpc-xxxxxxxxx

# Note the SecurityGroupId from output

# 2. Create Security Group for ALB (Load Balancer)
aws ec2 create-security-group \
  --group-name wood-server-alb-sg \
  --description "Security group for ALB" \
  --vpc-id vpc-xxxxxxxxx

# 3. Allow inbound traffic to ALB (HTTP/HTTPS)
aws ec2 authorize-security-group-ingress \
  --group-id sg-alb-xxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-alb-xxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# 4. Allow ALB to communicate with application
aws ec2 authorize-security-group-ingress \
  --group-id sg-app-xxxxx \
  --protocol tcp \
  --port 5000 \
  --source-group sg-alb-xxxxx
```

### Step 5: Create Application Load Balancer

```bash
# 1. Create Target Group
aws elbv2 create-target-group \
  --name wood-server-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxxxxxx \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Note the TargetGroupArn from output

# 2. Create Load Balancer
aws elbv2 create-load-balancer \
  --name wood-server-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-alb-xxxxx

# Note the LoadBalancerArn and DNS name from output
```

### Step 6: Create IAM Roles

**ECS Task Execution Role** (allows ECS to pull images and write logs):

```bash
# Create role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach managed policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add Secrets Manager access
aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name SecretsManagerAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "kms:Decrypt"
      ],
      "Resource": "*"
    }]
  }'
```

**ECS Task Role** (for application to access AWS services):

```bash
# Create role
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Add S3 access (if needed)
aws iam put-role-policy \
  --role-name ecsTaskRole \
  --policy-name S3Access \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }]
  }'
```

**Get Role ARNs:**

```bash
# Get execution role ARN
aws iam get-role --role-name ecsTaskExecutionRole --query 'Role.Arn' --output text

# Get task role ARN
aws iam get-role --role-name ecsTaskRole --query 'Role.Arn' --output text
```

### Step 7: Store Secrets in AWS Secrets Manager

Store all sensitive environment variables:

```bash
# Get your AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1

# Store each secret
aws secretsmanager create-secret \
  --name wood-server/database-url \
  --secret-string "postgresql://user:password@host:5432/dbname" \
  --region $REGION

aws secretsmanager create-secret \
  --name wood-server/jwt-secret \
  --secret-string "your-jwt-secret" \
  --region $REGION

aws secretsmanager create-secret \
  --name wood-server/refresh-token-secret \
  --secret-string "your-refresh-token-secret" \
  --region $REGION

# ... continue for all secrets
# See DEPLOYMENT.md for complete list
```

**Get Secret ARNs:**

```bash
aws secretsmanager list-secrets \
  --filters Key=name,Values=wood-server \
  --query 'SecretList[*].[Name,ARN]' \
  --output table
```

### Step 8: Update Configuration Files

**Update `ecs-task-definition.json`:**

1. Replace `YOUR_ACCOUNT_ID` with your AWS Account ID
2. Replace `REGION` with your AWS region (e.g., `us-east-1`)
3. Update all secret ARNs
4. Update IAM role ARNs

```bash
# Get your account ID
aws sts get-caller-identity --query Account --output text
```

**Update `ecs-service-definition.json`:**

1. Update subnet IDs (from Step 3)
2. Update security group ID (from Step 4)
3. Update target group ARN (from Step 5)

### Step 9: Build and Push Docker Image

```bash
# Set variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=wood-server

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build image
docker build -t $ECR_REPOSITORY:latest .

# Tag image
docker tag $ECR_REPOSITORY:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
```

### Step 10: Register Task Definition

```bash
# Update the image URI in task definition first
# Then register
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json \
  --region us-east-1
```

### Step 11: Create ECS Service

```bash
aws ecs create-service \
  --cli-input-json file://ecs-service-definition.json \
  --region us-east-1
```

### Step 12: Verify Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster wood-server-cluster \
  --services wood-server-service \
  --region us-east-1

# Check running tasks
aws ecs list-tasks \
  --cluster wood-server-cluster \
  --service-name wood-server-service

# View logs
aws logs tail /ecs/wood-server --follow

# Get ALB DNS name and test
aws elbv2 describe-load-balancers \
  --names wood-server-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text

# Test endpoint
curl http://YOUR-ALB-DNS-NAME.us-east-1.elb.amazonaws.com/
```

---

## Quick Deployment Script

For faster deployment after initial setup:

```bash
# Set environment variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=wood-server
export ECS_CLUSTER=wood-server-cluster
export ECS_SERVICE=wood-server-service

# Run deployment script
./scripts/deploy.sh
```

---

## Troubleshooting

### Docker Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs app

# Check if port is already in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # Mac/Linux
```

**Database connection issues:**
- Ensure DATABASE_URL is correct
- Check if database is accessible from Docker network
- For local PostgreSQL, use `host.docker.internal` instead of `localhost`

### AWS Issues

**Task fails to start:**
```bash
# Check CloudWatch logs
aws logs tail /ecs/wood-server --follow

# Check task status
aws ecs describe-tasks \
  --cluster wood-server-cluster \
  --tasks TASK_ARN
```

**Image pull errors:**
- Verify ECR repository exists
- Check task execution role has ECR permissions
- Verify image tag exists in ECR

**Health check failures:**
- Verify application is listening on port 5000
- Check security group allows traffic
- Review application logs for errors

---

## Next Steps

- Set up auto-scaling
- Configure custom domain with Route 53
- Set up CI/CD with GitHub Actions
- Enable HTTPS with ACM certificate
- Set up monitoring and alerts

For more details, see [DEPLOYMENT.md](./DEPLOYMENT.md)

