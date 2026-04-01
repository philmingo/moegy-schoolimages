'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { school_report_images_createClient } from '@/lib/supabase/client';
import { LogIn, Shield, Image, Upload } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check URL for error parameters
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const errorDetails = urlParams.get('details');
    const errorCode = urlParams.get('code');
    const userEmail = urlParams.get('email');
    const userRole = urlParams.get('role');

    if (errorParam) {
      let errorMessage = '';

      // Provide clear, actionable error messages
      if (errorParam === 'server_error' && errorDescription?.includes('Database error saving new user')) {
        errorMessage = `🚫 Authentication failed for ${userEmail || 'your email'}.\n\nThe database rejected this email. This usually means the database trigger is blocking this email pattern. Please contact your system administrator.`;
      } else if (errorParam === 'profile_not_found') {
        if (errorCode === '42P17') {
          errorMessage = `⚠️ Database configuration error for ${userEmail || 'your email'}.\n\nError: Infinite recursion in RLS policies. The administrator needs to run the database fix script (CLEANUP_AND_FIX.sql).`;
        } else if (errorCode === 'PGRST116') {
          errorMessage = `⚠️ Profile not found for ${userEmail || 'your email'}.\n\nThe trigger did not create your profile. The administrator needs to check the database trigger function.`;
        } else {
          errorMessage = `⚠️ Profile creation failed for ${userEmail || 'your email'}.\n\nDetails: ${errorDetails || 'User profile could not be created'}${errorCode ? `. Error code: ${errorCode}` : ''}`;
        }
      } else if (errorParam === 'session_error') {
        errorMessage = `🔒 Failed to establish session.\n\n${errorDetails || 'Could not exchange authorization code for session. Please try again.'}`;
      } else if (errorParam === 'user_error') {
        errorMessage = `👤 Failed to retrieve user details.\n\n${errorDetails || 'Could not get user information from authentication provider.'}`;
      } else if (errorParam === 'unauthorized') {
        errorMessage = `🚫 Unauthorized access${userEmail ? ` for ${userEmail}` : ''}.\n\n${userRole ? `Your role (${userRole}) is not valid.` : 'Your account does not have the required permissions.'} Please contact your administrator.`;
      } else if (errorParam === 'invalid_request') {
        errorMessage = `⚠️ Invalid authentication request.\n\n${errorDescription || 'The authentication request was malformed or contained invalid parameters.'}`;
      } else {
        errorMessage = `❌ Authentication error: ${errorParam}\n\n${errorDescription || errorDetails || 'An unexpected error occurred during authentication.'}`;
      }

      setError(errorMessage);

      console.error('❌ [LOGIN PAGE] Authentication error:', {
        error: errorParam,
        description: errorDescription,
        details: errorDetails,
        code: errorCode,
        email: userEmail,
        role: userRole,
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is already authenticated
    const checkAuth = async () => {
      const supabase = school_report_images_createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // User is already logged in, get their profile and redirect based on role
        const { data: userProfile } = await supabase
          .from('school_report_images_users')
          .select('role, is_active')
          .eq('user_id', session.user.id)
          .single();

        if (!userProfile) {
          router.push('/select-role');
        } else if (!userProfile.is_active) {
          router.push('/pending-approval');
        } else if (userProfile.role === 'admin') {
          router.push('/admin');
        } else if (userProfile.role === 'regional_officer') {
          router.push('/regional-officer');
        } else if (userProfile.role === 'officer') {
          router.push('/officer');
        } else {
          router.push('/school');
        }
      }
    };

    checkAuth();
  }, [router]);

  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = school_report_images_createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email',
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {/* Header with logo and title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <NextImage
                src="/moe-logo.png"
                alt="Ministry of Education Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-1">
              School Facility Documentation System
            </h1>
            <p className="text-sm text-slate-500">
              Ministry of Education, Guyana
            </p>
          </div>

          {/* Features - compact inline list */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center space-x-3">
              <Upload className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-slate-600">Securely upload incident report images by category</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-4 h-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-slate-600">Review submissions and manage documentation</p>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-slate-600">Restricted to Ministry of Education email addresses</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-sm text-red-800 font-medium whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-300 disabled:to-cyan-300 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-base">Redirecting...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span className="text-base">Sign in with Microsoft</span>
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="mt-5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 text-center leading-relaxed">
              <span className="font-semibold">MOE Only:</span> Access is restricted to Ministry of Education emails (@moe.gov.gy or @moe.edu.gy).
            </p>
            <p className="text-xs text-red-600 text-center leading-relaxed mt-2 font-medium">
              <span className="font-semibold">Schools:</span> Please use your school email address (e.g., hm.example@moe.edu.gy).
            </p>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              By signing in, you agree to follow MOE&apos;s acceptable use policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
