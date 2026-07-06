import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Fetch fresh user from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        school: true,
        studentProfile: {
          include: {
            class: true,
          },
        },
        teacherProfile: true,
        parentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        schoolSlug: user.school?.slug || null,
        schoolName: user.school?.name || null,
        themeColor: user.school?.themeColor || null,
        studentProfile: user.studentProfile || null,
        teacherProfile: user.teacherProfile || null,
        parentProfile: user.parentProfile || null,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
