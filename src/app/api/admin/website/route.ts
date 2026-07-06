import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getSchoolAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "SCHOOL_ADMIN" || !payload.schoolId) return null;

  return payload;
}

export async function POST(request: Request) {
  const admin = await getSchoolAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const schoolId = admin.schoolId;

  try {
    const { logo, themeColor, tagline, about } = await request.json();

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        logo: logo || null,
        themeColor: themeColor || "#1e40af",
        tagline: tagline || null,
        about: about || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "UPDATE_SCHOOL_WEBSITE",
        details: `Updated school portal layout options for ${school.name}`,
      },
    });

    return NextResponse.json({ success: true, school });
  } catch (error) {
    console.error("Failed to update school website:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
