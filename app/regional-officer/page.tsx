import { school_report_images_requireRole } from '@/lib/auth/user';
import { school_report_images_createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardHeaderWrapper from '@/components/layout/DashboardHeaderWrapper';
import RegionalOfficerView from '@/components/regional-officer/RegionalOfficerView';
import { REGIONS, REGION_MAP } from '@/lib/constants/school-data';

export default async function RegionalOfficerPage() {
  const user = await school_report_images_requireRole(['regional_officer']);

  if (!user) {
    redirect('/login');
  }

  if (!user.regionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Region Assigned</h2>
          <p className="text-gray-600">
            Your account has not been assigned to a region yet. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  const regionName = REGION_MAP.get(user.regionId) || 'Unknown Region';
  const supabase = await school_report_images_createServerClient();

  // Fetch active categories
  const { data: categories } = await supabase
    .from('school_report_images_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  // Sort categories alphabetically with "Other" always last
  const sortedCategories = categories?.sort((a: any, b: any) => {
    if (a.name.toLowerCase() === 'other') return 1;
    if (b.name.toLowerCase() === 'other') return -1;
    return a.name.localeCompare(b.name);
  }) || [];

  // Fetch schools in this region
  const { data: schools } = await supabase
    .from('sms_schools')
    .select('code, name')
    .eq('region_id', user.regionId)
    .order('name');

  const schoolList = schools || [];

  // Get all school codes in this region
  const regionSchoolCodes = schoolList.map((s: any) => s.code);

  // Fetch existing images for all schools in this region
  let existingImages: any[] = [];
  if (regionSchoolCodes.length > 0) {
    const { data: images } = await supabase
      .from('school_report_images_uploaded_images')
      .select('*')
      .in('school_code', regionSchoolCodes);
    existingImages = images || [];
  }

  // Get statistics
  const schoolsWithImages = new Set(existingImages.map((img: any) => img.school_code)).size;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeaderWrapper
        title={`Regional Officer - ${regionName}`}
        subtitle={`${user.email} • Upload on behalf of schools in ${regionName}`}
        userName={regionName}
        userEmail={user.email}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Schools in Region</p>
            <p className="text-3xl font-bold text-gray-900">{schoolList.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Schools with Images</p>
            <p className="text-3xl font-bold text-gray-900">{schoolsWithImages}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Images</p>
            <p className="text-3xl font-bold text-gray-900">{existingImages.length}</p>
          </div>
        </div>

        <RegionalOfficerView
          schools={schoolList}
          categories={sortedCategories}
          existingImages={existingImages}
          userId={user.id}
          userEmail={user.email}
          regionName={regionName}
        />
      </main>
    </div>
  );
}
