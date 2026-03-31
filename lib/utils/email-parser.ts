/**
 * Extracts school code from email address
 * Example: hm.pr03024@moe.edu.gy -> PR03024
 * Example: hm.pr03024p@moe.edu.gy -> PR03024P
 */
export function school_report_images_extractSchoolCode(email: string): string | null {
  if (!email) return null;

  // Match pattern: hm.{code}@moe.edu.gy
  const match = email.toLowerCase().match(/^hm\.([a-z0-9]+)@moe\.edu\.gy$/i);

  if (!match || !match[1]) return null;

  // Return the code in uppercase
  return match[1].toUpperCase();
}

/**
 * Determines user role based on email pattern
 */
export type UserRole = 'school' | 'officer' | 'regional_officer' | 'admin' | null;

export function school_report_images_getUserRole(email: string): UserRole {
  if (!email) return null;

  const emailLower = email.toLowerCase();

  // Randy Bobb is the admin
  if (emailLower === 'randy.bobb@moe.gov.gy') {
    return 'admin';
  }

  // School emails - emails matching hm.{code}@moe.edu.gy pattern
  if (emailLower.match(/^hm\.[a-z0-9]+@moe\.edu\.gy$/)) {
    return 'school';
  }

  // Officer emails - any other @moe.edu.gy or @moe.gov.gy email
  if (emailLower.match(/@moe\.(edu|gov)\.gy$/)) {
    return 'officer';
  }

  return null;
}
