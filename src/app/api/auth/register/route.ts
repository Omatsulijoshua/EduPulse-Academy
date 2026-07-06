import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password, name, schoolName, schoolSlug } = await request.json();

    if (!email || !password || !name || !schoolName || !schoolSlug) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Check if school slug is already taken
    const existingSchool = await prisma.school.findUnique({
      where: { slug: schoolSlug.toLowerCase() },
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: "This school subdomain/URL slug is already taken" },
        { status: 400 }
      );
    }

    // Get default Pro subscription plan to attach to the school
    const defaultSubscription = await prisma.subscription.findFirst({
      where: { name: "Pro" },
    });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Run transaction to create School and Admin User
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create School
      const school = await tx.school.create({
        data: {
          name: schoolName,
          slug: schoolSlug.toLowerCase(),
          themeColor: "#1e40af", // Default Royal Blue
          subscriptionId: defaultSubscription?.id || null,
        },
      });

      // 2. Create School Admin User
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: "SCHOOL_ADMIN",
          schoolId: school.id,
        },
      });

      // 3. Log the action
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "REGISTER_SCHOOL",
          details: `Registered school ${schoolName} with admin user ${email}`,
        },
      });

      return { user, school };
    });

    // Sign JWT token
    const token = await signToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      schoolId: result.school.id,
      name: result.user.name,
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

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        schoolId: result.school.id,
        schoolName: result.school.name,
      },
      redirectTo: "/dashboard/school-admin",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
