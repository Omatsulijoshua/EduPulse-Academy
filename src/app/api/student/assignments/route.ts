import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getStudent() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "STUDENT") return null;

  const student = await prisma.student.findUnique({
    where: { userId: payload.userId },
  });

  if (!student) return null;
  return { payload, studentId: student.id };
}

// 1. Fetch student assignments and submissions
export async function GET() {
  const studentCtx = await getStudent();
  if (!studentCtx) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { studentId } = studentCtx;

  try {
    // Find student's class and subjects
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!student || !student.classId) {
      return NextResponse.json({ success: true, assignments: [] });
    }

    // Get all assignments for class subjects
    const assignments = await prisma.assignment.findMany({
      where: {
        subject: { classId: student.classId },
      },
      include: {
        subject: { select: { name: true } },
        submissions: {
          where: { studentId },
          select: {
            id: true,
            submissionText: true,
            fileUrl: true,
            submittedAt: true,
            score: true,
            feedback: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error("Student fetch assignments error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 2. Submit homework
export async function POST(request: Request) {
  const studentCtx = await getStudent();
  if (!studentCtx) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { studentId } = studentCtx;

  try {
    const { assignmentId, submissionText, fileUrl } = await request.json();

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    // Check if already submitted
    const existing = await prisma.assignmentSubmission.findFirst({
      where: { studentId, assignmentId },
    });

    if (existing) {
      return NextResponse.json({ error: "Homework already submitted for this assignment" }, { status: 400 });
    }

    // Create submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        submissionText: submissionText || null,
        fileUrl: fileUrl || null,
      },
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("Homework submission error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
