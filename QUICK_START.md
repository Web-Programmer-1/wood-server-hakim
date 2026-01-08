# Quick Start Guide - AWS ECS Fargate Deployment

## Prerequisites Checklist

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Docker installed and running
- [ ] jq installed (for deployment scripts)
- [ ] AWS account with appropriate permissions
- [ ] PostgreSQL database (RDS or external)
- [ ] Redis instance (ElastiCache or external)

## Quick Deployment Steps

### 1. Initial Setup (One-time)

```bash
# Run the setup script to create ECR repository and ECS cluster
chmod +x scripts/setup-aws.sh
./scripts/setup-aws.sh
```

### 2. Configure AWS Resources

1. **Create VPC and Networking:**
   - Create VPC with public/private subnets (2+ AZs)
   - Create Internet Gateway and NAT Gateway
   - Configure route tables

2. **Create Security Groups:**
   - Application SG: Allow port 5000 from ALB
   - ALB SG: Allow ports 80/443 from internet
   - Database SG: Allow port 5432 from application

3. **Create Application Load Balancer:**
   ```bash
   # Create target group
   aws elbv2 create-target-group \
     --name wood-server-tg \
     --protocol HTTP \
     --port 5000 \
     --vpc-id vpc-xxxxx \
     --health-check-path /
   
   # Create load balancer
   aws elbv2 create-load-balancer \
     --name wood-server-alb \
     --subnets subnet-xxxxx subnet-yyyyy \
     --security-groups sg-xxxxx
   ```

4. **Create IAM Roles:**
   - `ecsTaskExecutionRole` - For ECS to pull images and write logs
   - `ecsTaskRole` - For application to access AWS services

5. **Store Secrets in AWS Secrets Manager:**
   ```bash
   # Store each secret
   aws secretsmanager create-secret \
     --name wood-server/database-url \
     --secret-string "postgresql://..." \
     --region us-east-1
   ```

### 3. Update Configuration Files

1. **Update `ecs-task-definition.json`:**
   - Replace `YOUR_ACCOUNT_ID` with your AWS account ID
   - Replace `REGION` with your AWS region (e.g., `us-east-1`)
   - Update all secret ARNs
   - Update IAM role ARNs

2. **Update `ecs-service-definition.json`:**
   - Update subnet IDs
   - Update security group IDs
   - Update target group ARN

### 4. Build and Deploy

**Option A: Using Deployment Script**
```bash
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=123456789012
export ECR_REPOSITORY=wood-server
export ECS_CLUSTER=wood-server-cluster
export ECS_SERVICE=wood-server-service

./scripts/deploy.sh
```

**Option B: Manual Deployment**
```bash
# 1. Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# 2. Build image
docker build -t wood-server:latest .

# 3. Tag and push
docker tag wood-server:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wood-server:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/wood-server:latest

# 4. Register task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json \
  --region us-east-1

# 5. Create service
aws ecs create-service \
  --cli-input-json file://ecs-service-definition.json \
  --region us-east-1
```

### 5. Verify Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster wood-server-cluster \
  --services wood-server-service

# View logs
aws logs tail /ecs/wood-server --follow

# Test endpoint
curl http://YOUR_ALB_DNS_NAME/
```

## Local Testing with Docker Compose

```bash
# Create .env file with your configuration
cp .env.example .env
# Edit .env with your values

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## CI/CD with GitHub Actions

1. Add GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. Push to main branch - deployment will trigger automatically

## Environment Variables Reference

All environment variables should be stored in AWS Secrets Manager:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `REFRESH_TOKEN_SECRET` - Refresh token secret
- `EXPIRES_IN` - JWT expiration (e.g., "7d")
- `REFRESH_TOKEN_EXPIRES_IN` - Refresh token expiration
- `RESET_PASS_TOKEN` - Password reset token secret
- `RESET_PASS_TOKEN_EXPIRES_IN` - Reset token expiration
- `SALT_ROUND` - bcrypt salt rounds
- `RESET_PASS_LINK` - Password reset link template
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `EMAIL` - Email address for sending emails
- `APP_PASS` - Email app password
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `REDIS_PASS` - Redis password

## Troubleshooting

### Task fails to start
- Check CloudWatch logs: `/ecs/wood-server`
- Verify secrets are accessible
- Check security group rules
- Verify IAM role permissions

### Health check failures
- Verify app listens on port 5000
- Check health check path in target group
- Review application logs

### Cannot connect to database
- Verify security group allows traffic
- Check database endpoint
- Verify DATABASE_URL secret

## Cost Estimation

Approximate monthly costs (varies by region and usage):
- ECS Fargate (2 tasks, 0.5 vCPU, 1GB): ~$30-40
- Application Load Balancer: ~$20
- ECR storage: ~$1-2
- CloudWatch Logs: ~$5-10
- Data transfer: Variable

**Total: ~$60-80/month** (excluding RDS, ElastiCache, and data transfer)

## Next Steps

- Set up auto-scaling based on CPU/memory
- Configure CloudWatch alarms
- Set up backup strategies
- Implement blue/green deployments
- Configure custom domain with Route 53
- Set up AWS WAF for security

For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md)

