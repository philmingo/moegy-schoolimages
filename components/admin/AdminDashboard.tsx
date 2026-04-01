'use client';

import { useState, useMemo } from 'react';
import AdminCategoryManager from './AdminCategoryManager';
import AdminUserManager from './AdminUserManager';
import AdminImageListView from './AdminImageListView';
import { LayoutGrid, FolderOpen, Users, ImageIcon } from 'lucide-react';

interface Props {
  categories: any[];
  activeCategories: any[];
  images: any[];
  schoolMap: Record<string, string>;
  schoolDataMap: Record<string, any>;
  regions: any[];
  schoolLevels: any[];
  allRegions: any[];
  totalImages: number;
  uniqueSchools: number;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'images', label: 'Images', icon: ImageIcon },
] as const;

export default function AdminDashboard({
  categories,
  activeCategories,
  images,
  schoolMap: schoolMapObj,
  schoolDataMap: schoolDataMapObj,
  regions,
  schoolLevels,
  allRegions,
  totalImages,
  uniqueSchools,
}: Props) {
  const [activeTab, setActiveTab] = useState('images');

  // Reconstruct Maps from plain objects for child components that expect Map types
  const schoolMap = useMemo(
    () => new Map(Object.entries(schoolMapObj)),
    [schoolMapObj]
  );
  const schoolDataMap = useMemo(
    () => new Map(Object.entries(schoolDataMapObj)),
    [schoolDataMapObj]
  );

  return (
    <div>
      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1" aria-label="Dashboard sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                  aria-selected={isActive}
                  role="tab"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label="Categories" value={categories?.length || 0} color="blue" />
              <StatCard label="Total Images" value={totalImages || 0} color="emerald" />
              <StatCard label="Schools with Images" value={uniqueSchools} color="amber" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
              <p className="text-slate-500">Select a tab above to manage categories, users, or view images.</p>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <AdminCategoryManager categories={categories || []} />
        )}

        {activeTab === 'users' && (
          <AdminUserManager regions={allRegions} />
        )}

        {activeTab === 'images' && (
          <AdminImageListView
            images={images || []}
            schoolMap={schoolMap}
            schoolDataMap={schoolDataMap}
            regions={regions}
            schoolLevels={schoolLevels}
            categories={categories || []}
            canDelete={true}
          />
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
  };

  const colors = colorMap[color] || { bg: 'bg-slate-50', text: 'text-slate-900' };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
    </div>
  );
}
