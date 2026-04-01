'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { REGIONS } from '@/lib/constants/school-data';

export default function SelectRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/select-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          regionId: selectedRole === 'regional_officer' ? selectedRegion : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit role selection');
      }

      router.push('/pending-approval');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    selectedRole === 'officer' ||
    (selectedRole === 'regional_officer' && selectedRegion);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {/* Header */}
          <div className="text-center mb-6">
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
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Select Your Role</h1>
            <p className="text-slate-600 text-sm">
              Choose your role to continue. An administrator will review and approve your access.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div className="space-y-3 mb-6">
              <label
                className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === 'officer'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => {
                  setSelectedRole('officer');
                  setSelectedRegion('');
                }}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="role"
                    value="officer"
                    checked={selectedRole === 'officer'}
                    onChange={() => {
                      setSelectedRole('officer');
                      setSelectedRegion('');
                    }}
                    className="mt-1 text-blue-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">Education Officer</p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      View all school report images across all regions
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === 'regional_officer'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedRole('regional_officer')}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="role"
                    value="regional_officer"
                    checked={selectedRole === 'regional_officer'}
                    onChange={() => setSelectedRole('regional_officer')}
                    className="mt-1 text-teal-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Regional Officer</p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      View and upload images for schools in your assigned region
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* Region Selector (shown when Regional Officer is selected) */}
            {selectedRole === 'regional_officer' && (
              <div className="mb-6">
                <label htmlFor="region" className="block text-sm font-medium text-slate-700 mb-1">
                  Select Your Region
                </label>
                <select
                  id="region"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Choose a region...</option>
                  {REGIONS.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full py-3 px-6 text-white font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </button>

            <p className="text-xs text-slate-500 text-center mt-4">
              Your request will be reviewed by an administrator. You will gain access once approved.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
