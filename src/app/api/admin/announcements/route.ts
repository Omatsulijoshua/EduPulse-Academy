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

// Get school announcements list
export async function GET() {
  const admin = await getSchoolAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const announcements = await prisma.announcement.findMany({
      where: { schoolId: admin.schoolId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error("Fetch announcements error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}

// Create new announcement / bulletin alert
export async function POST(request: Request) {
  const admin = await getSchoolAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { title, content, target } = await request.json();

    if (!title || !content || !target) {
      return NextResponse.json(
        { error: "Title, content, and target are required" },
        { status: 400 }
      );
    }

    if (!["ALL", "TEACHERS", "STUDENTS"].includes(target)) {
      return NextResponse.json({ error: "Invalid target audience" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        schoolId: admin.schoolId,
        title,
        content,
        target,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "CREATE_ANNOUNCEMENT",
        details: `Broadcast bulletin: ${title} to ${target}`,
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
