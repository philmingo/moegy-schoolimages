import { school_report_images_getCurrentUser, school_report_images_requireRole } from '@/lib/auth/user';
import { school_report_images_createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SchoolUploadInterface from '@/components/upload/SchoolUploadInterface';
import DashboardHeaderWrapper from '@/components/layout/DashboardHeaderWrapper';

export default async function SchoolPage() {
  // Allow schools and admins (admins can view/test school pages)
  const user = await school_report_images_requireRole(['school', 'admin']);

  // If admin, redirect to admin page (they shouldn't be here)
  if (user.role === 'admin') {
    redirect('/admin');
  }

  if (!user || !user.schoolCode) {
    redirect('/login');
  }

  const supabase = await school_report_images_createServerClient();

  // Fetch active categories
  const { data: categories } = await supabase
    .from('school_report_images_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  // Fetch existing images for this school
  const { data: existingImages } = await supabase
    .from('school_report_images_uploaded_images')
    .select('*')
    .eq('school_code', user.schoolCode);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeaderWrapper
        title={user.schoolName || user.schoolCode}
        subtitle={`${user.email} • School Code: ${user.schoolCode}`}
        userName={user.schoolName || user.schoolCode}
        userEmail={user.email}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Upload Incident Report Images
          </h2>
          <p className="text-gray-600">
            Upload up to 4 images per category. Accepted formats: JPG, PNG, WEBP (max 10MB each)
          </p>
        </div>

        <SchoolUploadInterface
          categories={categories || []}
          existingImages={existingImages || []}
          schoolCode={user.schoolCode}
          userId={user.id}
          userEmail={user.email}
        />
      </main>
    </div>
  );
}
