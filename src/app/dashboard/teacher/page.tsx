import { prisma } from "@/lib/db";
import TeacherDashboard from "@/components/TeacherDashboard";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // Live data refresh

export default async function TeacherPage() {
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

  // 2. Fetch assigned subjects
  const assignedSubjects = await prisma.subject.findMany({
    where: { teacherId: teacher?.id || undefined },
    include: {
      class: {
        select: {
          name: true,
          _count: {
            select: { students: true },
          },
        },
      },
    },
  });

  // 3. Fetch courses
  const courses = await prisma.course.findMany({
    where: { schoolId },
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
  });

  return (
    <TeacherDashboard
      teacherName={payload.name}
      assignedSubjects={assignedSubjects as any}
      courses={courses as any}
    />
  );
}
