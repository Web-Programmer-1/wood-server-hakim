# Complete Setup Guide - Step by Step

This is a simplified, visual guide to get you started quickly.

## 🐳 Running Locally with Docker

### Quick Start (5 minutes)

1. **Create `.env` file:**
   ```bash
   # Copy this template and fill in your values
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://user:pass@host:5432/db
   JWT_SECRET=your-secret-key
   # ... (see DOCKER_SETUP.md for full list)
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Check if running:**
   ```bash
   curl http://localhost:5000/
   ```

That's it! Your app is running at http://localhost:5000

---

## ☁️ AWS Setup - Visual Walkthrough

### Phase 1: AWS Account Setup (5 minutes)

1. **Login to AWS Console:** https://console.aws.amazon.com
2. **Configure AWS CLI:**
   ```bash
   aws configure
   # Enter your Access Key, Secret Key, Region
   ```

### Phase 2: Create Basic Resources (10 minutes)

Run this command to create ECR and ECS cluster:

```bash
./scripts/setup-aws.sh
```

Or manually in AWS Console:

1. **ECR (Docker Registry):**
   - Go to: ECR → Create repository
   - Name: `wood-server`
   - Enable: "Scan on push"

2. **ECS Cluster:**
   - Go to: ECS → Clusters → Create
   - Name: `wood-server-cluster`
   - Infrastructure: AWS Fargate

3. **CloudWatch Logs:**
   - Go to: CloudWatch → Log groups → Create
   - Name: `/ecs/wood-server`

### Phase 3: Networking Setup (15 minutes)

**Option A: Use Default VPC (Easiest)**

1. Go to: VPC → Your VPCs
2. Note your default VPC ID and subnet IDs
3. Use these in your configuration

**Option B: Create New VPC (Recommended for Production)**

1. **Create VPC:**
   - Go to: VPC → Create VPC
   - Name: `wood-server-vpc`
   - IPv4 CIDR: `10.0.0.0/16`

2. **Create Subnets:**
   - Create 2 public subnets in different availability zones
   - Example: `10.0.1.0/24` in us-east-1a, `10.0.2.0/24` in us-east-1b

3. **Create Internet Gateway:**
   - Attach to your VPC
   - Update route table to route `0.0.0.0/0` to Internet Gateway

### Phase 4: Security Groups (5 minutes)

1. **Application Security Group:**
   - Go to: EC2 → Security Groups → Create
   - Name: `wood-server-sg`
   - Inbound: Port 5000 from ALB security group
   - Outbound: All traffic

2. **ALB Security Group:**
   - Name: `wood-server-alb-sg`
   - Inbound: Port 80, 443 from `0.0.0.0/0`
   - Outbound: All traffic

### Phase 5: Load Balancer (10 minutes)

1. **Create Target Group:**
   - Go to: EC2 → Target Groups → Create
   - Name: `wood-server-tg`
   - Protocol: HTTP, Port: 5000
   - Health check path: `/`
   - VPC: Your VPC

2. **Create Load Balancer:**
   - Go to: EC2 → Load Balancers → Create
   - Type: Application Load Balancer
   - Name: `wood-server-alb`
   - Scheme: Internet-facing
   - Subnets: Select your public subnets
   - Security group: `wood-server-alb-sg`
   - Listeners: HTTP on port 80

3. **Register Target Group:**
   - In ALB, go to Listeners → Edit rules
   - Add action: Forward to `wood-server-tg`

### Phase 6: IAM Roles (10 minutes)

1. **Task Execution Role:**
   - Go to: IAM → Roles → Create role
   - Trusted entity: ECS tasks
   - Attach policies:
     - `AmazonECSTaskExecutionRolePolicy`
   - Add custom policy for Secrets Manager:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Action": [
           "secretsmanager:GetSecretValue",
           "kms:Decrypt"
         ],
         "Resource": "*"
       }]
     }
     ```
   - Name: `ecsTaskExecutionRole`

2. **Task Role:**
   - Create role: `ecsTaskRole`
   - Trusted entity: ECS tasks
   - Add S3 access if needed (for file uploads)

