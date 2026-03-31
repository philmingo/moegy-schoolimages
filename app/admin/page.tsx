import { school_report_images_getCurrentUser, school_report_images_requireRole } from '@/lib/auth/user';
import { school_report_images_createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminCategoryManager from '@/components/admin/AdminCategoryManager';
import AdminUserManager from '@/components/admin/AdminUserManager';
import DashboardHeaderWrapper from '@/components/layout/DashboardHeaderWrapper';
import AdminImageListView from '@/components/admin/AdminImageListView';
import OfficerGalleryView from '@/components/gallery/OfficerGalleryView';
import { SCHOOL_LEVELS, REGIONS, SCHOOL_LEVEL_MAP, REGION_MAP } from '@/lib/constants/school-data';

export default async function AdminPage() {
  // Ensure user is an admin
  const user = await school_report_images_requireRole(['admin']);

  if (!user) {
    redirect('/login');
  }

  const supabase = await school_report_images_createServerClient();

  // Fetch all categories (including inactive ones)
  const { data: categories } = await supabase
    .from('school_report_images_categories')
    .select('*')
    .order('display_order');

  // Fetch active categories for the gallery
  const { data: activeCategories } = await supabase
    .from('school_report_images_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  // Fetch first page of images (pagination handled client-side)
  const { data: allImages } = await supabase
    .from('school_report_images_uploaded_images')
    .select(`
      *,
      category:school_report_images_categories(name, description)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Get statistics
  const { count: totalImages } = await supabase
    .from('school_report_images_uploaded_images')
    .select('*', { count: 'exact', head: true });

  const { data: schoolsWithImages } = await supabase
    .from('school_report_images_uploaded_images')
    .select('school_code');

  const uniqueSchools = new Set(schoolsWithImages?.map(s => s.school_code) || []).size;

  // Get unique school codes from images
  const schoolCodes = Array.from(
    new Set(allImages?.map((img: any) => img.school_code) || [])
  ).sort();

  // Fetch school data including region_id and school_level_id
  const { data: schools } = await supabase
    .from('sms_schools')
    .select('code, name, region_id, school_level_id')
    .in('code', schoolCodes);

  // Create a map of school codes to school names
  const schoolMap = new Map(
    schools?.map((s) => [s.code, s.name]) || []
  );

  // Create a map of school codes to their full data (including region and level IDs)
  const schoolDataMap = new Map(
    schools?.map((s: any) => [s.code, {
      name: s.name,
      region: s.region_id ? { id: s.region_id, name: REGION_MAP.get(s.region_id) || 'Unknown' } : null,
      schoolLevel: s.school_level_id ? { id: s.school_level_id, name: SCHOOL_LEVEL_MAP.get(s.school_level_id) || 'Unknown' } : null,
    }]) || []
  );

  // Get unique regions and school levels that are actually in the data
  const usedRegionIds = new Set(
    schools?.map((s: any) => s.region_id).filter(Boolean) || []
  );
  const usedLevelIds = new Set(
    schools?.map((s: any) => s.school_level_id).filter(Boolean) || []
  );

  const regions = REGIONS.filter(r => usedRegionIds.has(r.id)).sort((a, b) => a.name.localeCompare(b.name));
  const schoolLevels = SCHOOL_LEVELS.filter(l => usedLevelIds.has(l.id)).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeaderWrapper
        title="Admin Dashboard"
        subtitle={`${user.email} • Manage upload categories`}
        userName="Administrator"
        userEmail={user.email}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Categories</p>
            <p className="text-3xl font-bold text-gray-900">{categories?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Images</p>
            <p className="text-3xl font-bold text-gray-900">{totalImages || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Schools with Images</p>
            <p className="text-3xl font-bold text-gray-900">{uniqueSchools}</p>
          </div>
        </div>

        {/* Category Management */}
        <AdminCategoryManager categories={categories || []} />

        {/* User Management */}
        <AdminUserManager regions={REGIONS} />

        {/* Images by School List */}
        <div className="mt-8">
          <AdminImageListView
            images={allImages || []}
            schoolMap={schoolMap}
            schoolDataMap={schoolDataMap}
            regions={regions}
            schoolLevels={schoolLevels}
            categories={categories || []}
            canDelete={true}
          />
        </div>
      </main>
    </div>
  );
}
