import { prisma } from "@/lib/db";
import CoursePlayer from "@/components/CoursePlayer";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // Live data reload

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePlayerPage({ params }: PageProps) {
  // 1. Verify auth and role
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "STUDENT") {
    redirect("/login");
  }

  const { courseId } = await params;

  // 2. Fetch Student Profile
  const student = await prisma.student.findUnique({
    where: { userId: payload.userId },
  });

  if (!student) redirect("/login");

  // 3. Fetch course outline
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
    },
  });

  if (!course) {
    redirect("/dashboard/student");
  }

  // 4. Fetch student progress
  const progressLogs = await prisma.lessonProgress.findMany({
    where: {
      studentId: student.id,
      lesson: {
        module: { courseId },
      },
    },
    select: {
      lessonId: true,
    },
  });

  const completedLessonIds = progressLogs.map((p) => p.lessonId);

  // 5. Fetch enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, courseId },
  });

  return (
    <CoursePlayer
      course={{
        id: course.id,
        title: course.title,
        description: course.description,
      }}
      modules={course.modules as any}
      initialCompletedLessonIds={completedLessonIds}
      initialEnrollment={enrollment as any}
    />
  );
}
