LEGAL-Nexus

> **Bridge to Justice**: An AI-native Legal Intelligence, Case Intake, and Legal Ecosystem Platform for India.

---

## 📌 Architecture Overview

 LEGAL-Nexus is architected as a modular monorepo containing:

- **`frontend/`**: React 19 + Tailwind CSS + Lucide Icons + Vite dashboard for Citizens, Lawyers, Law Students, and Admins.
- **`backend/`**: Node.js + Express REST API with MongoDB (16+ Mongoose models), Redis caching & background processing queues, JWT + Role-Based Access Control (RBAC), and Audit Logging.
- **`ai-engine/`**: Python + FastAPI microservice skeleton for AI workers, legal RAG, and drafting pipelines.
- **`ingestion/`**: Legal document and statutory corpus processing pipeline.
- **`docker/`**: Multi-container Docker Compose configuration for local dev and deployment.
- **`docs/`**: Comprehensive Architecture, API Reference, Data Model, and Environment Setup documentation.

```
React Frontend (Port 5173)
      ↓
Node.js + Express (Port 5000)
      ↓
MongoDB (Port 27017)
      ↕
Redis (Port 6379)
      ↓
AI Engine / Worker (Port 8000)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm >= 9
- MongoDB (or Docker)
- Redis (or Docker)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nyaya-setu.git
cd nyaya-setu

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cp .env.example backend/.env
```

### 3. Run with Docker Compose (Recommended)

```bash
docker-compose -f docker/docker-compose.yml up --build
```

### 4. Run Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

The backend will start on `http://localhost:5000` and the frontend on `http://localhost:5173`.

---

## 🧪 Testing

```bash
# Run backend test suite
cd backend
npm test
```

---

## 📚 Documentation

- [Architecture Guide](docs/architecture.md)
- [API Reference](docs/api_reference.md)
- [Data Model & Schema Guide](docs/data_model.md)
- [Environment Setup Guide](docs/environment_setup.md)

---

## 📄 License
MIT © LEGAL-Nexus Contributors
