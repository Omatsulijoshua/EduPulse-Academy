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
    const body = await request.json();
    const { type, name } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "Type and name are required" }, { status: 400 });
    }

    if (type === "session") {
      // Create session
      // Make this current if there are no other sessions
      const existingSessions = await prisma.session.count({ where: { schoolId } });
      const isCurrent = existingSessions === 0;

      const session = await prisma.session.create({
        data: {
          name,
          isCurrent,
          schoolId,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: admin.userId,
          action: "CREATE_SESSION",
          details: `School Admin created session: ${name}`,
        },
      });

      return NextResponse.json({ success: true, session });
    }

    if (type === "term") {
      const { sessionId } = body;
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
      }

      // Check current
      const existingTerms = await prisma.term.count({ where: { session: { schoolId } } });
      const isCurrent = existingTerms === 0;

      const term = await prisma.term.create({
        data: {
          name,
          isCurrent,
          sessionId,
        },
        include: {
          session: { select: { name: true } },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: admin.userId,
          action: "CREATE_TERM",
          details: `School Admin created term: ${name}`,
        },
      });

      return NextResponse.json({ success: true, term });
    }

    if (type === "class") {
      const { formTeacherId } = body;
      
      const currentTerm = await prisma.term.findFirst({
        where: { session: { schoolId }, isCurrent: true },
      });

      const classroom = await prisma.class.create({
        data: {
          name,
          schoolId,
          termId: currentTerm?.id || null,
          formTeacherId: formTeacherId || null,
        },
        include: {
          formTeacher: {
            include: { user: { select: { name: true } } },
          },
          _count: {
            select: { students: true, subjects: true },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: admin.userId,
          action: "CREATE_CLASS",
          details: `School Admin created class: ${name}`,
        },
      });

      return NextResponse.json({ success: true, class: classroom });
    }

    if (type === "subject") {
      const { classId, teacherId } = body;
      if (!classId) {
        return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
      }

      const subject = await prisma.subject.create({
        data: {
          name,
          classId,
          teacherId: teacherId || null,
        },
        include: {
          class: { select: { name: true } },
          teacher: {
            include: { user: { select: { name: true } } },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: admin.userId,
          action: "CREATE_SUBJECT",
          details: `School Admin created subject: ${name} inside classId ${classId}`,
        },
      });

      return NextResponse.json({ success: true, subject });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Structure error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
