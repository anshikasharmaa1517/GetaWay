import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // We rely on server components to gate access; keep middleware minimal for now.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/upload"],
};


