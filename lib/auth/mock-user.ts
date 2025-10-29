/**
 * Mock user utility for development mode
 * DO NOT USE IN PRODUCTION
 */

import type { UserRole } from '@/lib/utils/email-parser';
import type { AuthUser } from './user';

export interface DevModeConfig {
  enabled: boolean;
  role: UserRole;
  schoolCode?: string;
}

/**
 * Check if dev mode is enabled
 */
export function isDevModeEnabled(): boolean {
  return process.env.DEV_MODE === 'true';
}

/**
 * Get dev mode configuration from environment variables
 */
export function getDevModeConfig(): DevModeConfig | null {
  if (!isDevModeEnabled()) {
    return null;
  }

  const role = (process.env.DEV_MODE_ROLE || 'school') as UserRole;
  const schoolCode = process.env.DEV_MODE_SCHOOL_CODE || 'PR03024';

  return {
    enabled: true,
    role,
    schoolCode: role === 'school' ? schoolCode : undefined,
  };
}

/**
 * Generate a mock user based on dev mode configuration
 */
export function getMockUser(): AuthUser | null {
  const config = getDevModeConfig();

  if (!config) {
    return null;
  }

  const { role, schoolCode } = config;

  // Generate appropriate email based on role
  let email: string;
  switch (role) {
    case 'admin':
      email = 'admin@moe.edu.gy';
      break;
    case 'officer':
      email = 'officer.dev@moe.edu.gy';
      break;
    case 'school':
      email = `hm.${schoolCode?.toLowerCase() || 'pr03024'}@moe.edu.gy`;
      break;
    default:
      email = 'hm.pr03024@moe.edu.gy';
  }

  return {
    id: 'dev-mock-user-id',
    email,
    role,
    schoolCode: role === 'school' ? (schoolCode || 'PR03024') : null,
    schoolName: role === 'school' ? 'Dev Test School' : null,
  };
}

/**
 * Get mock user for a specific role (useful for testing)
 */
export function getMockUserForRole(role: UserRole, schoolCode?: string): AuthUser {
  let email: string;

  switch (role) {
    case 'admin':
      email = 'admin@moe.edu.gy';
      break;
    case 'officer':
      email = 'officer.dev@moe.edu.gy';
      break;
    case 'school':
      email = `hm.${schoolCode?.toLowerCase() || 'pr03024'}@moe.edu.gy`;
      break;
    default:
      email = 'hm.pr03024@moe.edu.gy';
  }

  return {
    id: `dev-mock-${role}-user-id`,
    email,
    role,
    schoolCode: role === 'school' ? (schoolCode || 'PR03024') : null,
    schoolName: role === 'school' ? `Dev ${schoolCode} School` : null,
  };
}
