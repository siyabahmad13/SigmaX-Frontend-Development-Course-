# Scalable Healthcare System Design for Pakistan

## 1) System Architecture

### 1.1 High-level architecture (React + Node.js + PostgreSQL)

The platform is split into **four client experiences** backed by a shared, modular backend:

- **Patient App (React web/mobile-ready PWA)**
- **Doctor Portal**
- **Hospital Admin Panel**
- **Emergency Command Console** (for ambulance and rapid triage)

A production-grade architecture should use:

1. **Frontend layer (React)**
   - React SPA + component design system.
   - Role-based route guards (patient / doctor / admin / emergency-operator).
   - WebSocket client for live doctor availability, queue positions, and emergency status.

2. **API Gateway / BFF layer (Node.js)**
   - Single entry (`api.health.pk`) with rate limits, JWT validation, request tracing, and tenant scoping.
   - BFF composition endpoints for UI-specific payloads to reduce frontend chattiness.

3. **Domain microservices (Node.js services)**
   - **Identity & Access Service**: users, auth, RBAC, MFA.
   - **Patient Service**: demographics, medical profile, history snapshots.
   - **Doctor Service**: profiles, specialties, verification, schedule templates.
   - **Hospital Service**: branches, departments, bed status, staff mapping.
   - **Appointment Service**: booking lifecycle, waitlists, no-show handling.
   - **Availability Service (real-time)**: doctor online/offline/in-consultation, slot inventory.
   - **Emergency Service**: SOS alerts, dispatch workflow, nearest-hospital routing.
   - **Notification Service**: SMS/WhatsApp/push/email for reminders and critical alerts.
   - **Billing/Claims Service** (optional phase-2): invoices, insurance integration.

4. **Data layer (PostgreSQL + cache + event bus)**
   - **PostgreSQL** as source of truth (normalized relational core).
   - **Redis** for live presence, short TTL availability state, OTP/session caches.
   - **Message broker** (Kafka/RabbitMQ/NATS) for asynchronous events (appointment created, doctor status changed, emergency raised).
   - **Read replicas** for analytics/reporting-heavy queries.

5. **Infrastructure & operations**
   - Containerized deployment (Kubernetes/EKS/AKS/GKE/on-prem).
   - Auto-scaling on CPU + queue lag + websocket connection count.
   - Observability: OpenTelemetry traces, centralized logs, SLO alerts.
   - Multi-region DR strategy (primary + warm standby) due to healthcare criticality.

---

### 1.2 Core workflows

#### A) Patient appointment flow
1. Patient searches by specialty/city/language.
2. Doctor Service returns matching doctors.
3. Availability Service streams real-time slots.
4. Appointment Service reserves slot (optimistic lock + idempotency key).
5. Notification Service sends confirmation and reminders.

#### B) Real-time doctor availability flow
1. Doctor toggles status (available / busy / offline).
2. Doctor app heartbeat updates presence in Redis.
3. Availability Service publishes `doctor.status.changed` event.
4. WebSocket gateway pushes updates to subscribed patients/hospitals.
5. Periodic reconciliation persists snapshots to PostgreSQL.

#### C) Emergency flow
1. Patient triggers SOS (location + symptom category + optional audio).
2. Emergency Service computes nearest capable hospital (geo + facility matrix).
3. Dispatch ticket is generated and pushed to Emergency Console.
4. Hospital admin acknowledges and assigns team/ambulance.
5. Live state transitions: `raised -> triaged -> dispatched -> arrived -> closed`.

---

### 1.3 Scalability and reliability patterns

- **Stateless Node.js services** behind load balancers.
- **CQRS-lite** for hot read paths (availability/search projections).
- **Outbox pattern** for reliable event publication from PostgreSQL.
- **Idempotent write APIs** (important for unstable mobile networks).
- **Partitioning/sharding strategy** by province/hospital network at higher scale.
- **Graceful degradation**:
  - If WebSocket fails, fall back to polling.
  - If availability cache fails, use DB snapshot with stale badge.
- **Security/compliance controls**:
  - TLS everywhere, encryption at rest.
  - PII field-level encryption (CNIC/passport/medical notes).
  - Fine-grained audit logs for every medical record access.

---

## 2) Database Schema (PostgreSQL)

