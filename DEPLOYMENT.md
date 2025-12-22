# 🚀 Deployment Guide - EduFlow LMS

Complete guide for deploying EduFlow LMS to production.

## Table of Contents
1. [Vercel Deployment](#vercel-deployment-recommended)
2. [Docker Deployment](#docker-deployment)
3. [VPS Deployment](#vps-deployment-digitalocean-aws-etc)
4. [Environment Configuration](#environment-configuration)
5. [Post-Deployment](#post-deployment-checklist)

---

## Vercel Deployment (Recommended)

### Prerequisites
- Vercel account
- MongoDB Atlas cluster (free tier available)
- GitHub repository

### Steps

#### 1. Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (or use 0.0.0.0/0 for all)
5. Get connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/eduflow_lms?retryWrites=true&w=majority
   ```

#### 2. Deploy to Vercel

**Option A: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `OPENAI_API_KEY` (optional)
5. Click "Deploy"

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Deploy to production
vercel --prod
```

#### 3. Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records
4. Update `NEXTAUTH_URL` to your domain

---

## Docker Deployment

### Using Docker Compose

#### 1. Create Production Compose File

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network

  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - mongodb
    networks:
      - app-network

volumes:
  mongodb_data:

networks:
  app-network:
```

#### 2. Deploy

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

### Using Docker Hub

#### 1. Build and Push

```bash
# Build
docker build -t yourusername/eduflow-lms:latest .

# Login to Docker Hub
docker login

# Push
docker push yourusername/eduflow-lms:latest
```

#### 2. Pull and Run

```bash
# Pull image
docker pull yourusername/eduflow-lms:latest

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="your-mongodb-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://yourdomain.com" \
  --name eduflow-lms \
  yourusername/eduflow-lms:latest
```

---

## VPS Deployment (DigitalOcean, AWS, etc.)

### Prerequisites
- VPS with Ubuntu 22.04
- Root or sudo access
- Domain name (optional)

### Step 1: Initial Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get install -y docker-compose-plugin
```

### Step 2: Clone and Setup

```bash
# Clone repository
git clone https://github.com/yourusername/eduflow-lms.git
cd eduflow-lms

# Create .env file
cp .env.example .env
nano .env
# Configure your environment variables
```

### Step 3: Install Dependencies and Build

```bash
# Install dependencies
npm install

# Build application
npm run build
```

### Step 4: Setup Process Manager

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "eduflow-lms" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# View logs
pm2 logs eduflow-lms
```

### Step 5: Setup Nginx (Reverse Proxy)

```bash
# Install Nginx
apt-get install -y nginx

# Create Nginx configuration
nano /etc/nginx/sites-available/eduflow
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/eduflow /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 6: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is setup automatically
# Test renewal
certbot renew --dry-run
```

### Step 7: Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443

# Enable firewall
ufw enable
```

---

## Environment Configuration

### Required Variables

```env
# Database (REQUIRED)
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/eduflow_lms"

# NextAuth (REQUIRED)
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# App Configuration
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_NAME="EduFlow LMS"
```

### Optional Variables

```env
# AI Features
OPENAI_API_KEY="sk-..."
# OR
GROQ_API_KEY="gsk-..."

# Email Notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

---

## Post-Deployment Checklist

### Security

- [ ] Enable HTTPS/SSL
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Restrict MongoDB IP whitelist
- [ ] Enable firewall
- [ ] Regular security updates
- [ ] Setup backup strategy

### Performance

- [ ] Enable CDN (Vercel Edge, Cloudflare)
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Monitor performance metrics

### Monitoring

- [ ] Setup error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Setup log aggregation
- [ ] Monitor database performance

### Database

- [ ] Create database backups
- [ ] Setup automated backup schedule
- [ ] Test restore process
- [ ] Monitor storage usage

### Testing

- [ ] Test all API endpoints
- [ ] Verify authentication flow
- [ ] Test course creation
- [ ] Check enrollment process
- [ ] Test on multiple devices

---

## Continuous Deployment

### GitHub Actions (Automatic)

The project includes GitHub Actions workflows:

1. **.github/workflows/ci-cd.yml** - Runs tests on push
2. **.github/workflows/deploy.yml** - Deploys to Vercel on main branch

#### Setup Secrets

Add these secrets to your GitHub repository:

```
VERCEL_TOKEN - Your Vercel token
DOCKER_USERNAME - Docker Hub username
DOCKER_PASSWORD - Docker Hub password
```

---

## Troubleshooting

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongosh "your-connection-string"

# Check MongoDB Atlas IP whitelist
# Add your server IP or 0.0.0.0/0
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Out of Memory

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## Rollback Strategy

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Docker

```bash
# Pull previous version
docker pull yourusername/eduflow-lms:previous-tag

# Stop current
docker stop eduflow-lms

# Start previous version
docker run -d --name eduflow-lms yourusername/eduflow-lms:previous-tag
```

---

## Support

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/yourusername/eduflow-lms/issues)
- 💬 [Discussions](https://github.com/yourusername/eduflow-lms/discussions)

---

**Production Checklist**: Before going live, ensure you've completed all items in the [Post-Deployment Checklist](#post-deployment-checklist).

