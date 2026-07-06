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

// 1. Fetch submissions for an assignment
export async function GET(request: Request) {
  const teacher = await getTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");

  if (!assignmentId) {
    return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
  }

  try {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ success: true, submissions });
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 2. Create new assignment
export async function POST(request: Request) {
  const teacher = await getTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { title, description, dueDate, fileUrl, subjectId } = await request.json();

    if (!title || !description || !dueDate || !subjectId) {
      return NextResponse.json(
        { error: "Title, description, due date, and subject ID are required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        fileUrl: fileUrl || null,
        subjectId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: teacher.userId,
        action: "CREATE_ASSIGNMENT",
        details: `Created homework assignment: ${title} under subjectId ${subjectId}`,
      },
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error("Create assignment error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 3. Grade a student submission
export async function PUT(request: Request) {
  const teacher = await getTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { submissionId, score, feedback } = await request.json();

    if (!submissionId || score === undefined) {
      return NextResponse.json(
        { error: "Submission ID and score are required" },
        { status: 400 }
      );
    }

    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: parseFloat(score.toString()),
        feedback: feedback || null,
      },
      include: {
        assignment: { select: { title: true } },
        student: { include: { user: { select: { name: true } } } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: teacher.userId,
        action: "GRADE_SUBMISSION",
        details: `Graded homework submission by student ${submission.student.user.name} for assignment ${submission.assignment.title} with score ${score}`,
      },
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("Grade submission error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
