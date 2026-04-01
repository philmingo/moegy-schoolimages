import { NextRequest, NextResponse } from 'next/server';
import { school_report_images_getCurrentUser } from '@/lib/auth/user';
import { school_report_images_createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const user = await school_report_images_getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { image_id, storage_path } = body;

    if (!image_id || !storage_path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = school_report_images_createServiceClient();

    // Fetch the image to verify ownership/permission
    const { data: image } = await supabase
      .from('school_report_images_uploaded_images')
      .select('school_code, uploaded_by_user_id')
      .eq('id', image_id)
      .single();

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Authorization check
    if (user.role === 'school') {
      if (user.schoolCode !== image.school_code) {
        return NextResponse.json({ error: 'You can only delete images for your own school' }, { status: 403 });
      }
    } else if (user.role === 'regional_officer') {
      if (!user.regionId) {
        return NextResponse.json({ error: 'No region assigned' }, { status: 403 });
      }
      const { data: school } = await supabase
        .from('sms_schools')
        .select('region_id')
        .eq('code', image.school_code)
        .single();

      if (!school || school.region_id !== user.regionId) {
        return NextResponse.json({ error: 'Image is not in your region' }, { status: 403 });
      }
    } else if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Your role cannot delete images' }, { status: 403 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('school-report-images')
      .remove([storage_path]);

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('school_report_images_uploaded_images')
      .delete()
      .eq('id', image_id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
