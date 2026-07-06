import { prisma } from "@/lib/db";
import TeacherCBTConsole from "@/components/TeacherCBTConsole";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // Live data reload

export default async function TeacherCBTPage() {
  // Verify auth and role
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== "TEACHER" && payload.role !== "SCHOOL_ADMIN")) {
    redirect("/login");
  }

  const userId = payload.userId;
  const schoolId = payload.schoolId!;

  // 1. Fetch Teacher Profile
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  if (!teacher && payload.role === "TEACHER") {
    redirect("/login");
  }

  // 2. Fetch exams
  const exams = await prisma.exam.findMany({
    where: {
      OR: [
        { subject: { teacherId: teacher?.id || undefined } },
        { course: { schoolId } },
      ],
    },
    include: {
      subject: { select: { name: true, class: { select: { name: true } } } },
      course: { select: { title: true } },
      _count: { select: { attempts: true } },
    },
    orderBy: { id: "desc" },
  });

  // 3. Fetch subjects
  const subjects = await prisma.subject.findMany({
    where: { teacherId: teacher?.id || undefined },
    select: {
      id: true,
      name: true,
      class: {
        select: { name: true },
      },
    },
  });

  // 4. Fetch courses
  const courses = await prisma.course.findMany({
    where: { schoolId },
    select: {
      id: true,
      title: true,
    },
  });

  return (
    <TeacherCBTConsole
      initialExams={exams as any}
      subjects={subjects}
      courses={courses}
    />
  );
}
