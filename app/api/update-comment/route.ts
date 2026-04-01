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
    const { image_id, comment } = body;

    if (!image_id) {
      return NextResponse.json({ error: 'Missing image_id' }, { status: 400 });
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

    // Authorization check - same as delete
    if (user.role === 'school') {
      if (user.schoolCode !== image.school_code) {
        return NextResponse.json({ error: 'You can only edit comments for your own school' }, { status: 403 });
      }
    } else if (user.role === 'regional_officer') {
      if (!user.regionId) {
        return NextResponse.json({ error: 'No region assigned' }, { status: 403 });
      }
    } else if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Your role cannot edit comments' }, { status: 403 });
    }

    // Update the comment
    const newComment = typeof comment === 'string' && comment.trim() ? comment.trim() : null;

    const { data: updated, error: dbError } = await supabase
      .from('school_report_images_uploaded_images')
      .update({ comment: newComment })
      .eq('id', image_id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