Below is a practical relational model (core tables only).

### 2.1 Identity and access

- `users`
  - `id (uuid, pk)`
  - `phone (varchar, unique)`
  - `email (varchar, unique, nullable)`
  - `password_hash (text)`
  - `status (active/suspended/pending_verification)`
  - `created_at`, `updated_at`

- `roles`
  - `id (pk)`
  - `name (patient/doctor/hospital_admin/emergency_operator/super_admin)`

- `user_roles`
  - `user_id (fk users.id)`
  - `role_id (fk roles.id)`
  - composite pk (`user_id`, `role_id`)

### 2.2 Patient domain

- `patients`
  - `id (uuid, pk)`
  - `user_id (fk users.id, unique)`
  - `full_name`, `dob`, `gender`, `blood_group`
  - `cnic_encrypted (bytea)`
  - `address`, `city`, `province`

- `patient_emergency_contacts`
  - `id (uuid, pk)`
  - `patient_id (fk patients.id)`
  - `name`, `relationship`, `phone`

- `medical_records`
  - `id (uuid, pk)`
  - `patient_id (fk patients.id)`
  - `doctor_id (fk doctors.id)`
  - `record_type (visit/lab/prescription/discharge)`
  - `payload_json (jsonb)`
  - `created_at`

### 2.3 Doctor and hospital domain

- `hospitals`
  - `id (uuid, pk)`
  - `name`, `license_no`, `ntn`
  - `address`, `city`, `province`
  - `lat`, `lng`
  - `is_emergency_enabled (bool)`

- `departments`
  - `id (uuid, pk)`
  - `hospital_id (fk hospitals.id)`
  - `name`

- `doctors`
  - `id (uuid, pk)`
  - `user_id (fk users.id, unique)`
  - `pmc_license_no (unique)`
  - `specialty`, `years_experience`
  - `consultation_fee`
  - `is_verified (bool)`

- `doctor_hospital_affiliations`
  - `doctor_id (fk doctors.id)`
  - `hospital_id (fk hospitals.id)`
  - `department_id (fk departments.id)`
  - `is_primary (bool)`
  - composite pk (`doctor_id`, `hospital_id`, `department_id`)

- `doctor_schedules`
  - `id (uuid, pk)`
  - `doctor_id (fk doctors.id)`
  - `hospital_id (fk hospitals.id)`
  - `weekday (0-6)`
  - `start_time`, `end_time`, `slot_minutes`

- `doctor_availability_state`
  - `doctor_id (pk, fk doctors.id)`
  - `current_state (available/busy/offline/in_emergency)`
  - `last_heartbeat_at`
  - `current_hospital_id (nullable)`

### 2.4 Appointments and queueing

- `appointments`
  - `id (uuid, pk)`
  - `patient_id (fk patients.id)`
  - `doctor_id (fk doctors.id)`
  - `hospital_id (fk hospitals.id)`
  - `scheduled_start`, `scheduled_end`
  - `mode (in_person/video)`
  - `status (booked/confirmed/in_progress/completed/cancelled/no_show)`
  - `reason`
  - `created_by (fk users.id)`

- `appointment_events`
  - `id (uuid, pk)`
  - `appointment_id (fk appointments.id)`
  - `event_type`
  - `actor_user_id (fk users.id)`
  - `metadata (jsonb)`
  - `created_at`

### 2.5 Emergency system

- `emergency_cases`
  - `id (uuid, pk)`
  - `patient_id (fk patients.id, nullable)`
  - `reporter_phone`
  - `severity (low/medium/high/critical)`
  - `symptoms_json (jsonb)`
  - `lat`, `lng`
  - `nearest_hospital_id (fk hospitals.id, nullable)`
  - `status (raised/triaged/dispatched/arrived/closed/cancelled)`
  - `created_at`, `closed_at`

- `emergency_dispatches`
  - `id (uuid, pk)`
  - `case_id (fk emergency_cases.id)`
  - `hospital_id (fk hospitals.id)`
  - `ambulance_ref`
  - `driver_name`, `driver_phone`
  - `eta_minutes`
  - `status (assigned/en_route/on_scene/completed)`

### 2.6 Key indexes

