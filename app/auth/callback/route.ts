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
        .select('role, school_code, region_id')
        .eq('user_id', user.id)
        .single();

      // If profile doesn't exist by user_id, check for a pre-added record by email
      if (error?.code === 'PGRST116' || !userProfile) {
        console.log('⚠️ [AUTH CALLBACK] Profile not found by user_id, checking for pre-added email record...');

        // Check if admin pre-added this email
        const { data: preAddedProfile } = await supabase
          .from('school_report_images_users')
          .select('id, role, school_code, region_id')
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
            .select('role, school_code, region_id')
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
          // No pre-added record found, create a new one from email parsing
          console.log('⚠️ [AUTH CALLBACK] No pre-added profile, creating from email...');

          // Import the role determination logic
          const { school_report_images_getUserRole, school_report_images_extractSchoolCode } = await import('@/lib/utils/email-parser');

          const role = school_report_images_getUserRole(user.email!);
          const schoolCode = role === 'school' ? school_report_images_extractSchoolCode(user.email!) : null;

          if (!role) {
            console.error('❌ [AUTH CALLBACK] Email not authorized:', {
              email: user.email,
              timestamp: new Date().toISOString()
            });
            return NextResponse.redirect(
              new URL(`/login?error=unauthorized&email=${encodeURIComponent(user.email || '')}&details=Email domain not authorized`, requestUrl.origin)
            );
          }

          console.log('🔵 [AUTH CALLBACK] Creating profile with role:', role, 'schoolCode:', schoolCode);

          // Create the user profile
          const { data: newProfile, error: createError } = await supabase
            .from('school_report_images_users')
            .insert({
              user_id: user.id,
              email: user.email,
              role: role,
              school_code: schoolCode,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              is_active: true
            })
            .select('role, school_code, region_id')
            .single();

          if (createError) {
            console.error('❌ [AUTH CALLBACK] Failed to create user profile:', {
              userId: user.id,
              userEmail: user.email,
              errorCode: createError.code,
              errorMessage: createError.message,
              errorDetails: createError.details,
              timestamp: new Date().toISOString()
            });
            return NextResponse.redirect(
              new URL(`/login?error=profile_creation_failed&email=${encodeURIComponent(user.email || '')}&details=${encodeURIComponent(createError.message)}&code=${encodeURIComponent(createError.code || 'UNKNOWN')}`, requestUrl.origin)
            );
          }

          console.log('✅ [AUTH CALLBACK] Profile created successfully');
          userProfile = newProfile;
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
      const schoolCode = userProfile.school_code;

      console.log('✅ [AUTH CALLBACK] User profile loaded:', {
        email: user.email,
        role: role,
        schoolCode: schoolCode,
        timestamp: new Date().toISOString()
      });

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
