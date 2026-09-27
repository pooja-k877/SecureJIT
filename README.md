# SecureJIT
### Azure Privileged Identity Management (JIT Access) & Security Audit Engine

> **A production-ready Just-In-Time (JIT) Privileged Access Management solution designed to eliminate permanent administrative standing privileges in cloud infrastructure, backed by PostgreSQL.**

---

## 1. Project Overview

Organizations operating in Microsoft Azure and multi-cloud enterprise environments frequently grant users permanent privileged roles (e.g., *Contributor*, *Administrator*, *Owner*). Permanent standing privileges represent one of the most critical attack surfaces for credential compromise, lateral movement, insider threat, and ransomware.

**SecureJIT** solves this challenge by implementing a Just-In-Time (JIT) access broker. Rather than holding permanent admin rights, engineers and operators request temporary, time-bounded privilege elevations only when performing authorized work. Every request is evaluated by a transparent risk engine, submitted to an administrative approval workflow, governed by a live active countdown timer with automatic revocation upon expiration, and recorded in an immutable, forensic-grade audit log.

SecureJIT features a **PostgreSQL relational database** as its primary persistent store, along with a **Break-Glass Emergency Protocol (P1 / SEV-1)** for mission-critical incidents, ensuring rapid remediation without compromising compliance.

---

## 2. Architecture & Data Flow

```
React / TypeScript Frontend (Vite)
        ↓  (REST API / JWT Bearer)
Node.js / Express Backend (Port 3000)
        ↓  (pg.Pool / Parameterized SQL)
PostgreSQL Database ('securejit')
        ↓
Persistent Tables:
├── users
├── access_requests
├── active_access
├── audit_logs
└── notifications
```

---

## 3. Database Schema (`securejit`)

The database consists of 5 relational tables defined in `schema.sql`:

1. **`users`**:
   - `id`, `name`, `email` (unique), `password_hash` (bcrypt), `role` (`USER` | `ADMIN`), `department`, `status` (`ACTIVE` | `DISABLED`), `created_at`, `last_login`, `last_login_at`
2. **`access_requests`**:
   - `id`, `user_id` (FK to `users`), `user_name`, `user_email`, `resource`, `role`, `duration_minutes`, `reason`, `ticket_id`, `is_emergency`, `risk_level`, `risk_score`, `risk_reason`, `risk_reasons`, `status` (`PENDING` | `APPROVED` | `REJECTED` | `ACTIVE` | `EXPIRED` | `REVOKED`), `approved_by`, `approved_at`, `rejection_reason`, `reviewer_id`, `reviewer_name`, `review_comment`, `requested_at`, `reviewed_at`, `started_at`, `expires_at`
3. **`active_access`**:
   - `id`, `request_id` (FK to `access_requests`), `user_id` (FK to `users`), `user_name`, `user_email`, `resource`, `role`, `access_type` (`JIT` | `EMERGENCY`), `started_at`, `expires_at` (real ISO timestamp), `status` (`ACTIVE` | `REVOKED` | `EXPIRED`), `revoked_at`, `revoked_by`
4. **`audit_logs`**:
   - `id`, `user_id`, `user_name`, `user_email`, `action`, `resource`, `role`, `details`, `ip_address`, `created_at`, `timestamp`
   - Supported actions: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `REQUEST_CREATED`, `REQUEST_APPROVED`, `REQUEST_REJECTED`, `ACCESS_ACTIVATED`, `ACCESS_REVOKED`, `ACCESS_EXPIRED`, `EMERGENCY_REQUESTED`, `EMERGENCY_ACTIVATED`, `EMERGENCY_EXPIRED`, `PASSWORD_CHANGED`
5. **`notifications`**:
   - `id`, `user_id` (FK to `users`), `title`, `message`, `type` (`INFO` | `SUCCESS` | `WARNING` | `ALERT`), `request_id`, `is_read`, `created_at`

---

## 4. Key Differentiating Features

