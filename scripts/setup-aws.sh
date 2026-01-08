#!/bin/bash

# AWS Infrastructure Setup Script
# This script helps set up the necessary AWS resources for ECS Fargate deployment

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-YOUR_ACCOUNT_ID}"
PROJECT_NAME="wood-server"
ECR_REPOSITORY="${PROJECT_NAME}"
ECS_CLUSTER="${PROJECT_NAME}-cluster"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up AWS infrastructure for ECS Fargate deployment...${NC}"

# Step 1: Create ECR Repository
echo -e "${YELLOW}Step 1: Creating ECR repository...${NC}"
aws ecr create-repository \
  --repository-name $ECR_REPOSITORY \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  2>/dev/null || echo "Repository already exists"

# Step 2: Create ECS Cluster
echo -e "${YELLOW}Step 2: Creating ECS cluster...${NC}"
aws ecs create-cluster \
  --cluster-name $ECS_CLUSTER \
  --region $AWS_REGION \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  2>/dev/null || echo "Cluster already exists"

# Step 3: Create CloudWatch Log Group
echo -e "${YELLOW}Step 3: Creating CloudWatch log group...${NC}"
aws logs create-log-group \
  --log-group-name /ecs/$PROJECT_NAME \
  --region $AWS_REGION \
  2>/dev/null || echo "Log group already exists"

echo -e "${GREEN}AWS infrastructure setup completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Create VPC, subnets, and security groups"
echo "2. Create Application Load Balancer and Target Group"
echo "3. Create IAM roles (ecsTaskExecutionRole and ecsTaskRole)"
echo "4. Store secrets in AWS Secrets Manager"
echo "5. Update ecs-task-definition.json with your ARNs"
echo "6. Register task definition: aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json"
echo "7. Create ECS service: aws ecs create-service --cli-input-json file://ecs-service-definition.json"

