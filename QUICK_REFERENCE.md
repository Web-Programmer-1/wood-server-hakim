# Quick Reference Card

## 🐳 Local Docker Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f app

# Rebuild after changes
docker-compose up -d --build

# Stop
docker-compose down

# Clean everything
docker-compose down -v
```

## ☁️ AWS Deployment Commands

```bash
# Initial setup (one-time)
./scripts/setup-aws.sh

# Deploy application
./scripts/deploy.sh

# Or manual deployment:
# 1. Build and push
docker build -t wood-server:latest .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker tag wood-server:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/wood-server:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/wood-server:latest

# 2. Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# 3. Update service
aws ecs update-service --cluster wood-server-cluster --service wood-server-service --force-new-deployment
```

## 📝 Environment Variables

### Required for Local (.env file)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
RESET_PASS_TOKEN=...
RESET_PASS_TOKEN_EXPIRES_IN=1h
SALT_ROUND=10
RESET_PASS_LINK=http://localhost:3000/reset-password
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET_KEY=...
OPENROUTER_API_KEY=...
EMAIL=...
APP_PASS=...
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASS=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

### For AWS (Store in Secrets Manager)
All above variables should be stored as secrets with prefix `wood-server/`

## 🔍 Troubleshooting Commands

```bash
# Local - Check if running
curl http://localhost:5000/
docker-compose ps

# AWS - Check service status
aws ecs describe-services --cluster wood-server-cluster --services wood-server-service

# AWS - View logs
aws logs tail /ecs/wood-server --follow

# AWS - List tasks
aws ecs list-tasks --cluster wood-server-cluster --service-name wood-server-service

# AWS - Get ALB URL
aws elbv2 describe-load-balancers --names wood-server-alb --query 'LoadBalancers[0].DNSName' --output text
```

## 📊 AWS Resource Checklist

- [ ] ECR Repository: `wood-server`
- [ ] ECS Cluster: `wood-server-cluster`
- [ ] CloudWatch Log Group: `/ecs/wood-server`
- [ ] VPC with 2+ subnets
- [ ] Security Groups (app + ALB)
- [ ] Application Load Balancer
- [ ] Target Group
- [ ] IAM Roles (execution + task)
- [ ] Secrets in Secrets Manager (18 secrets)
- [ ] Task Definition registered
- [ ] ECS Service running

## 🔗 Important URLs

- **Local:** http://localhost:5000
- **AWS Console:** https://console.aws.amazon.com
- **ECS:** https://console.aws.amazon.com/ecs
- **ECR:** https://console.aws.amazon.com/ecr
- **Secrets Manager:** https://console.aws.amazon.com/secretsmanager

## 📚 Documentation Files

- `SETUP_GUIDE.md` - Visual step-by-step guide
- `DOCKER_SETUP.md` - Detailed Docker & AWS instructions
- `DEPLOYMENT.md` - Complete deployment documentation
- `QUICK_START.md` - Quick deployment guide

