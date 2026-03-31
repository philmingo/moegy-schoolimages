import { school_report_images_createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorParam = requestUrl.searchParams.get('error');
  const errorDesc = requestUrl.searchParams.get('error_description');

  console.log('🔵 [AUTH CALLBACK] Starting authentication callback', {
    hasCode: !!code,
    hasError: !!errorParam,
    timestamp: new Date().toISOString()
  });

  // Log any OAuth errors from the URL
  if (errorParam) {
    console.error('❌ [AUTH CALLBACK] OAuth Error from provider:', {
      error: errorParam,
      description: errorDesc,
      fullUrl: request.url,
      timestamp: new Date().toISOString()
    });
    return NextResponse.redirect(
      new URL(`/login?error=${errorParam}&error_description=${encodeURIComponent(errorDesc || errorParam)}`, requestUrl.origin)
    );
  }

  if (code) {
    const supabase = await school_report_images_createServerClient();

    console.log('🔵 [AUTH CALLBACK] Exchanging code for session...');

    // Exchange code for session
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('❌ [AUTH CALLBACK] Session exchange failed:', {
        errorName: sessionError.name,
        errorMessage: sessionError.message,
        errorStatus: sessionError.status,
        errorCode: (sessionError as any).code,
        fullError: JSON.stringify(sessionError, null, 2),
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(
        new URL(`/login?error=session_error&details=${encodeURIComponent(sessionError.message || 'Session exchange failed')}`, requestUrl.origin)
      );
    }

    console.log('✅ [AUTH CALLBACK] Session exchanged successfully');

    console.log('🔵 [AUTH CALLBACK] Getting user details...');

    // Get the user to determine their role
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('❌ [AUTH CALLBACK] Failed to get user:', {
        errorName: userError.name,
        errorMessage: userError.message,
        fullError: JSON.stringify(userError, null, 2),
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(
        new URL(`/login?error=user_error&details=${encodeURIComponent(userError.message)}`, requestUrl.origin)
      );
    }

    if (user) {
      console.log('✅ [AUTH CALLBACK] User authenticated:', {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        timestamp: new Date().toISOString()
      });

      console.log('🔵 [AUTH CALLBACK] Fetching user profile from database...');

      // Get user profile from custom users table
      let { data: userProfile, error } = await supabase
        .from('school_report_images_users')
        .select('role, school_code, region_id, is_active')
        .eq('user_id', user.id)
        .single();

      // If profile doesn't exist by user_id, check for a pre-added record by email
      if (error?.code === 'PGRST116' || !userProfile) {
        console.log('⚠️ [AUTH CALLBACK] Profile not found by user_id, checking for pre-added email record...');

        // Check if admin pre-added this email
        const { data: preAddedProfile } = await supabase
          .from('school_report_images_users')
          .select('id, role, school_code, region_id, is_active')
          .eq('email', user.email!)
          .is('user_id', null)
          .single();

        if (preAddedProfile) {
          // Claim the pre-added record by setting the user_id
          console.log('🔵 [AUTH CALLBACK] Found pre-added profile, claiming it...');
          const { data: claimedProfile, error: claimError } = await supabase
            .from('school_report_images_users')
            .update({
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', preAddedProfile.id)
            .select('role, school_code, region_id, is_active')
            .single();

          if (claimError) {
            console.error('❌ [AUTH CALLBACK] Failed to claim pre-added profile:', claimError);
            return NextResponse.redirect(
              new URL(`/login?error=profile_creation_failed&email=${encodeURIComponent(user.email || '')}&details=${encodeURIComponent(claimError.message)}&code=${encodeURIComponent(claimError.code || 'UNKNOWN')}`, requestUrl.origin)
            );
          }

          console.log('✅ [AUTH CALLBACK] Pre-added profile claimed successfully');
          userProfile = claimedProfile;
        } else {
          // No pre-added record — determine if this is a school or needs role selection
          const { school_report_images_extractSchoolCode } = await import('@/lib/utils/email-parser');
          const emailLower = user.email!.toLowerCase();
          const isSchoolEmail = emailLower.match(/^hm\.[a-z0-9]+@moe\.edu\.gy$/);
          const isMoeEmail = emailLower.match(/@moe\.(edu|gov)\.gy$/);
          const isAdmin = emailLower === 'randy.bobb@moe.gov.gy';

          if (!isMoeEmail) {
            console.error('❌ [AUTH CALLBACK] Email not authorized:', { email: user.email });
            return NextResponse.redirect(
              new URL(`/login?error=unauthorized&email=${encodeURIComponent(user.email || '')}&details=Email domain not authorized`, requestUrl.origin)
            );
          }

          if (isAdmin) {
            // Admin — auto-create with full access
            const { data: newProfile, error: createError } = await supabase
              .from('school_report_images_users')
              .insert({
                user_id: user.id,
                email: user.email,
                role: 'admin',
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                is_active: true,
              })
              .select('role, school_code, region_id, is_active')
              .single();

            if (createError) {
              console.error('❌ [AUTH CALLBACK] Failed to create admin profile:', createError);
              return NextResponse.redirect(
                new URL(`/login?error=profile_creation_failed&email=${encodeURIComponent(user.email || '')}&details=${encodeURIComponent(createError.message)}`, requestUrl.origin)
              );
            }
            userProfile = newProfile;
          } else if (isSchoolEmail) {
            // School email — auto-create with immediate access
            const schoolCode = school_report_images_extractSchoolCode(user.email!);
            const { data: newProfile, error: createError } = await supabase
              .from('school_report_images_users')
              .insert({
                user_id: user.id,
                email: user.email,
                role: 'school',
                school_code: schoolCode,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                is_active: true,
              })
              .select('role, school_code, region_id, is_active')
              .single();

            if (createError) {
              console.error('❌ [AUTH CALLBACK] Failed to create school profile:', createError);
              return NextResponse.redirect(
                new URL(`/login?error=profile_creation_failed&email=${encodeURIComponent(user.email || '')}&details=${encodeURIComponent(createError.message)}`, requestUrl.origin)
              );
            }
            userProfile = newProfile;
          } else {
            // Non-school MOE email — needs role selection
            // Create a placeholder profile with no role, inactive
            const { error: createError } = await supabase
              .from('school_report_images_users')
              .insert({
                user_id: user.id,
                email: user.email,
                role: 'officer',
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                is_active: false,
              });

            if (createError) {
              console.error('❌ [AUTH CALLBACK] Failed to create placeholder profile:', createError);
              return NextResponse.redirect(
                new URL(`/login?error=profile_creation_failed&email=${encodeURIComponent(user.email || '')}&details=${encodeURIComponent(createError.message)}`, requestUrl.origin)
              );
            }

            console.log('🔵 [AUTH CALLBACK] Non-school user, redirecting to role selection...');
            return NextResponse.redirect(new URL('/select-role', requestUrl.origin));
          }
        }
      } else if (error) {
        // Other errors (like infinite recursion)
        console.error('❌ [AUTH CALLBACK] Error fetching user profile:', {
          userId: user.id,
          userEmail: user.email,
          errorCode: error?.code,
          errorMessage: error?.message,
          possibleCause: error?.code === '42P17' ? 'INFINITE RECURSION in RLS policies' : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        return NextResponse.redirect(
          new URL(`/login?error=profile_error&email=${encodeURIComponent(user.email || '')}&details=${encodeURIComponent(error?.message || 'Database error')}&code=${encodeURIComponent(error?.code || 'UNKNOWN')}`, requestUrl.origin)
        );
      }

      const role = userProfile.role;
      const isActive = userProfile.is_active;

      console.log('✅ [AUTH CALLBACK] User profile loaded:', {
        email: user.email,
        role: role,
        isActive: isActive,
        timestamp: new Date().toISOString()
      });

      // If user is not active, they need approval (unless they still need role selection)
      if (!isActive) {
        // Check if they have a real role selected or still need to pick
        if (role === 'officer' && !userProfile.school_code && !userProfile.region_id) {
          // Could be placeholder — send to role selection
          console.log('🔵 [AUTH CALLBACK] Inactive user without role details, redirecting to /select-role...');
          return NextResponse.redirect(new URL('/select-role', requestUrl.origin));
        }
        console.log('🔵 [AUTH CALLBACK] User pending approval, redirecting to /pending-approval...');
        return NextResponse.redirect(new URL('/pending-approval', requestUrl.origin));
      }

      // Redirect based on role
      if (role === 'school') {
        console.log('🔵 [AUTH CALLBACK] Redirecting to /school...');
        return NextResponse.redirect(new URL('/school', requestUrl.origin));
      } else if (role === 'regional_officer') {
        console.log('🔵 [AUTH CALLBACK] Redirecting to /regional-officer...');
        return NextResponse.redirect(new URL('/regional-officer', requestUrl.origin));
      } else if (role === 'officer') {
        console.log('🔵 [AUTH CALLBACK] Redirecting to /officer...');
        return NextResponse.redirect(new URL('/officer', requestUrl.origin));
      } else if (role === 'admin') {
        console.log('🔵 [AUTH CALLBACK] Redirecting to /admin...');
        return NextResponse.redirect(new URL('/admin', requestUrl.origin));
      } else {
        // Invalid role
        console.error('❌ [AUTH CALLBACK] Invalid role:', {
          email: user.email,
          role: role,
          timestamp: new Date().toISOString()
        });
        return NextResponse.redirect(
          new URL(`/login?error=unauthorized&role=${encodeURIComponent(role || 'none')}`, requestUrl.origin)
        );
      }
    }
  }

  // Return to login if no code
  console.warn('⚠️ [AUTH CALLBACK] No code provided, redirecting to login');
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
