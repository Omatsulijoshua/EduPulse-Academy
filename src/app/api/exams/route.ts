import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getTeacherOrAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== "TEACHER" && payload.role !== "SCHOOL_ADMIN")) return null;

  return payload;
}

// 1. Fetch exam details with questions
export async function GET(request: Request) {
  const user = await getTeacherOrAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId");
  const subjectId = searchParams.get("subjectId");

  try {
    if (examId) {
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          questions: true,
        },
      });
      return NextResponse.json({ success: true, exam });
    }

    if (subjectId) {
      const exams = await prisma.exam.findMany({
        where: { subjectId },
        include: {
          _count: { select: { attempts: true } },
        },
        orderBy: { startTime: "desc" },
      });
      return NextResponse.json({ success: true, exams });
    }

    // Default: Return all exams for the school
    const exams = await prisma.exam.findMany({
      where: {
        OR: [
          { subject: { class: { schoolId: user.schoolId! } } },
          { course: { schoolId: user.schoolId! } },
        ],
      },
      include: {
        subject: { select: { name: true, class: { select: { name: true } } } },
        course: { select: { title: true } },
        _count: { select: { attempts: true } },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ success: true, exams });
  } catch (error) {
    console.error("Fetch exams error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 2. Create Exam or Add Question
export async function POST(request: Request) {
  const user = await getTeacherOrAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Action parameter is required" }, { status: 400 });
    }

    if (action === "create_exam") {
      const { title, instructions, duration, startTime, endTime, shuffle, showResult, subjectId, courseId } = body;

      if (!title || !duration) {
        return NextResponse.json({ error: "Title and duration are required" }, { status: 400 });
      }

      const exam = await prisma.exam.create({
        data: {
          title,
          instructions: instructions || null,
          duration: parseInt(duration.toString()),
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          shuffle: shuffle !== undefined ? Boolean(shuffle) : false,
          showResult: showResult !== undefined ? Boolean(showResult) : true,
          subjectId: subjectId || null,
          courseId: courseId || null,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE_EXAM",
          details: `Created CBT Exam: ${title} (Duration: ${duration}m)`,
        },
      });

      return NextResponse.json({ success: true, exam });
    }

    if (action === "add_question") {
      const { examId, type, questionText, imageUrl, options, correctAnswer, points } = body;

      if (!examId || !type || !questionText) {
        return NextResponse.json(
          { error: "Exam ID, question type, and question text are required" },
          { status: 400 }
        );
      }

      const question = await prisma.question.create({
        data: {
          examId,
          type,
          questionText,
          imageUrl: imageUrl || null,
          options: options ? JSON.stringify(options) : null,
          correctAnswer: correctAnswer || null,
          points: points !== undefined ? parseFloat(points.toString()) : 1.0,
        },
      });

      return NextResponse.json({ success: true, question });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Create exam components error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
