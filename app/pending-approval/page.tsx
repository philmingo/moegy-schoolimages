'use client';

import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { school_report_images_createClient } from '@/lib/supabase/client';

export default function PendingApprovalPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = school_report_images_createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCheckStatus = () => {
    // Reload to re-trigger auth check — if approved, middleware will redirect them
    window.location.href = '/auth/callback-check';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
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

          {/* Clock icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Pending Approval</h1>
          <p className="text-slate-600 mb-6">
            Your role request has been submitted. An administrator will review and approve your access shortly.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              You will be able to access the system once an administrator approves your request. Please check back later.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Check Status
            </button>
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
