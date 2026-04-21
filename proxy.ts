import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/sanity/:path*', '/api/analytics/:path*', '/api/mailchimp/:path*', '/api/generate-intro/:path*', '/api/settings/:path*', '/api/sync-intros/:path*'],
};
