/**
 * SecureJIT Transparent Rule-Based Risk Engine
 * 
 * Deterministically evaluates the security posture and risk tier of a privileged access request.
 * Pure rule-based calculations guarantee full explainability for security auditors and administrators.
 */

export interface RiskEvaluation {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
}

export function evaluateRisk(params: {
  resource: string;
  role: string;
  durationMinutes: number;
  isEmergency?: boolean;
}): RiskEvaluation {
  let score = 0;
  const reasons: string[] = [];

  // 1. Role Privilege Weighting
  switch (params.role) {
    case 'Owner':
      score += 55;
      reasons.push('Owner role grants unrestricted control over all cloud assets and IAM access delegations.');
      break;
    case 'Administrator':
      score += 45;
      reasons.push('Administrator role grants root configuration control and elevated service execution rights.');
      break;
    case 'Storage Blob Data Contributor':
      score += 25;
      reasons.push('Storage Data Contributor grants direct read, write, and deletion rights on cloud object storage.');
      break;
    case 'Contributor':
      score += 20;
      reasons.push('Contributor role allows modifying cloud infrastructure and application deployments.');
      break;
    case 'Virtual Machine Contributor':
      score += 15;
      reasons.push('Virtual Machine Contributor allows VM reboot, script execution, and disk attachment.');
      break;
    case 'Reader':
    default:
      score += 5;
      reasons.push('Reader role enforces read-only access with minimal blast radius.');
      break;
  }

  // 2. Resource Criticality Weighting
  switch (params.resource) {
    case 'Production Database':
      score += 25;
      reasons.push('Production Database contains live transactional customer data with strict compliance mandates.');
      break;
    case 'Kubernetes Cluster':
      score += 20;
      reasons.push('Production Kubernetes cluster orchestrates microservice runtimes and ingress traffic.');
      break;
    case 'Application Server':
      score += 15;
      reasons.push('Application Server hosts core business logic and secrets injection endpoints.');
      break;
    case 'Storage Account':
      score += 10;
      reasons.push('Targeting enterprise cloud storage repository and system backup containers.');
      break;
    case 'Azure VM 01':
    case 'Azure VM 02':
    default:
      score += 5;
      reasons.push('Standard compute instance with isolated workload boundary.');
      break;
  }

  // 3. Duration Exposure Window Weighting
  if (params.durationMinutes > 120) {
    score += 25;
    reasons.push(`Extended duration (${params.durationMinutes}m) exceeds the 2-hour standard window threshold.`);
  } else if (params.durationMinutes > 60) {
    score += 15;
    reasons.push(`Elevation window (${params.durationMinutes}m) exceeds the recommended 60-minute duration.`);
  } else if (params.durationMinutes > 30) {
    score += 5;
    reasons.push(`Standard duration (${params.durationMinutes}m) within operational threshold.`);
  } else {
    // 15m or less
    reasons.push(`Minimal duration (${params.durationMinutes}m) complies with strict Just-In-Time access hygiene.`);
  }

  // 4. Emergency Break-Glass Flag
  if (params.isEmergency) {
    score += 20;
    reasons.push('Emergency break-glass procedure engaged; requires elevated mandatory audit verification.');
  }

  // Normalize score between 0 and 100
  score = Math.min(100, Math.max(10, score));

  // Determine Level Category
  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (score >= 80) {
    level = 'CRITICAL';
  } else if (score >= 60) {
    level = 'HIGH';
  } else if (score >= 35) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  return {
    score,
    level,
    reasons,
  };
}
