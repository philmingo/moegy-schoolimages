'use client';

import DashboardHeader from './DashboardHeader';

interface DashboardHeaderWrapperProps {
  title: string;
  subtitle: string;
  userName?: string;
  userEmail?: string;
}

export default function DashboardHeaderWrapper({
  title,
  subtitle,
  userName,
  userEmail,
}: DashboardHeaderWrapperProps) {
  const handleSignOut = () => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/auth/signout';
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <DashboardHeader
      title={title}
      subtitle={subtitle}
      userName={userName}
      userEmail={userEmail}
      onSignOut={handleSignOut}
    />
  );
}
