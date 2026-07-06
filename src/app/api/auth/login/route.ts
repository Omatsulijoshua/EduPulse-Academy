import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        school: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Sign token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      name: user.name,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        details: `User logged in from API`,
      },
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Redirect mapping
    const rolePathMap: Record<string, string> = {
      SUPER_ADMIN: "/dashboard/super-admin",
      SCHOOL_ADMIN: "/dashboard/school-admin",
      TEACHER: "/dashboard/teacher",
      STUDENT: "/dashboard/student",
      PARENT: "/dashboard/parent",
    };

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.school?.name || null,
      },
      redirectTo: rolePathMap[user.role] || "/login",
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
