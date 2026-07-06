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

  // Retrieve student profile id
  const student = await prisma.student.findUnique({
    where: { userId: payload.userId },
  });

  if (!student) return null;
  return { payload, studentId: student.id };
}

// 1. Fetch Student Catalog & Active Course Progress
export async function GET(request: Request) {
  const studentCtx = await getStudent();
  if (!studentCtx) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { studentId } = studentCtx;
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  try {
    if (courseId) {
      // Get detailed course with completion logs
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
              },
            },
          },
          exams: true,
        },
      });

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      // Fetch student progress for this course's lessons
      const progressLogs = await prisma.lessonProgress.findMany({
        where: {
          studentId,
          lesson: {
            module: { courseId },
          },
        },
      });

      const completedLessonIds = progressLogs.map((p) => p.lessonId);

      // Fetch enrollment details
      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId, courseId },
      });

      return NextResponse.json({
        success: true,
        course,
        completedLessonIds,
        enrollment,
      });
    }

    // Get catalog (all published courses in school) and mark enrolled ones
    const courses = await prisma.course.findMany({
      where: { schoolId: studentCtx.payload.schoolId!, isPublished: true },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
    });

    const enrolledMap = new Map(enrollments.map((e) => [e.courseId, e]));

    const catalog = courses.map((course) => {
      const enrollment = enrolledMap.get(course.id);
      return {
        ...course,
        isEnrolled: !!enrollment,
        progress: enrollment?.progress ?? 0,
        isCompleted: enrollment?.isCompleted ?? false,
      };
    });

    return NextResponse.json({ success: true, courses: catalog });
  } catch (error) {
    console.error("Student fetch catalog error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 2. Enroll in Course
export async function POST(request: Request) {
  const studentCtx = await getStudent();
  if (!studentCtx) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { studentId } = studentCtx;

  try {
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Check existing enrollment
    const existing = await prisma.enrollment.findFirst({
      where: { studentId, courseId },
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
      },
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 3. Mark Lesson Complete & Update Progression Percentage
export async function PUT(request: Request) {
  const studentCtx = await getStudent();
  if (!studentCtx) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { studentId } = studentCtx;

  try {
    const { lessonId, courseId } = await request.json();

    if (!lessonId || !courseId) {
      return NextResponse.json({ error: "Lesson ID and Course ID are required" }, { status: 400 });
    }

    // Check if progress already exists
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: { studentId, lessonId },
      },
    });

    if (!existingProgress) {
      // Save lesson completion log
      await prisma.lessonProgress.create({
        data: {
          studentId,
          lessonId,
        },
      });
    }

    // Recalculate progress percentage
    // 1. Get total lessons in this course
    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      include: {
        lessons: true,
      },
    });

    const allLessons = modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;

    if (totalLessons === 0) {
      return NextResponse.json({ success: true, progress: 100 });
    }

    // 2. Count completed lessons in this course
    const completedCount = await prisma.lessonProgress.count({
      where: {
        studentId,
        lesson: {
          module: { courseId },
        },
      },
    });

    const progressPercentage = Math.min((completedCount / totalLessons) * 100, 100);
    
    // Check if the course has a CBT final exam
    const exam = await prisma.exam.findFirst({
      where: { courseId },
    });

    // If there is NO exam and progress is 100%, mark course as completed and auto-issue certificate
    const isCompleted = progressPercentage >= 100 && !exam;

    const enrollment = await prisma.enrollment.updateMany({
      where: { studentId, courseId },
      data: {
        progress: parseFloat(progressPercentage.toFixed(1)),
        isCompleted,
      },
    });

    // Auto issue certificate if completed
    let certificateIssued = false;
    let certificateCode = "";
    if (isCompleted) {
      // Check if already issued
      const existingCert = await prisma.certificate.findFirst({
        where: { studentId, courseId },
      });

      if (!existingCert) {
        certificateCode = `CN-${courseId.slice(0, 4)}-${studentId.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
        await prisma.certificate.create({
          data: {
            studentId,
            courseId,
            certificateCode,
          },
        });
        certificateIssued = true;
      }
    }

    return NextResponse.json({
      success: true,
      progress: progressPercentage,
      isCompleted,
      certificateIssued,
      certificateCode,
    });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
