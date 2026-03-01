import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path  = req.nextUrl.pathname;

    // Nur Admins dürfen Benutzerverwaltung sehen
    if (path.startsWith("/dashboard/benutzerverwaltung") && token?.rolle !== "ADMINISTRATOR") {
      return NextResponse.redirect(new URL("/dashboard/projekte", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
