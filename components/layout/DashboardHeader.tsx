'use client';

import Image from 'next/image';
import { LogOut, User } from 'lucide-react';

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
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo and Title */}
          <div className="flex items-center space-x-3">
            {/* MOE Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/moe-logo.png"
                alt="Ministry of Education Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>

            {/* Vertical divider */}
            <div className="border-l border-slate-200 h-8" />

            {/* Title and Subtitle */}
            <div>
              <h1 className="text-base font-semibold text-slate-900 leading-tight">
                {title}
              </h1>
              <p className="text-xs text-slate-500">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right side: User info and Sign Out */}
          <div className="flex items-center space-x-3">
            {/* User info */}
            {(userName || userEmail) && (
              <div className="hidden md:flex items-center space-x-3">
                {/* User avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {initials ? (
                    <span className="text-xs font-medium text-slate-600">
                      {initials}
                    </span>
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="text-right">
                  {userName && (
                    <p className="text-sm font-medium text-slate-900 leading-tight">
                      {userName}
                    </p>
                  )}
                  {userEmail && (
                    <p className="text-xs text-slate-500">
                      {userEmail}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sign Out Button */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
