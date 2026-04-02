# Ticket Priority Predictor

A full-stack ITSM-style ticket management platform with AI-assisted priority prediction.

## Overview

This project includes:

- A React frontend for ticket workflows, dashboards, analytics, team views, and settings.
- A Node.js + Express backend for auth, ticket APIs, team/user management, uploads, and AI routes.
- MongoDB with Mongoose for data persistence.
- ONNX model inference in backend for local priority prediction.
- Optional Gemini integration for assistant/chat behavior.
- Socket.IO for real-time ticket updates.

## Architecture

### Frontend (root + src)

- React 19 + Vite (rolldown-vite)
- React Router for page navigation
- React Query for server-state fetching/caching
- Zustand for global app state
- Tailwind CSS for styling
- Recharts for analytics visualizations
- Axios API client in src/services/api.js

### Backend (backend)

- Node.js runtime + Express framework
- MongoDB via Mongoose
- JWT auth + bcryptjs password hashing
- Security middleware: helmet, cors, compression, express-rate-limit
- Upload stack: multer + Cloudinary integration
- Socket.IO server for realtime events

### AI/ML

- Local inference with onnxruntime-node
- ONNX model artifact at backend/models/priority_model.onnx
- Inference module in backend/utils/mlPredict.js
- Fallback heuristic classifier when model/runtime is unavailable
- Model health endpoint: GET /api/ai/model-health (auth protected)

## Repository Structure

- src/: frontend source
- backend/: backend API, DB, model, scripts
- public/: static frontend assets
- dist/: frontend production build output
- revision.txt: detailed file-by-file architecture notes
- ai model.txt: detailed ML methodology and model behavior notes

## API Surface

Base backend URL (default): http://localhost:5000/api

Main route groups:

- /api/auth
- /api/tickets
- /api/teams
- /api/users
- /api/upload
- /api/ai
- /api/health

AI routes:

- POST /api/ai/chat
- POST /api/ai/suggest-priority
- GET /api/ai/model-health (requires auth)

## Environment Variables

Create backend/.env with the following keys as needed:

- PORT=5000
- MONGODB_URI=mongodb://localhost:27017/ticketpro
- CLIENT_URL=http://localhost:5173
- JWT_SECRET=replace_with_strong_secret
- JWT_EXPIRE=7d
- GEMINI_API_KEY=optional_for_chat_features
- CLOUDINARY_CLOUD_NAME=optional_if_using_cloud_upload
- CLOUDINARY_API_KEY=optional_if_using_cloud_upload
- CLOUDINARY_API_SECRET=optional_if_using_cloud_upload

Notes:

- If GEMINI_API_KEY is missing, AI suggest-priority falls back to local predictor.
- If ONNX runtime/model is unavailable, backend falls back to heuristic scoring.

## Setup

### 1) Install dependencies

Frontend/root:

```bash
npm install
```

Backend:

```bash
cd backend
npm install
```

### 2) Start backend

```bash
cd backend
npm run dev
```

or

```bash
cd backend
npm run start
```

### 3) Start frontend

```bash
npm run dev
```

Frontend default: http://localhost:5173

## Scripts

### Root scripts

- npm run dev: start frontend dev server
- npm run build: build production frontend bundle
- npm run preview: serve built frontend locally
- npm run lint: run ESLint across project scopes

### Backend scripts

- npm run start: start backend server
- npm run dev: start backend with nodemon
- npm run seed: seed database
- npm run check:model: run model inference smoke test
- node scripts/checkModelHealth.js: print model runtime health details

## Real-Time Events

Backend emits Socket.IO events:

- ticket_created
- ticket_updated
- team-scoped events via rooms named team_<teamId>

This enables dashboard/list updates without full page refreshes.

## Security and Reliability

- JWT-protected routes for sensitive operations
- CORS allowlist and credentials handling
- Helmet security headers
- Request rate limiting
- Centralized error handling middleware
- Model fallback path to prevent AI-related downtime

## AI Model Notes

Current ML method:

- Supervised multiclass classification
- RandomForestClassifier trained in Python
- Exported to ONNX and served in Node.js

Inference inputs (engineered features):

- sentiment score
- enterprise flag
- critical-keyword flag
- text length

Detailed docs:

- See revision.txt for architecture and file mapping.
- See ai model.txt for model internals, examples, and limitations.

## Health Checks

- Backend health: GET /api/health
- Model health: GET /api/ai/model-health (requires auth)

## Recent Important Updates

- Added ONNX runtime integration and model health endpoint.
- Added frontend settings card to monitor model health.
- Added model validation scripts.
- Removed deprecated MongoDB connection options.
- Added frontend chunk-splitting strategy in Vite config.
- Updated ESLint config for mixed frontend/backend repository setup.
- Improved env-file security handling and removed backend/.env from tracked history.

## Recommended Next Steps

- Add CI workflow for lint/build/smoke tests.
- Add integration tests for auth and ticket creation flows.
- Add model evaluation metrics tracking for retraining decisions.
