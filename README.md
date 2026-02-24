# Scalable Healthcare System Design - Pakistan (Implementation Starter)

This repository contains a full-stack starter aligned with your architecture:

- **Frontend (`frontend/`)**: React role-based portals (Patient, Doctor, Hospital Admin, Emergency Console).
- **Backend (`backend/`)**: Node.js API gateway style app with versioned REST endpoints and websocket channel (`/ws`).
- **Data (`backend/src/db/schema.sql`)**: PostgreSQL schema for identity, patient, doctor, hospital, appointments, and emergency domains.
- **Infra (`infra/docker-compose.yml`)**: Postgres + Redis + RabbitMQ stack for local development.

## What is implemented

- `/api/v1/auth`: register/login/me user APIs with JWT.
- `/api/v1/doctors`: search and doctor availability updates.
- `/api/v1/appointments`: idempotent create, get, cancel.
- `/api/v1/emergency`: create and transition emergency cases.
- websocket events:
  - `doctor.availability.updated`
  - `appointment.queue.updated`
  - `emergency.case.updated`

## Run backend

```bash
cd backend
npm install
npm run dev
```

Server runs at `http://localhost:4000`.

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs via Vite and can call backend endpoints.

## Local platform dependencies

```bash
cd infra
docker compose up -d
```

## Suggested next enhancements

1. Replace in-memory store with PostgreSQL repositories.
2. Add Redis-backed presence and heartbeat TTL.
3. Add outbox table + worker for reliable broker publication.
4. Add OpenTelemetry + structured audit logs.
5. Split availability and emergency modules into dedicated deployable services.
