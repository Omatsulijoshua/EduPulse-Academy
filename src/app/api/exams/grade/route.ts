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

// Fetch student attempts for grading
export async function GET(request: Request) {
  const teacher = await getTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId");

  if (!examId) {
    return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
  }

  try {
    const attempts = await prisma.examAttempt.findMany({
      where: { examId, submittedAt: { not: null } },
      include: {
        student: {
          select: {
            user: { select: { name: true } },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ success: true, attempts });
  } catch (error) {
    console.error("Fetch attempts error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// Teacher grades theory/essay questions
export async function PUT(request: Request) {
  const teacher = await getTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { attemptId, grades } = await request.json(); // grades: Array of { answerId, score }

    if (!attemptId || !grades || !Array.isArray(grades)) {
      return NextResponse.json(
        { error: "Attempt ID and grades array are required" },
        { status: 400 }
      );
    }

    const gradingResult = await prisma.$transaction(async (tx) => {
      // 1. Update each theory answer score
      const updatePromises = grades.map((g) =>
        tx.answer.update({
          where: { id: g.answerId },
          data: {
            score: parseFloat(g.score.toString()),
            isGraded: true,
          },
        })
      );

      await Promise.all(updatePromises);

      // 2. Fetch all answers to calculate new final cumulative score
      const allAnswers = await tx.answer.findMany({
        where: { attemptId },
      });

      const finalCumulativeScore = allAnswers.reduce((sum, a) => sum + a.score, 0);
      const allGraded = allAnswers.every((a) => a.isGraded);

      // 3. Update exam attempt
      const attempt = await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          score: finalCumulativeScore,
          isGraded: allGraded,
        },
        include: {
          exam: { include: { questions: true } },
          student: { include: { user: { select: { name: true } } } },
        },
      });

      // 4. Log results to Results table if all answers are graded
      if (allGraded) {
        const totalPoints = attempt.exam.questions.reduce((sum, q) => sum + q.points, 0);
        const percent = totalPoints > 0 ? (finalCumulativeScore / totalPoints) * 100 : 0;
        let grade = "F";
        let remarks = "Failed";

        if (percent >= 75) {
          grade = "A";
          remarks = "Excellent Pass";
        } else if (percent >= 60) {
          grade = "B";
          remarks = "Credit Pass";
        } else if (percent >= 45) {
          grade = "C";
          remarks = "Pass";
        }

        // Upsert result
        const existingResult = await tx.result.findFirst({
          where: { attemptId },
        });

        if (existingResult) {
          await tx.result.update({
            where: { id: existingResult.id },
            data: {
              totalScore: finalCumulativeScore,
              grade,
              remarks,
            },
          });
        } else {
          await tx.result.create({
            data: {
              studentId: attempt.studentId,
              examId: attempt.examId,
              attemptId,
              totalScore: finalCumulativeScore,
              grade,
              remarks,
            },
          });
        }

        // Check if course final exam (Pace learning graduation trigger)
        if (attempt.exam.courseId && percent >= 75) {
          await tx.enrollment.updateMany({
            where: { studentId: attempt.studentId, courseId: attempt.exam.courseId },
            data: { isCompleted: true, progress: 100 },
          });

          // Check existing certificate
          const existingCert = await tx.certificate.findFirst({
            where: { studentId: attempt.studentId, courseId: attempt.exam.courseId },
          });

          if (!existingCert) {
            const certCode = `CN-${attempt.exam.courseId.slice(0, 4)}-${attempt.studentId.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
            await tx.certificate.create({
              data: {
                studentId: attempt.studentId,
                courseId: attempt.exam.courseId,
                certificateCode: certCode,
              },
            });
          }
        }
      }

      return { attempt, allGraded };
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: teacher.userId,
        action: "GRADE_THEORY_EXAM",
        details: `Teacher graded theory answers for student ${gradingResult.attempt.student.user.name} on exam ${gradingResult.attempt.exam.title}. Fully Graded: ${gradingResult.allGraded}`,
      },
    });

    return NextResponse.json({
      success: true,
      isGraded: gradingResult.allGraded,
      score: gradingResult.attempt.score,
    });
  } catch (error) {
    console.error("Teacher grade theory error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
