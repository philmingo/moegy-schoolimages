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
    const { school_code, category_id, storage_path, filename, comment } = body;

    if (!school_code || !category_id || !storage_path || !filename) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Authorization: check the user is allowed to upload for this school
    if (user.role === 'school') {
      if (user.schoolCode !== school_code) {
        return NextResponse.json({ error: 'You can only upload for your own school' }, { status: 403 });
      }
    } else if (user.role === 'regional_officer') {
      if (!user.regionId) {
        return NextResponse.json({ error: 'No region assigned' }, { status: 403 });
      }
      // Verify the school belongs to the officer's region
      const supabase = school_report_images_createServiceClient();
      const { data: school } = await supabase
        .from('sms_schools')
        .select('region_id')
        .eq('code', school_code)
        .single();

      if (!school || school.region_id !== user.regionId) {
        return NextResponse.json({ error: 'School is not in your region' }, { status: 403 });
      }
    } else if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Your role cannot upload images' }, { status: 403 });
    }

    // Insert using service role client to bypass RLS
    const supabase = school_report_images_createServiceClient();

    const insertData: Record<string, string> = {
      school_code,
      category_id,
      storage_path,
      filename,
      uploaded_by_email: user.email,
      uploaded_by_user_id: user.id,
    };

    if (comment?.trim()) {
      insertData.comment = comment.trim();
    }

    const { data, error: dbError } = await supabase
      .from('school_report_images_uploaded_images')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