1. **PostgreSQL Primary Persistence**: Real relational persistence across all entities using PostgreSQL queries via connection pooling (`pg.Pool`).
2. **Just-In-Time (JIT) Elevation**: Grants temporary role assignments for 15, 30, 45, 60, 120, or 240 minutes.
3. **Deterministic Rule-Based Risk Engine**: Evaluates role severity, resource sensitivity, requested duration, and break-glass flags to assign an explainable risk tier (*LOW*, *MEDIUM*, *HIGH*, *CRITICAL*) with bulleted justifications.
4. **Two-Tier Approval Workflow**: Administrators review pending requests with access history context, granting approval with notes or rejecting with mandatory security justifications.
5. **Real Ticking Countdown Timer**: Real-time browser and server timer calculated dynamically from stored database timestamps (`expires_at - now`). Survives browser reloads and tab closures without desynchronization.
6. **Automatic Background Expiration**: Background worker runs SQL checks (`expires_at <= NOW()`), marks records as `EXPIRED` in PostgreSQL, de-provisions access, and logs audit events.
7. **Self-Service Early Revocation**: Engineers can revoke their own active privileges early as soon as maintenance completes, updating PostgreSQL records instantly.
8. **Break-Glass Emergency Protocol**: Expedited workflow for SEV-1 incidents with configurable policy (*Immediate Auto-Activation* vs *Expedited Admin Approval*).
9. **Forensic Audit Trail**: Append-only audit logger capturing IP addresses, actors, roles, resources, timestamps, and justification payloads with CSV export.
10. **Application Security Monitor**: Telemetry tracking high-risk spikes, emergency sessions, extended durations, and failed login attempts.

---

## 5. Technology Stack

- **Frontend**: React 19, TypeScript, TSX, Lucide Icons, Vite
- **Styling**: Tailwind CSS v4 (enterprise dark obsidian console aesthetic)
- **Backend**: Node.js, Express, TypeScript (TSX runtime)
- **Authentication**: JSON Web Tokens (JWT) + Bcrypt password hashing
- **Database**: PostgreSQL (`pg.Pool` connection pooling, `schema.sql`, and `seed.sql`) — strictly PostgreSQL with zero in-memory or PGlite fallbacks
- **PIM Abstraction**: Microsoft Graph / Azure PIM simulation service (`src/server/services/azurePimService.ts`)

---

## 6. Demo Credentials

The database comes pre-seeded with bcrypt-hashed credentials (`seed.sql`):

### 👑 Security Administrator
- **Email**: `admin@securejit.local`
- **Password**: `Admin@123`
- **Permissions**: Full administrative access, review queue, approve/reject requests, user directory management, emergency policy configuration, platform security monitor.

### 👤 Engineering Requester
- **Email**: `user@securejit.local`
- **Password**: `User@123`
- **Permissions**: Request JIT access, view own requests, view active countdown timers, early revocation, break-glass emergency requests, personal audit trail.

> **Hackathon Convenience**: The Login screen features 1-click **"ADMIN Role"** and **"USER Role"** autofill buttons, and the top navigation bar contains an instant **"Switch Persona"** button to transition between roles in 1 click!

---

## 7. PostgreSQL Configuration & Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configuration options:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/securejit
JWT_SECRET=securejit_super_secret_jwt_encryption_key_2026_az_pim
EMERGENCY_POLICY=IMMEDIATE_AUTO_APPROVAL
FRONTEND_URL=http://localhost:3000
```

### PostgreSQL Startup & Safe Initialization:
- SecureJIT verifies PostgreSQL on startup via `SELECT 1;`. If the database is unreachable, startup immediately halts with a clear error without creating fake or in-memory data.
- The startup workflow non-destructively provisions any missing tables (`CREATE TABLE IF NOT EXISTS`). It **never** executes `DROP TABLE` or `TRUNCATE`, preserving all existing records.
- Seed demo data is loaded only when the database is empty (`users` count is 0).

### Health Check Endpoint:
`GET /api/health` queries PostgreSQL and returns:
```json
{
  "status": "ok",
  "database": "connected",
  "product": "SecureJIT"
}
```
If PostgreSQL is unreachable, returns HTTP 503 with `"database": "disconnected"`.

---

## 8. Running the Application

```bash
# Install dependencies
npm install

# Run backend and frontend dev server on port 3000
npm run dev

# Lint check
npm run lint

# Build for production
npm run build
```

Open **http://localhost:3000** in your browser.

---

## 9. License

Developed for the Cybersecurity & Cloud Identity Hackathon. Distributed under the Apache 2.0 License.
