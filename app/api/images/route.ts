import { NextRequest, NextResponse } from 'next/server';
import { school_report_images_createServerClient } from '@/lib/supabase/server';
import { school_report_images_getCurrentUser } from '@/lib/auth/user';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await school_report_images_getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'officer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const schoolsPerPage = parseInt(searchParams.get('limit') || '10');
    const categoryId = searchParams.get('categoryId') || null;

    const supabase = await school_report_images_createServerClient();

    // Step 1: Get all unique school codes with image count, filtered by category
    let schoolQuery = supabase
      .from('school_report_images_uploaded_images')
      .select('school_code');

    // Apply category filter if provided
    if (categoryId && categoryId !== 'all') {
      schoolQuery = schoolQuery.eq('category_id', categoryId);
    }

    const { data: schoolData, error: schoolError } = await schoolQuery;

    if (schoolError) {
      return NextResponse.json({ error: schoolError.message }, { status: 500 });
    }

    // Get unique school codes and sort them
    const uniqueSchools = Array.from(
      new Set(schoolData?.map(s => s.school_code) || [])
    ).sort();

    const totalSchools = uniqueSchools.length;
    const totalPages = Math.ceil(totalSchools / schoolsPerPage);

    // Step 2: Get paginated school codes
    const startIndex = (page - 1) * schoolsPerPage;
    const endIndex = startIndex + schoolsPerPage;
    const paginatedSchools = uniqueSchools.slice(startIndex, endIndex);

    // Step 3: Fetch all images for the paginated schools
    let imagesQuery = supabase
      .from('school_report_images_uploaded_images')
      .select(`
        *,
        category:school_report_images_categories(name, description)
      `)
      .in('school_code', paginatedSchools)
      .order('created_at', { ascending: false });

    // Apply category filter if provided
    if (categoryId && categoryId !== 'all') {
      imagesQuery = imagesQuery.eq('category_id', categoryId);
    }

    const { data: images, error: imagesError } = await imagesQuery;

    if (imagesError) {
      return NextResponse.json({ error: imagesError.message }, { status: 500 });
    }

    return NextResponse.json({
      images: images || [],
      totalSchools,
      totalImages: images?.length || 0,
      page,
      schoolsPerPage,
      totalPages,
      schoolCodes: paginatedSchools,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
