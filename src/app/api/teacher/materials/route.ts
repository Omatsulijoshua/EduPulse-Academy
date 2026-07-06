import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getTeacher() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== "TEACHER" && payload.role !== "SCHOOL_ADMIN")) return null;

  return payload;
}

// 1. Fetch materials for a subject
export async function GET(request: Request) {
  const teacher = await getTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");

  if (!subjectId) {
    return NextResponse.json({ error: "Subject ID is required" }, { status: 400 });
  }

  try {
    const materials = await prisma.material.findMany({
      where: { subjectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, materials });
  } catch (error) {
    console.error("Fetch materials error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 2. Upload notes / material
export async function POST(request: Request) {
  const teacher = await getTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { title, fileUrl, subjectId } = await request.json();

    if (!title || !fileUrl || !subjectId) {
      return NextResponse.json(
        { error: "Title, file URL, and subject ID are required" },
        { status: 400 }
      );
    }

    const material = await prisma.material.create({
      data: {
        title,
        fileUrl,
        subjectId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: teacher.userId,
        action: "CREATE_MATERIAL",
        details: `Uploaded class material: ${title} under subjectId ${subjectId}`,
      },
    });

    return NextResponse.json({ success: true, material });
  } catch (error) {
    console.error("Upload material error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
