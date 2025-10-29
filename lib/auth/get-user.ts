import { school_report_images_createServerClient } from '@/lib/supabase/server';
import { SchoolReportImagesUser } from '@/lib/types/user';

/**
 * Get the current authenticated user's profile from the custom users table
 * @returns User profile or null if not authenticated
 */
export async function school_report_images_getCurrentUser(): Promise<SchoolReportImagesUser | null> {
  const supabase = await school_report_images_createServerClient();

  // Get the authenticated user from auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get the user profile from custom users table
  const { data: userProfile, error } = await supabase
    .from('school_report_images_users')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !userProfile) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return userProfile as SchoolReportImagesUser;
}

/**
 * Get user role from the custom users table
 * @returns User role or null if not authenticated
 */
export async function school_report_images_getUserRole(): Promise<'school' | 'officer' | 'admin' | null> {
  const user = await school_report_images_getCurrentUser();
  return user?.role || null;
}

/**
 * Get user school code from the custom users table
 * @returns School code or null if not a school user
 */
export async function school_report_images_getUserSchoolCode(): Promise<string | null> {
  const user = await school_report_images_getCurrentUser();
  return user?.school_code || null;
}
