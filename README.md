# Wood Server

A Node.js/TypeScript Express server application with Docker and AWS ECS Fargate deployment support.

## 🚀 Quick Start

### Run Locally with Docker

```bash
# 1. Create .env file with your configuration
# 2. Start services
docker-compose up -d

# 3. Access application
curl http://localhost:5000/
```

### Deploy to AWS ECS Fargate

```bash
# 1. Configure AWS CLI
aws configure

# 2. Run initial setup
./scripts/setup-aws.sh

# 3. Deploy application
./scripts/deploy.sh
```

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Visual step-by-step setup guide (Start here!)
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Detailed Docker & AWS instructions
- **[QUICK_START.md](./QUICK_START.md)** - Quick deployment reference
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Command cheat sheet
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment documentation

## 🛠️ Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Cache:** Redis
- **Container:** Docker
- **Cloud:** AWS ECS Fargate

## 📋 Prerequisites

- Docker Desktop
- AWS Account
- AWS CLI configured
- PostgreSQL database
- Redis instance

## 🐳 Docker Commands

```bash
docker-compose up -d          # Start services
docker-compose logs -f app    # View logs
docker-compose down           # Stop services
docker-compose up -d --build  # Rebuild and start
```

## ☁️ AWS Resources

- ECS Fargate for container orchestration
- ECR for Docker image storage
- Application Load Balancer
- Secrets Manager for environment variables
- CloudWatch for logging

## 📝 Environment Variables

See `.env.example` for all required environment variables.

For AWS deployment, store all secrets in AWS Secrets Manager with prefix `wood-server/`.

## 🔗 Links

- Original project: [ph-health-care-server](https://github.com/Apollo-Level2-Web-Dev/ph-health-care-server/commit/083a11c3fdaaa67d90f59a91c1eff0483b31a0ec)