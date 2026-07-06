import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getAdminOrTeacher() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== "SCHOOL_ADMIN" && payload.role !== "TEACHER")) return null;

  return payload;
}

// 1. Fetch report cards
export async function GET(request: Request) {
  const user = await getAdminOrTeacher();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");

  if (!classId) {
    return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
  }

  try {
    const reportCards = await prisma.reportCard.findMany({
      where: {
        student: { classId },
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, reportCards });
  } catch (error) {
    console.error("Fetch report cards error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 2. Compile Report Card
export async function POST(request: Request) {
  const user = await getAdminOrTeacher();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { studentId, termName, sessionName, remarks } = await request.json();

    if (!studentId || !termName || !sessionName) {
      return NextResponse.json(
        { error: "Student ID, Term, and Session names are required" },
        { status: 400 }
      );
    }

    // 1. Fetch student's grades to compile GPA
    // Query homework assignment scores
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId, score: { not: null } },
      select: { score: true },
    });

    // Query exam scores
    const examAttempts = await prisma.examAttempt.findMany({
      where: { studentId, score: { not: null } },
      select: { score: true, exam: { select: { questions: { select: { points: true } } } } },
    });

    // Compute average scores
    let assignSum = 0;
    submissions.forEach((s) => (assignSum += s.score || 0));
    const assignAvg = submissions.length > 0 ? assignSum / submissions.length : 80; // fallback default

    let examPercentSum = 0;
    examAttempts.forEach((att) => {
      const totalPoints = att.exam.questions.reduce((sum, q) => sum + q.points, 0);
      const percent = totalPoints > 0 ? ((att.score || 0) / totalPoints) * 100 : 80;
      examPercentSum += percent;
    });
    const examAvg = examAttempts.length > 0 ? examPercentSum / examAttempts.length : 85;

    // Term GPA is simply average of assignments and exams percents mapped to 4.0 scale
    const termAveragePercent = (assignAvg + examAvg) / 2;
    const gpa = parseFloat(Math.min((termAveragePercent / 100) * 4.0, 4.0).toFixed(2));

    // 2. Upsert report card
    const existing = await prisma.reportCard.findFirst({
      where: { studentId, termName, sessionName },
    });

    let reportCard;
    if (existing) {
      reportCard = await prisma.reportCard.update({
        where: { id: existing.id },
        data: {
          gpa,
          remarks: remarks || "Promoted.",
        },
      });
    } else {
      reportCard = await prisma.reportCard.create({
        data: {
          studentId,
          termName,
          sessionName,
          gpa,
          remarks: remarks || "Promoted.",
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "COMPILE_REPORT_CARD",
        details: `Compiled report card for studentId ${studentId} (Term: ${termName}, GPA: ${gpa})`,
      },
    });

    return NextResponse.json({ success: true, reportCard });
  } catch (error) {
    console.error("Compile report card error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
