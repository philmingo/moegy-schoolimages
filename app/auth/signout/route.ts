import { school_report_images_createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await school_report_images_createServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/login', request.url));
}
