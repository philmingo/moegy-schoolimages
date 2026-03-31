import { school_report_images_createServerClient } from '@/lib/supabase/server';
import { school_report_images_getUserRole, school_report_images_extractSchoolCode, type UserRole } from '@/lib/utils/email-parser';
import { isDevModeEnabled, getMockUser } from './mock-user';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  schoolCode: string | null;
  schoolName: string | null;
  regionId: string | null;
}

/**
 * Gets the current authenticated user with role and school information
 */
export async function school_report_images_getCurrentUser(): Promise<AuthUser | null> {
  // DEV MODE: Return mock user if dev mode is enabled
  if (isDevModeEnabled()) {
    const mockUser = getMockUser();
    if (mockUser) {
      console.log('[DEV MODE] Using mock user:', mockUser);
      return mockUser;
    }
  }

  const supabase = await school_report_images_createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  // Try to get role from database first
  const { data: userProfile } = await supabase
    .from('school_report_images_users')
    .select('role, school_code, region_id, is_active')
    .eq('user_id', user.id)
    .single();

  // If user exists but is not active, return null (pending approval)
  if (userProfile && !userProfile.is_active) {
    return null;
  }

  let role: UserRole;
  let schoolCode: string | null = null;
  let regionId: string | null = null;

  if (userProfile && userProfile.role) {
    // Use role from database
    role = userProfile.role as UserRole;
    schoolCode = userProfile.school_code;
    regionId = userProfile.region_id;
  } else {
    // Fallback to email parsing if no database record
    role = school_report_images_getUserRole(user.email);
    schoolCode = role === 'school' ? school_report_images_extractSchoolCode(user.email) : null;
  }

  let schoolName: string | null = null;

  // If this is a school user, fetch the school name from the database
  if (schoolCode) {
    const { data } = await supabase
      .from('sms_schools')
      .select('name')
      .eq('code', schoolCode)
      .single();

    schoolName = data?.name || null;
  }

  return {
    id: user.id,
    email: user.email,
    role,
    schoolCode,
    schoolName,
    regionId,
  };
}

/**
 * Checks if the current user has the required role
 */
export async function school_report_images_requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await school_report_images_getCurrentUser();

  if (!user || !user.role) {
    throw new Error('Unauthorized: User not authenticated');
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Unauthorized: User role '${user.role}' not allowed`);
  }

  return user;
}
