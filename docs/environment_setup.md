# LEGAL-Nexus — Environment Setup & Configuration

This guide details setting up the local development environment for LEGAL-Nexus.

---

## 1. Prerequisites

- **Node.js**: v18.x or v20.x+ (`node -v`)
- **npm**: v9.x or v10.x+ (`npm -v`)
- **MongoDB**: Community Server (v6.0+) or MongoDB Atlas cluster
- **Redis**: v6.2+ or v7.x (`redis-server`)
- **Python**: v3.10+ (for `ai-engine` and `ingestion`)

---

## 2. Environment Variables

Create a `.env` file in `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/nyaya-setu

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
JWT_SECRET=super_secret_jwt_key_nyaya_setu_dev_2026
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_nyaya_setu_2026
JWT_REFRESH_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500

# Logging
LOG_LEVEL=info
```

---

## 3. Running Services Locally

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Run Backend in Development Mode
```bash
npm run dev
```

### Step 3: Run Test Suite
```bash
npm test
```

---

## 4. Running with Docker Compose

To spin up MongoDB, Redis, Backend, Frontend, and AI Engine together:

```bash
docker-compose -f docker/docker-compose.yml up --build
```
