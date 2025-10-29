// User types based on school_report_images_users table

export type UserRole = 'school' | 'officer' | 'admin';

export interface SchoolReportImagesUser {
  id: string;
  user_id: string;
  email: string;
  role: UserRole;
  school_code: string | null;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole {
  user_id: string;
  email: string;
  role: UserRole;
  school_code: string | null;
}
