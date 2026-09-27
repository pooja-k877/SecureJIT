-- ============================================================================
-- SECUREJIT - Realistic Seed Data for Hackathon Demonstration
-- Database: securejit
-- ============================================================================

-- Optional manual clear (UNCOMMENT ONLY IF PURGING DATA EXPLICITLY):
-- TRUNCATE TABLE notifications CASCADE;
-- TRUNCATE TABLE audit_logs CASCADE;
-- TRUNCATE TABLE active_access CASCADE;
-- TRUNCATE TABLE access_requests CASCADE;
-- TRUNCATE TABLE users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS SEED
-- Passwords:
-- admin@securejit.local -> Admin@123
-- user@securejit.local  -> User@123
-- secops@securejit.local -> Admin@123
-- devops@securejit.local -> User@123
-- ----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, department, status, created_at, last_login, last_login_at) VALUES
('USR-001', 'Security Lead Admin', 'admin@securejit.local', '$2b$10$92jGIGkrje9cVENZEYqOdeki5xJrD6RV8c.MgCzPl.cNRuHQOqndy', 'ADMIN', 'Cloud Security & Compliance', 'ACTIVE', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),
('USR-002', 'Alex Mercer', 'user@securejit.local', '$2b$10$VJ/FigChE05STn3bCv.z5.WI1t8sxwzF4TlkIDEpcpFggS3LilN4y', 'USER', 'Core Backend Engineering', 'ACTIVE', NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('USR-003', 'Sarah Jenkins', 'devops@securejit.local', '$2b$10$VJ/FigChE05STn3bCv.z5.WI1t8sxwzF4TlkIDEpcpFggS3LilN4y', 'USER', 'SRE / Cloud Operations', 'ACTIVE', NOW() - INTERVAL '14 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('USR-004', 'David Kim', 'secops@securejit.local', '$2b$10$92jGIGkrje9cVENZEYqOdeki5xJrD6RV8c.MgCzPl.cNRuHQOqndy', 'ADMIN', 'Security Operations Center', 'ACTIVE', NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours');

-- ----------------------------------------------------------------------------
-- 2. ACCESS_REQUESTS SEED
-- ----------------------------------------------------------------------------
INSERT INTO access_requests 
(id, user_id, user_name, user_email, resource, role, duration_minutes, reason, ticket_id, is_emergency, risk_level, risk_score, risk_reason, risk_reasons, status, approved_by, approved_at, rejection_reason, reviewer_id, reviewer_name, review_comment, requested_at, reviewed_at, started_at, expires_at)
VALUES
-- 1. Pending Request (High Risk: Production Database + Contributor)
(
    'REQ-2026-001',
    'USR-002',
    'Alex Mercer',
    'user@securejit.local',
    'Production Database',
    'Contributor',
    60,
    'Applying emergency hotfix migration schema v4.2 for enterprise transaction deadlock issue.',
    'INC-84920',
    false,
    'HIGH',
    75,
    'Targeting production database tier with sensitive data',
    '["Targeting production database tier with sensitive data", "Elevated Contributor permissions allow modification of data tables", "60 minutes duration exceeds minimal 30m standard threshold"]',
    'PENDING',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '25 minutes',
    NULL,
    NULL,
    NULL
),

-- 2. Currently Active Access (Virtual Machine Contributor on Azure VM 01)
(
    'REQ-2026-002',
    'USR-002',
    'Alex Mercer',
    'user@securejit.local',
    'Azure VM 01',
    'Virtual Machine Contributor',
    45,
    'Investigating high CPU utilization and rotating application daemon service logs.',
    'OPS-30219',
    false,
    'MEDIUM',
    45,
    'Targeting virtual machine compute node',
    '["Targeting virtual machine compute node", "Role Virtual Machine Contributor allows system restart and command execution"]',
    'ACTIVE',
    'Security Lead Admin',
    NOW() - INTERVAL '14 minutes',
    NULL,
    'USR-001',
    'Security Lead Admin',
    'Approved for compute diagnostics. Ensure all diagnostic commands are logged.',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '14 minutes',
    NOW() - INTERVAL '14 minutes',
    NOW() + INTERVAL '31 minutes'
),

-- 3. Historical Rejected Request (Owner role requested without sufficient justification)
(
    'REQ-2026-003',
    'USR-002',
    'Alex Mercer',
    'user@securejit.local',
    'Kubernetes Cluster',
    'Owner',
    120,
    'Checking cluster configuration and general namespace inspection.',
    'TICK-1002',
    false,
    'CRITICAL',
    95,
    'Owner role grants complete unrestricted control including IAM delegation',
    '["Owner role grants complete unrestricted control including IAM delegation", "Targeting production Kubernetes cluster core infrastructure", "Extended 120-minute window presents severe security surface"]',
    'REJECTED',
    NULL,
    NULL,
    'Owner role is prohibited for routine inspection. Request Reader or Contributor role instead in accordance with least-privilege policy (SEC-POL-04).',
    'USR-001',
    'Security Lead Admin',
    'Owner role is prohibited for routine inspection. Request Reader or Contributor role instead in accordance with least-privilege policy (SEC-POL-04).',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '10 minutes',
    NULL,
    NULL
),

-- 4. Historical Expired Access (Storage Blob Data Contributor)
(
    'REQ-2026-004',
    'USR-002',
    'Alex Mercer',
    'user@securejit.local',
    'Storage Account',
    'Storage Blob Data Contributor',
    30,
    'Uploading compliant anonymized audit archives to cold tier container.',
    'AUD-4820',
    false,
    'MEDIUM',
    50,
    'Storage Blob Data Contributor grants data modification permissions',
    '["Storage Blob Data Contributor grants data modification permissions", "Targeting cold storage blob repository"]',
    'EXPIRED',
    'Security Lead Admin',
    NOW() - INTERVAL '4 hours' + INTERVAL '50 minutes',
    NULL,
    'USR-001',
    'Security Lead Admin',
    'Verified storage account scope and container retention limits.',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '4 hours' + INTERVAL '50 minutes',
    NOW() - INTERVAL '4 hours' + INTERVAL '50 minutes',
    NOW() - INTERVAL '4 hours' + INTERVAL '20 minutes'
),

-- 5. Historical Emergency Access Request
(
    'REQ-2026-005',
    'USR-003',
    'Sarah Jenkins',
    'devops@securejit.local',
    'Application Server',
    'Administrator',
    15,
    'Critical sev-1 incident: Production API gateway restart required following TLS cert expiry.',
    'P1-SEV1-992',
    true,
    'HIGH',
    85,
    'Emergency break-glass activation protocol engaged',
    '["Emergency break-glass activation protocol engaged", "Administrator role grants local root/admin privilege", "Production Application Server target tier"]',
    'EXPIRED',
    'Security Lead Admin',
    NOW() - INTERVAL '1 day' + INTERVAL '1 minute',
    NULL,
    'USR-001',
    'Security Lead Admin',
    'Emergency break-glass activation approved per incident response playbook.',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '1 minute',
    NOW() - INTERVAL '1 day' + INTERVAL '1 minute',
    NOW() - INTERVAL '1 day' + INTERVAL '16 minutes'
);

-- ----------------------------------------------------------------------------
-- 3. ACTIVE_ACCESS SEED
-- ----------------------------------------------------------------------------
INSERT INTO active_access
(id, request_id, user_id, user_name, user_email, resource, role, access_type, started_at, expires_at, status, revoked_at, revoked_by)
VALUES
(
    'ACT-2026-001',
    'REQ-2026-002',
    'USR-002',
    'Alex Mercer',
    'user@securejit.local',
    'Azure VM 01',
    'Virtual Machine Contributor',
    'JIT',
    NOW() - INTERVAL '14 minutes',
    NOW() + INTERVAL '31 minutes',
    'ACTIVE',
    NULL,
    NULL
);

-- ----------------------------------------------------------------------------
-- 4. AUDIT_LOGS SEED
-- ----------------------------------------------------------------------------
INSERT INTO audit_logs
(id, user_id, user_name, user_email, action, resource, role, details, ip_address, created_at, timestamp)
VALUES
('AUD-9001', 'USR-001', 'Security Lead Admin', 'admin@securejit.local', 'LOGIN_SUCCESS', NULL, NULL, 'Administrative console login authenticated via password verification.', '192.168.1.100', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
('AUD-9002', 'USR-002', 'Alex Mercer', 'user@securejit.local', 'REQUEST_CREATED', 'Production Database', 'Contributor', 'Submitted access request REQ-2026-001 (Duration: 60m, Ticket: INC-84920, Risk: HIGH).', '192.168.1.145', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'),
('AUD-9003', 'USR-002', 'Alex Mercer', 'user@securejit.local', 'REQUEST_CREATED', 'Azure VM 01', 'Virtual Machine Contributor', 'Submitted access request REQ-2026-002 (Duration: 45m, Ticket: OPS-30219, Risk: MEDIUM).', '192.168.1.145', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),
('AUD-9004', 'USR-001', 'Security Lead Admin', 'admin@securejit.local', 'REQUEST_APPROVED', 'Azure VM 01', 'Virtual Machine Contributor', 'Approved request REQ-2026-002. Comment: Approved for compute diagnostics.', '192.168.1.100', NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '14 minutes'),
('AUD-9005', 'USR-002', 'Alex Mercer', 'user@securejit.local', 'ACCESS_ACTIVATED', 'Azure VM 01', 'Virtual Machine Contributor', 'Temporary JIT session ACT-2026-001 activated for 45 minutes on Azure VM 01.', '192.168.1.145', NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '14 minutes'),
('AUD-9006', 'USR-001', 'Security Lead Admin', 'admin@securejit.local', 'REQUEST_REJECTED', 'Kubernetes Cluster', 'Owner', 'Rejected REQ-2026-003. Reason: Owner role is prohibited for routine inspection. Request Reader or Contributor instead.', '192.168.1.100', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('AUD-9007', 'USR-002', 'Alex Mercer', 'user@securejit.local', 'ACCESS_EXPIRED', 'Storage Account', 'Storage Blob Data Contributor', 'Privileged session expired automatically after 30 minutes duration.', 'SYSTEM_DAEMON', NOW() - INTERVAL '4 hours' + INTERVAL '20 minutes', NOW() - INTERVAL '4 hours' + INTERVAL '20 minutes'),
('AUD-9008', 'USR-003', 'Sarah Jenkins', 'devops@securejit.local', 'EMERGENCY_REQUESTED', 'Application Server', 'Administrator', 'Emergency break-glass requested for SEV-1 incident P1-SEV1-992.', '192.168.1.210', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('AUD-9009', 'USR-003', 'Sarah Jenkins', 'devops@securejit.local', 'EMERGENCY_ACTIVATED', 'Application Server', 'Administrator', 'Emergency break-glass session activated for 15 minutes window.', '192.168.1.210', NOW() - INTERVAL '1 day' + INTERVAL '1 minute', NOW() - INTERVAL '1 day' + INTERVAL '1 minute'),
('AUD-9010', 'USR-003', 'Sarah Jenkins', 'devops@securejit.local', 'EMERGENCY_EXPIRED', 'Application Server', 'Administrator', 'Emergency privileged window expired. Session credentials de-provisioned.', 'SYSTEM_DAEMON', NOW() - INTERVAL '1 day' + INTERVAL '16 minutes', NOW() - INTERVAL '1 day' + INTERVAL '16 minutes');

-- ----------------------------------------------------------------------------
-- 5. NOTIFICATIONS SEED
-- ----------------------------------------------------------------------------
INSERT INTO notifications
(id, user_id, title, message, type, request_id, is_read, created_at)
VALUES
('NOTIF-001', 'USR-002', 'Privileged Access Activated', 'Your request REQ-2026-002 for Virtual Machine Contributor on Azure VM 01 was approved and is now ACTIVE.', 'SUCCESS', 'REQ-2026-002', false, NOW() - INTERVAL '14 minutes'),
('NOTIF-002', 'USR-002', 'Access Request Rejected', 'Your request REQ-2026-003 for Owner on Kubernetes Cluster was rejected: Owner role is prohibited for routine inspection.', 'ALERT', 'REQ-2026-003', false, NOW() - INTERVAL '2 days'),
('NOTIF-003', 'USR-002', 'Privileged Session Expired', 'Your temporary access on Storage Account has automatically expired.', 'INFO', 'REQ-2026-004', true, NOW() - INTERVAL '4 hours' + INTERVAL '20 minutes'),
('NOTIF-004', 'USR-001', 'New High-Risk Request Submitted', 'Alex Mercer submitted a HIGH risk request for Production Database (REQ-2026-001). Review required.', 'WARNING', 'REQ-2026-001', false, NOW() - INTERVAL '25 minutes');
