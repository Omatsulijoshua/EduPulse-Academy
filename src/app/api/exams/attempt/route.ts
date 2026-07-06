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

  return student;
}

// 1. Start Exam Attempt
export async function POST(request: Request) {
  const student = await getStudent();
  if (!student) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { examId } = await request.json();

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { select: { id: true } } },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Check for active attempt
    let attempt = await prisma.examAttempt.findFirst({
      where: { studentId: student.id, examId },
      include: { answers: true },
    });

    if (attempt) {
      if (attempt.submittedAt) {
        return NextResponse.json({
          error: "You have already submitted this exam.",
          alreadySubmitted: true,
        });
      }
      // Resume attempt
      return NextResponse.json({ success: true, attempt, resume: true });
    }

    // Start fresh attempt
    attempt = await prisma.examAttempt.create({
      data: {
        examId,
        studentId: student.id,
      },
      include: { answers: true },
    });

    return NextResponse.json({ success: true, attempt, resume: false });
  } catch (error) {
    console.error("Start attempt error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 2. Submit Exam Attempt & Run Auto-Grading Engine
export async function PUT(request: Request) {
  const student = await getStudent();
  if (!student) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { attemptId, answers } = await request.json(); // answers: Array of { questionId, studentAnswer }

    if (!attemptId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Attempt ID and answers array are required" },
        { status: 400 }
      );
    }

    // Fetch the attempt and exam questions
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: { include: { questions: true } } },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Exam attempt not found" }, { status: 404 });
    }

    if (attempt.submittedAt) {
      return NextResponse.json({ error: "Exam attempt already submitted" }, { status: 400 });
    }

    // Save student answers and run auto-grading inside a transaction
    const submissionResult = await prisma.$transaction(async (tx) => {
      let cumulativeScore = 0;
      let allObjectiveGraded = true;

      // 1. Create answers records and calculate scores
      const answerPromises = answers.map(async (ans) => {
        const question = attempt.exam.questions.find((q) => q.id === ans.questionId);
        if (!question) return;

        let score = 0;
        let isGraded = false;

        // Auto grading logic
        const type = question.type;
        const studentAnsNorm = (ans.studentAnswer || "").trim().toLowerCase();
        const correctAnsNorm = (question.correctAnswer || "").trim().toLowerCase();

        if (type === "MCQ" || type === "TRUE_FALSE") {
          isGraded = true;
          score = studentAnsNorm === correctAnsNorm ? question.points : 0;
          cumulativeScore += score;
        } else if (type === "SHORT_ANSWER") {
          isGraded = true;
          score = studentAnsNorm === correctAnsNorm ? question.points : 0;
          cumulativeScore += score;
        } else {
          // THEORY / ESSAY
          allObjectiveGraded = false;
        }

        return tx.answer.create({
          data: {
            attemptId,
            questionId: ans.questionId,
            studentAnswer: ans.studentAnswer || "",
            score,
            isGraded,
          },
        });
      });

      await Promise.all(answerPromises);

      // 2. Mark attempt as submitted
      const updatedAttempt = await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          submittedAt: new Date(),
          score: cumulativeScore,
          isGraded: allObjectiveGraded,
        },
      });

      // 3. Log results to Results table if fully graded
      if (allObjectiveGraded) {
        // Calculate Grade (A, B, C, F based on % score)
        const totalPoints = attempt.exam.questions.reduce((sum, q) => sum + q.points, 0);
        const percent = totalPoints > 0 ? (cumulativeScore / totalPoints) * 100 : 0;
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

        const result = await tx.result.create({
          data: {
            studentId: student.id,
            examId: attempt.examId,
            attemptId,
            totalScore: cumulativeScore,
            grade,
            remarks,
          },
        });

        // 4. Check if course final exam (Pace learning graduation trigger)
        if (attempt.exam.courseId && percent >= 75) {
          // Verify enrollment progress is 100%
          await tx.enrollment.updateMany({
            where: { studentId: student.id, courseId: attempt.exam.courseId },
            data: { isCompleted: true, progress: 100 },
          });

          // Issue Certificate
          const certCode = `CN-${attempt.exam.courseId.slice(0, 4)}-${student.id.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
          await tx.certificate.create({
            data: {
              studentId: student.id,
              courseId: attempt.exam.courseId,
              certificateCode: certCode,
            },
          });
        }
      }

      return { updatedAttempt, isGraded: allObjectiveGraded };
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: student.userId,
        action: "SUBMIT_EXAM",
        details: `Student submitted CBT Exam Attempt: ${attempt.exam.title}. Fully Graded: ${submissionResult.isGraded}`,
      },
    });

    return NextResponse.json({
      success: true,
      isGraded: submissionResult.isGraded,
      score: submissionResult.updatedAttempt.score,
    });
  } catch (error) {
    console.error("Submit attempt error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
