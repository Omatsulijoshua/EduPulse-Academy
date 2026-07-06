import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getTeacherOrAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;
  if (payload.role !== "TEACHER" && payload.role !== "SCHOOL_ADMIN") return null;

  return payload;
}

// 1. Fetch courses
export async function GET(request: Request) {
  const user = await getTeacherOrAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  try {
    if (courseId) {
      // Get detailed course with modules and lessons
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
      return NextResponse.json({ success: true, course });
    }

    // Get list of all courses for the school
    const courses = await prisma.course.findMany({
      where: { schoolId: user.schoolId! },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    console.error("Fetch courses error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 2. Write / Create Course, Module, or Lesson
export async function POST(request: Request) {
  const user = await getTeacherOrAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const schoolId = user.schoolId!;

  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    if (action === "create_course") {
      const { title, description, coverImage, price } = body;
      if (!title || !description) {
        return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
      }

      const course = await prisma.course.create({
        data: {
          title,
          description,
          coverImage: coverImage || null,
          price: parseFloat(price || "0"),
          schoolId,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE_COURSE",
          details: `Created course: ${title}`,
        },
      });

      return NextResponse.json({ success: true, course });
    }

    if (action === "create_module") {
      const { courseId, title, order } = body;
      if (!courseId || !title) {
        return NextResponse.json({ error: "Course ID and module title are required" }, { status: 400 });
      }

      // Auto calculate order if not specified
      let moduleOrder = order;
      if (moduleOrder === undefined) {
        const count = await prisma.courseModule.count({ where: { courseId } });
        moduleOrder = count + 1;
      }

      const moduleRecord = await prisma.courseModule.create({
        data: {
          title,
          order: parseInt(moduleOrder.toString()),
          courseId,
        },
      });

      return NextResponse.json({ success: true, module: moduleRecord });
    }

    if (action === "create_lesson") {
      const { moduleId, title, content, videoUrl, pdfUrl, duration, order } = body;
      if (!moduleId || !title) {
        return NextResponse.json({ error: "Module ID and lesson title are required" }, { status: 400 });
      }

      // Auto calculate order
      let lessonOrder = order;
      if (lessonOrder === undefined) {
        const count = await prisma.lesson.count({ where: { moduleId } });
        lessonOrder = count + 1;
      }

      const lesson = await prisma.lesson.create({
        data: {
          title,
          content: content || null,
          videoUrl: videoUrl || null,
          pdfUrl: pdfUrl || null,
          duration: parseInt(duration || "0"),
          order: parseInt(lessonOrder.toString()),
          moduleId,
        },
      });

      return NextResponse.json({ success: true, lesson });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Create course resource error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 3. Update Course, Module, or Lesson
export async function PUT(request: Request) {
  const user = await getTeacherOrAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    if (action === "update_course") {
      const { id, title, description, coverImage, price, isPublished } = body;
      if (!id) return NextResponse.json({ error: "Course ID is required" }, { status: 400 });

      const course = await prisma.course.update({
        where: { id },
        data: {
          title,
          description,
          coverImage,
          price: price !== undefined ? parseFloat(price.toString()) : undefined,
          isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
        },
      });

      return NextResponse.json({ success: true, course });
    }

    if (action === "update_module") {
      const { id, title, order } = body;
      if (!id) return NextResponse.json({ error: "Module ID is required" }, { status: 400 });

      const moduleRecord = await prisma.courseModule.update({
        where: { id },
        data: {
          title,
          order: order !== undefined ? parseInt(order.toString()) : undefined,
        },
      });

      return NextResponse.json({ success: true, module: moduleRecord });
    }

    if (action === "update_lesson") {
      const { id, title, content, videoUrl, pdfUrl, duration, order } = body;
      if (!id) return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });

      const lesson = await prisma.lesson.update({
        where: { id },
        data: {
          title,
          content,
          videoUrl,
          pdfUrl,
          duration: duration !== undefined ? parseInt(duration.toString()) : undefined,
          order: order !== undefined ? parseInt(order.toString()) : undefined,
        },
      });

      return NextResponse.json({ success: true, lesson });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update course resource error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