### Phase 7: Secrets Manager (15 minutes)

1. **Go to:** Secrets Manager → Store a new secret

2. **For each secret:**
   - Secret type: Other type of secret
   - Key/value: `database-url` / `postgresql://...`
   - Secret name: `wood-server/database-url`
   - Repeat for all environment variables

**Required Secrets:**
- `wood-server/database-url`
- `wood-server/jwt-secret`
- `wood-server/refresh-token-secret`
- `wood-server/expires-in`
- `wood-server/refresh-token-expires-in`
- `wood-server/reset-pass-token`
- `wood-server/reset-pass-token-expires-in`
- `wood-server/salt-round`
- `wood-server/reset-pass-link`
- `wood-server/cloudinary-cloud-name`
- `wood-server/cloudinary-api-key`
- `wood-server/cloudinary-api-secret`
- `wood-server/stripe-secret-key`
- `wood-server/openrouter-api-key`
- `wood-server/email`
- `wood-server/app-pass`
- `wood-server/redis-host`
- `wood-server/redis-port`
- `wood-server/redis-pass`

### Phase 8: Update Configuration Files (10 minutes)

**Update `ecs-task-definition.json`:**

1. Find and replace `YOUR_ACCOUNT_ID`:
   ```bash
   # Get your account ID
   aws sts get-caller-identity --query Account --output text
   ```

2. Find and replace `REGION` with your region (e.g., `us-east-1`)

3. Update secret ARNs:
   - Go to Secrets Manager
   - Click on each secret
   - Copy the ARN
   - Replace in task definition

4. Update role ARNs:
   - Go to IAM → Roles
   - Copy ARN for `ecsTaskExecutionRole` and `ecsTaskRole`
   - Replace in task definition

**Update `ecs-service-definition.json`:**

1. Update subnet IDs (from Phase 3)
2. Update security group ID (from Phase 4)
3. Update target group ARN (from Phase 5)

### Phase 9: Build and Push Image (5 minutes)

```bash
# Set variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push
docker build -t wood-server:latest .
docker tag wood-server:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/wood-server:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/wood-server:latest
```

### Phase 10: Deploy to ECS (5 minutes)

```bash
# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json

# Create service
aws ecs create-service \
  --cli-input-json file://ecs-service-definition.json
```

### Phase 11: Verify (5 minutes)

1. **Check service status:**
   ```bash
   aws ecs describe-services \
     --cluster wood-server-cluster \
     --services wood-server-service
   ```

2. **Get ALB URL:**
   ```bash
   aws elbv2 describe-load-balancers \
     --names wood-server-alb \
     --query 'LoadBalancers[0].DNSName' \
     --output text
   ```

3. **Test:**
   ```bash
   curl http://YOUR-ALB-DNS-NAME/
   ```

---

## 🚀 Quick Commands Reference

### Local Docker
```bash
docker-compose up -d          # Start
docker-compose logs -f app    # View logs
docker-compose down           # Stop
docker-compose up -d --build  # Rebuild
```

### AWS Deployment
```bash
./scripts/deploy.sh           # Full deployment
aws ecs list-services         # List services
aws logs tail /ecs/wood-server --follow  # View logs
```

---

## 📋 Checklist

### Local Setup
- [ ] Docker installed
- [ ] `.env` file created
- [ ] `docker-compose up -d` successful
- [ ] App responds at http://localhost:5000

### AWS Setup
- [ ] AWS CLI configured
- [ ] ECR repository created
- [ ] ECS cluster created
- [ ] VPC and subnets configured
- [ ] Security groups created
- [ ] Load balancer created
- [ ] IAM roles created
- [ ] Secrets stored in Secrets Manager
- [ ] Configuration files updated
- [ ] Docker image pushed to ECR
- [ ] Task definition registered
- [ ] ECS service created
- [ ] Application accessible via ALB

---

## 🆘 Need Help?

- **Local issues:** Check `docker-compose logs`
- **AWS issues:** Check CloudWatch logs at `/ecs/wood-server`
- **Detailed guide:** See [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- **Full documentation:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

