'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { school_report_images_createClient } from '@/lib/supabase/client';
import { LogIn, Shield, Image, Upload, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Left Side - Branding & Info */}
          <div className="text-center lg:text-left space-y-4">
            {/* Logo and Title */}
            <div className="space-y-3">
              <div className="flex items-center justify-center lg:justify-start">
                <div className="relative">
                  {/* Logo */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                    <NextImage src="/moe-logo.png" alt="Ministry of Education Logo" width={112} height={112} className="w-full h-full object-contain drop-shadow-2xl" priority />
                  </div>
                  {/* Soft glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-2xl -z-10"></div>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight leading-tight">
                  School Facility Documentation System
                </h1>
                <p className="text-blue-200 text-base sm:text-lg font-medium">
                  Ministry of Education, Guyana
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                Secure Document Management<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  for Incident Reports
                </span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                A centralized platform for Schools to upload images for incident reports for review and documentation.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 max-w-xl mx-auto lg:mx-0">
              <div className="flex items-start space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-white text-base mb-0.5">Upload Reports</h3>
                  <p className="text-slate-300 text-xs">
                    Securely upload incident report images organized by category
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-200">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-white text-base mb-0.5">Review & Manage</h3>
                  <p className="text-slate-300 text-xs">
                    Officers can review submissions and manage documentation centrally
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-white text-base mb-0.5">Restricted Access</h3>
                  <p className="text-slate-300 text-xs">
                    Access is restricted to Ministry of Education email addresses
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-3 shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Welcome</h3>
                <p className="text-gray-600 text-sm">
                  Sign in with your MOE Microsoft account
                </p>
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
                className="w-full group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-300 disabled:to-cyan-300 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-base">Redirecting...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="text-base">Sign in with Microsoft</span>
                  </>
                )}
              </button>

              {/* Info Box */}
              <div className="mt-4 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                <p className="text-xs text-gray-700 text-center leading-relaxed">
                  <span className="font-semibold">MOE Only:</span> Access is restricted to Ministry of Education emails (@moe.gov.gy or @moe.edu.gy).
                </p>
                <p className="text-xs text-red-700 text-center leading-relaxed mt-2 font-medium">
                  <span className="font-semibold">Schools:</span> Please use your school email address (e.g., hm.example@moe.edu.gy).
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  By signing in, you agree to follow MOE&apos;s acceptable use policies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
