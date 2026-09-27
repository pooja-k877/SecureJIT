-- ============================================================================
-- SECUREJIT - Azure Privileged Identity Management (JIT Access)
-- Database: securejit
-- PostgreSQL DDL Schema
-- ============================================================================

-- Optional manual reset (UNCOMMENT ONLY IF PERFORMING A COMPLETE MANUAL DATABASE PURGE):
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS active_access CASCADE;
-- DROP TABLE IF EXISTS access_requests CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    department VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- 2. ACCESS_REQUESTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS access_requests (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(150) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    reason TEXT NOT NULL,
    ticket_id VARCHAR(100),
    is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_score INT NOT NULL DEFAULT 10,
    risk_reason TEXT,
    risk_reasons TEXT, -- JSON string array of risk trigger explanations
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED', 'REVOKED')),
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    reviewer_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(100),
    review_comment TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_requests_user ON access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_risk ON access_requests(risk_level);
CREATE INDEX IF NOT EXISTS idx_requests_emergency ON access_requests(is_emergency);

-- ----------------------------------------------------------------------------
-- 3. ACTIVE_ACCESS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS active_access (
    id VARCHAR(50) PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL REFERENCES access_requests(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(150) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    access_type VARCHAR(20) NOT NULL DEFAULT 'JIT' CHECK (access_type IN ('JIT', 'EMERGENCY')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    revoked_at TIMESTAMPTZ,
    revoked_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_active_user ON active_access(user_id);
CREATE INDEX IF NOT EXISTS idx_active_status ON active_access(status);
CREATE INDEX IF NOT EXISTS idx_active_expires ON active_access(expires_at);

-- ----------------------------------------------------------------------------
-- 4. AUDIT_LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(150) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100),
    role VARCHAR(100),
    details TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_email);

-- ----------------------------------------------------------------------------
-- 5. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'INFO' CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ALERT')),
    request_id VARCHAR(50),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