- `appointments (doctor_id, scheduled_start)`
- `appointments (patient_id, scheduled_start desc)`
- `doctors (specialty)`
- `hospitals (city, province)`
- `emergency_cases using gist (ll_to_earth(lat,lng))` or PostGIS geometry index
- `medical_records (patient_id, created_at desc)`

---

## 3) API Structure

Use versioned REST for transactional operations + WebSockets for real-time streams.

### 3.1 API gateway conventions

- Base path: `/api/v1`
- Auth: `Authorization: Bearer <JWT>`
- Idempotency: `Idempotency-Key` header for booking/payment/emergency create endpoints.
- Correlation: `X-Request-Id` header propagated across services.

### 3.2 Core endpoint groups

#### Auth & users
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`

#### Patients
- `GET /api/v1/patients/me/profile`
- `PUT /api/v1/patients/me/profile`
- `GET /api/v1/patients/me/medical-records`
- `POST /api/v1/patients/me/emergency-contacts`

#### Doctors
- `GET /api/v1/doctors?city=&specialty=&language=&available_now=`
- `GET /api/v1/doctors/{doctorId}`
- `PUT /api/v1/doctors/me/profile`
- `PUT /api/v1/doctors/me/availability`
- `GET /api/v1/doctors/me/appointments?date=`

#### Hospitals / admin
- `GET /api/v1/hospitals`
- `POST /api/v1/hospitals/{hospitalId}/departments`
- `POST /api/v1/hospitals/{hospitalId}/doctors/{doctorId}/attach`
- `GET /api/v1/hospitals/{hospitalId}/dashboard-metrics`

#### Appointments
- `POST /api/v1/appointments`
- `GET /api/v1/appointments/{id}`
- `POST /api/v1/appointments/{id}/confirm`
- `POST /api/v1/appointments/{id}/cancel`
- `POST /api/v1/appointments/{id}/check-in`

#### Emergency
- `POST /api/v1/emergency/cases`
- `GET /api/v1/emergency/cases/{id}`
- `POST /api/v1/emergency/cases/{id}/triage`
- `POST /api/v1/emergency/cases/{id}/dispatch`
- `POST /api/v1/emergency/cases/{id}/close`

### 3.3 Real-time channels

WebSocket namespace: `/ws`

- `doctor.availability.updated`
- `appointment.queue.updated`
- `emergency.case.updated`
- `hospital.capacity.updated`

For resilience, support fallback SSE/poll endpoint:
- `GET /api/v1/realtime/doctor-availability?doctorIds=...`

---

## 4) Tech Stack Justification

### Frontend: React
- Mature ecosystem for complex, role-based dashboards and patient flows.
- Strong state/query tooling (React Query/Redux Toolkit) for caching and retries on unstable networks.
- PWA support helps in Pakistan where mobile-first usage and variable connectivity are common.

### Backend: Node.js
- Excellent for I/O heavy workloads (APIs, websockets, notifications).
- Shared language (TypeScript) across frontend/backend improves delivery speed and maintainability.
- Rich ecosystem for auth, validation, observability, and event-driven integration.

### Database: PostgreSQL
- ACID reliability required for appointments/emergency state transitions.
- Strong indexing, JSONB flexibility (medical metadata), partitioning, and replication support.
- PostGIS extension enables accurate geo queries for emergency nearest-hospital routing.

### Complementary components (recommended)
- **Redis**: low-latency real-time presence and cache.
- **Kafka/RabbitMQ**: decoupled event propagation.
- **Object storage (S3-compatible)**: prescriptions/reports/voice attachments.
- **Elasticsearch/OpenSearch (optional)**: advanced doctor/hospital search at scale.

---

## Non-functional requirements checklist

- **Security**: RBAC + ABAC, MFA for doctors/admins, audit trails, secret rotation.
- **Compliance**: data retention policies, consent capture, medical access logging.
- **Performance targets**:
  - P95 read API < 300ms
  - P95 write API < 500ms
  - Real-time status propagation < 2s
- **Availability targets**:
  - 99.9% for core patient/doctor APIs
  - 99.95% for emergency APIs
- **Disaster recovery**:
  - RPO ≤ 5 minutes
  - RTO ≤ 30 minutes

This architecture can start as a **modular monolith** in Node.js and evolve into microservices by extracting the highest-load modules first (availability, appointment, emergency).
