import { school_report_images_createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await school_report_images_createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role, regionId } = body;

    // Validate role
    if (!['officer', 'regional_officer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role selection' }, { status: 400 });
    }

    // Regional officer must have a region
    if (role === 'regional_officer' && !regionId) {
      return NextResponse.json({ error: 'Region is required for Regional Officer' }, { status: 400 });
    }

    // Update the user profile with selected role, keep is_active=false (pending approval)
    const updateData: Record<string, any> = {
      role,
      region_id: role === 'regional_officer' ? regionId : null,
      is_active: false,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('school_report_images_users')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
