import { NextRequest, NextResponse } from 'next/server';
import { school_report_images_getCurrentUser } from '@/lib/auth/user';
import { school_report_images_createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const user = await school_report_images_getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '[API] Unauthorized - no user session' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const school_code = formData.get('school_code') as string | null;
    const category_id = formData.get('category_id') as string | null;
    const filename = formData.get('filename') as string | null;
    const comment = formData.get('comment') as string | null;

    if (!file || !school_code || !category_id || !filename) {
      return NextResponse.json({ error: '[API] Missing required fields' }, { status: 400 });
    }

    // Authorization: check the user is allowed to upload for this school
    const supabase = school_report_images_createServiceClient();

    if (user.role === 'school') {
      if (user.schoolCode !== school_code) {
        return NextResponse.json({ error: '[API] You can only upload for your own school' }, { status: 403 });
      }
    } else if (user.role === 'regional_officer') {
      if (!user.regionId) {
        return NextResponse.json({ error: '[API] No region assigned' }, { status: 403 });
      }
      // Regional officers can upload for any school — the UI only shows schools in their region
    } else if (user.role !== 'admin') {
      return NextResponse.json({ error: '[API] Your role cannot upload images' }, { status: 403 });
    }

    // Generate unique storage path
    const fileExt = filename.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storagePath = `${school_code}/${category_id}/${uniqueName}`;

    // Convert File to Buffer for Node.js/Netlify compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to storage using service client (bypasses RLS)
    const { error: uploadError } = await supabase.storage
      .from('school-report-images')
      .upload(storagePath, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json({
        error: `[API] Storage upload error: ${uploadError.message}`
      }, { status: 500 });
    }

    // Insert metadata record
    const insertData: Record<string, string> = {
      school_code,
      category_id,
      storage_path: storagePath,
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
      // Clean up the uploaded file if DB insert fails
      await supabase.storage.from('school-report-images').remove([storagePath]);
      return NextResponse.json({
        error: `[API] DB error: ${dbError.message}`
      }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: `[API] Server error: ${error.message || 'Unknown'}` },
      { status: 500 }
    );
  }
}
