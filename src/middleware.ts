import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve JWT token from cookies
  const tokenCookie = request.cookies.get("token");
  const token = tokenCookie?.value;

  // Paths that require authentication
  const isDashboardPath = pathname.startsWith("/dashboard");
  
  // Paths for authentication (only accessible when not logged in)
  const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Get user payload if token is valid
  const user = token ? await verifyToken(token) : null;

  if (isDashboardPath) {
    if (!user) {
      // User is not logged in, redirect to login page
      const loginUrl = new URL("/login", request.url);
      // Keep track of the original page they wanted to visit
      loginUrl.searchParams.set("callbackUrl", pathname);
      
      const response = NextResponse.redirect(loginUrl);
      // Clear invalid token cookie just in case
      response.cookies.delete("token");
      return response;
    }

    // Role-based Access Control (RBAC)
    const role = user.role;
    
    // Define dashboard sub-routes based on roles
    const rolePathMap: Record<string, string> = {
      SUPER_ADMIN: "/dashboard/super-admin",
      SCHOOL_ADMIN: "/dashboard/school-admin",
      TEACHER: "/dashboard/teacher",
      STUDENT: "/dashboard/student",
      PARENT: "/dashboard/parent",
    };

    const allowedPrefix = rolePathMap[role];

    if (!allowedPrefix) {
      // Unknown role, clear token and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    // Check if the user is trying to access a sub-dashboard that doesn't match their role
    if (!pathname.startsWith(allowedPrefix)) {
      // Redirect them to their designated home dashboard
      return NextResponse.redirect(new URL(allowedPrefix, request.url));
    }
  }

  if (isAuthPath) {
    if (user) {
      // If user is already logged in, redirect to their dashboard
      const rolePathMap: Record<string, string> = {
        SUPER_ADMIN: "/dashboard/super-admin",
        SCHOOL_ADMIN: "/dashboard/school-admin",
        TEACHER: "/dashboard/teacher",
        STUDENT: "/dashboard/student",
        PARENT: "/dashboard/parent",
      };

      const dashboardPath = rolePathMap[user.role] || "/login";
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
