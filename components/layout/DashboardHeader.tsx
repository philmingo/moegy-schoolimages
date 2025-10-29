'use client';

import Image from 'next/image';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  userName?: string;
  userEmail?: string;
  onSignOut?: () => void;
}

export default function DashboardHeader({
  title,
  subtitle,
  userName,
  userEmail,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left side: Logo and Title */}
          <div className="flex items-center space-x-4">
            {/* MOE Logo */}
            <div className="flex-shrink-0 bg-white rounded-lg p-2 shadow-md">
              <Image
                src="/moe-logo.png"
                alt="Ministry of Education Singapore"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>

            {/* Title and Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {title}
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right side: User info and Sign Out */}
          <div className="flex items-center space-x-4">
            {/* User info (hidden on mobile) */}
            {(userName || userEmail) && (
              <div className="hidden md:block text-right">
                {userName && (
                  <p className="text-white font-medium text-sm">
                    {userName}
                  </p>
                )}
                {userEmail && (
                  <p className="text-blue-100 text-xs">
                    {userEmail}
                  </p>
                )}
              </div>
            )}

            {/* Sign Out Button */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
