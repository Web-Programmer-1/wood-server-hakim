# AWS ECS Fargate Deployment Guide

This guide will walk you through deploying the Wood Server application to AWS ECS Fargate.

## Prerequisites

- AWS CLI installed and configured
- Docker installed and running
- AWS account with appropriate permissions
- jq installed (for deployment scripts)

## Architecture Overview

The application will be deployed using:
- **AWS ECS Fargate** - Container orchestration
- **Amazon ECR** - Docker image registry
- **Application Load Balancer** - Traffic distribution
- **AWS Secrets Manager** - Secure environment variable storage
- **CloudWatch Logs** - Logging and monitoring
- **Amazon RDS** - PostgreSQL database (external)
- **Amazon ElastiCache** - Redis cache (external)

## Step 1: AWS Infrastructure Setup

### 1.1 Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name wood-server \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true
```

### 1.2 Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name wood-server-cluster \
  --region us-east-1 \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
```

### 1.3 Create VPC and Networking

1. Create a VPC with public and private subnets (at least 2 AZs)
2. Create an Internet Gateway
3. Create NAT Gateway for private subnets
4. Configure route tables

### 1.4 Create Security Groups

**Application Security Group:**
- Inbound: Port 5000 from ALB security group
- Outbound: All traffic

**ALB Security Group:**
- Inbound: Port 80/443 from 0.0.0.0/0
- Outbound: All traffic

**Database Security Group:**
- Inbound: Port 5432 from application security group
- Outbound: All traffic

### 1.5 Create Application Load Balancer

```bash
# Create Target Group
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

# Create Load Balancer
aws elbv2 create-load-balancer \
  --name wood-server-alb \
  --subnets subnet-xxxxxxxxx subnet-yyyyyyyyy \
  --security-groups sg-xxxxxxxxx
```

### 1.6 Create IAM Roles

**ECS Task Execution Role** (`ecsTaskExecutionRole`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

**ECS Task Role** (`ecsTaskRole`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:wood-server/*"
    }
  ]
}
```

### 1.7 Store Secrets in AWS Secrets Manager

Store all sensitive environment variables in AWS Secrets Manager:

```bash
# Example: Store database URL
aws secretsmanager create-secret \
  --name wood-server/database-url \
  --secret-string "postgresql://user:password@host:5432/dbname" \
  --region us-east-1

# Repeat for all secrets:
# - wood-server/jwt-secret
# - wood-server/refresh-token-secret
# - wood-server/expires-in
# - wood-server/refresh-token-expires-in
# - wood-server/reset-pass-token
# - wood-server/reset-pass-token-expires-in
# - wood-server/salt-round
# - wood-server/reset-pass-link
# - wood-server/cloudinary-cloud-name
# - wood-server/cloudinary-api-key
# - wood-server/cloudinary-api-secret
# - wood-server/stripe-secret-key
# - wood-server/openrouter-api-key
# - wood-server/email
# - wood-server/app-pass
# - wood-server/redis-host
# - wood-server/redis-port
# - wood-server/redis-pass
```

## Step 2: Update Configuration Files

### 2.1 Update ECS Task Definition

Edit `ecs-task-definition.json`:
- Replace `YOUR_ACCOUNT_ID` with your AWS account ID
- Replace `REGION` with your AWS region
- Update secret ARNs with your actual secret ARNs
- Update execution and task role ARNs

### 2.2 Update ECS Service Definition

Edit `ecs-service-definition.json`:
- Update subnet IDs
- Update security group IDs
- Update target group ARN
- Adjust `desiredCount` based on your needs

## Step 3: Build and Push Docker Image

### 3.1 Login to ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### 3.2 Build Docker Image

```bash
docker build -t wood-server:latest .
```

### 3.3 Tag and Push Image

```bash
docker tag wood-server:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wood-server:latest

docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wood-server:latest
```

## Step 4: Deploy to ECS

### 4.1 Register Task Definition

```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json \
  --region us-east-1
```

### 4.2 Create ECS Service

```bash
aws ecs create-service \
  --cli-input-json file://ecs-service-definition.json \
  --region us-east-1
```

### 4.3 Using Deployment Script

Alternatively, use the provided deployment script:

```bash
chmod +x scripts/deploy.sh

# Set environment variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=YOUR_ACCOUNT_ID
export ECR_REPOSITORY=wood-server
export ECS_CLUSTER=wood-server-cluster
export ECS_SERVICE=wood-server-service

# Run deployment
./scripts/deploy.sh
```

## Step 5: Verify Deployment

1. Check service status:
```bash
aws ecs describe-services \
  --cluster wood-server-cluster \
  --services wood-server-service \
  --region us-east-1
```

2. Check task status:
```bash
aws ecs list-tasks \
  --cluster wood-server-cluster \
  --service-name wood-server-service \
  --region us-east-1
```

3. View logs:
```bash
aws logs tail /ecs/wood-server --follow --region us-east-1
```

4. Test the application:
```bash
curl http://YOUR_ALB_DNS_NAME/
```

## Step 6: Continuous Deployment

### Option 1: GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: wood-server
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ecs-task-definition.json
          service: wood-server-service
          cluster: wood-server-cluster
          wait-for-service-stability: true
```

### Option 2: AWS CodePipeline

Set up a CI/CD pipeline using AWS CodePipeline with:
- Source: GitHub/CodeCommit
- Build: AWS CodeBuild
- Deploy: AWS CodeDeploy to ECS

## Monitoring and Maintenance

### CloudWatch Metrics

Monitor:
- CPU and Memory utilization
- Request count and latency
- Error rates
- Task count

### Logs

View logs in CloudWatch:
```bash
aws logs tail /ecs/wood-server --follow
```

### Scaling

Update service desired count:
```bash
aws ecs update-service \
  --cluster wood-server-cluster \
  --service wood-server-service \
  --desired-count 4 \
  --region us-east-1
```

### Auto Scaling

Set up Application Auto Scaling:
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/wood-server-cluster/wood-server-service \
  --min-capacity 2 \
  --max-capacity 10
```

## Troubleshooting

### Common Issues

1. **Task fails to start:**
   - Check CloudWatch logs
   - Verify secrets are accessible
   - Check security group rules
   - Verify task role permissions

2. **Health check failures:**
   - Verify application is listening on port 5000
   - Check health check path
   - Review application logs

3. **Cannot connect to database:**
   - Verify security group allows traffic
   - Check database endpoint
   - Verify DATABASE_URL secret

4. **Image pull errors:**
   - Verify ECR repository exists
   - Check task execution role permissions
   - Verify image tag exists

## Cost Optimization

1. Use Fargate Spot for non-critical workloads
2. Right-size CPU and memory allocation
3. Use CloudWatch Insights for log analysis
4. Enable ECR image lifecycle policies
5. Use reserved capacity for predictable workloads

## Security Best Practices

1. Store all secrets in AWS Secrets Manager
2. Use least privilege IAM roles
3. Enable VPC Flow Logs
4. Use AWS WAF with ALB
5. Enable ECR image scanning
6. Regularly update base images
7. Use private subnets for tasks
8. Enable CloudTrail for audit logging

## Support

For issues or questions, refer to:
- AWS ECS Documentation: https://docs.aws.amazon.com/ecs/
- AWS Fargate Documentation: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html

