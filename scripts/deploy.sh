#!/bin/bash

# AWS ECS Fargate Deployment Script
# This script builds, tags, and pushes the Docker image to ECR, then updates the ECS service

set -e

# Configuration - Update these values
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-YOUR_ACCOUNT_ID}"
ECR_REPOSITORY="${ECR_REPOSITORY:-wood-server}"
ECS_CLUSTER="${ECS_CLUSTER:-wood-server-cluster}"
ECS_SERVICE="${ECS_SERVICE:-wood-server-service}"
ECS_TASK_FAMILY="${ECS_TASK_FAMILY:-wood-server-task}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process...${NC}"

# Step 1: Login to ECR
echo -e "${YELLOW}Step 1: Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 2: Build Docker image
echo -e "${YELLOW}Step 2: Building Docker image...${NC}"
docker build -t $ECR_REPOSITORY:$IMAGE_TAG .

# Step 3: Tag image for ECR
echo -e "${YELLOW}Step 3: Tagging image for ECR...${NC}"
ECR_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
docker tag $ECR_REPOSITORY:$IMAGE_TAG $ECR_IMAGE_URI

# Step 4: Push image to ECR
echo -e "${YELLOW}Step 4: Pushing image to ECR...${NC}"
docker push $ECR_IMAGE_URI

# Step 5: Update ECS task definition with new image
echo -e "${YELLOW}Step 5: Updating ECS task definition...${NC}"
TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition $ECS_TASK_FAMILY --region $AWS_REGION)
NEW_TASK_DEFINITION=$(echo $TASK_DEFINITION | jq --arg IMAGE $ECR_IMAGE_URI '.taskDefinition | .containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.compatibilities) | del(.registeredAt) | del(.registeredBy)')
NEW_TASK_INFO=$(aws ecs register-task-definition --region $AWS_REGION --cli-input-json "$NEW_TASK_DEFINITION")
NEW_REVISION=$(echo $NEW_TASK_INFO | jq '.taskDefinition.revision')

# Step 6: Update ECS service
echo -e "${YELLOW}Step 6: Updating ECS service...${NC}"
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --task-definition $ECS_TASK_FAMILY:$NEW_REVISION \
  --region $AWS_REGION \
  --force-new-deployment

echo -e "${GREEN}Deployment initiated successfully!${NC}"
echo -e "${YELLOW}Waiting for service to stabilize...${NC}"
aws ecs wait services-stable \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE \
  --region $AWS_REGION

echo -e "${GREEN}Deployment completed successfully!${NC}"