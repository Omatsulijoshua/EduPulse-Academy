import { prisma } from "@/lib/db";
import StudentDashboard from "@/components/StudentDashboard";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // Live data refresh

export default async function StudentPage() {
  // Verify auth and role
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "STUDENT") {
    redirect("/login");
  }

  const userId = payload.userId;
  const schoolId = payload.schoolId!;

  // 1. Fetch Student Profile
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      class: {
        include: {
          formTeacher: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!student) {
    redirect("/login");
  }

  // 2. Fetch course enrollments and catalog
  const courses = await prisma.course.findMany({
    where: { schoolId, isPublished: true },
    include: {
      modules: {
        include: {
          lessons: { select: { id: true } },
        },
      },
    },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
  });

  const enrolledMap = new Map(enrollments.map((e) => [e.courseId, e]));

  const catalog = courses.map((course) => {
    const enrollment = enrolledMap.get(course.id);
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      coverImage: course.coverImage,
      price: course.price,
      isEnrolled: !!enrollment,
      progress: enrollment?.progress ?? 0,
      isCompleted: enrollment?.isCompleted ?? false,
    };
  });

  // 3. Fetch attendance logs (limited to 20)
  const attendanceLogs = await prisma.attendance.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
    take: 20,
  });

  // 4. Fetch announcements
  const announcements = await prisma.announcement.findMany({
    where: {
      schoolId,
      OR: [
        { target: "ALL" },
        { target: "STUDENTS" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // 5. Fetch assignments (Phase 4 Active classroom integration)
  const assignments = await prisma.assignment.findMany({
    where: {
      subject: { classId: student.classId || undefined },
    },
    include: {
      subject: { select: { name: true } },
      submissions: {
        where: { studentId: student.id },
        select: {
          id: true,
          submissionText: true,
          fileUrl: true,
          submittedAt: true,
          score: true,
          feedback: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // 6. Fetch materials (Phase 4 Active classroom integration)
  const materials = await prisma.material.findMany({
    where: {
      subject: { classId: student.classId || undefined },
    },
    include: {
      subject: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 7. Fetch active exams (Phase 5 CBT Exam integration)
  const examsList = await prisma.exam.findMany({
    where: {
      subject: { classId: student.classId || undefined },
    },
    include: {
      subject: { select: { name: true } },
      attempts: {
        where: { studentId: student.id },
        select: {
          id: true,
          submittedAt: true,
          score: true,
          isGraded: true,
        },
      },
      questions: { select: { id: true } },
    },
    orderBy: { id: "desc" },
  });

  // 8. Fetch compiled report cards (Phase 7 Academic Results integration)
  const reportCards = await prisma.reportCard.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
  });

  const classroomDetails = student.class
    ? {
        name: student.class.name,
        timetable: student.class.timetable,
        formTeacher: student.class.formTeacher
          ? {
              user: {
                name: student.class.formTeacher.user.name,
              },
            }
          : null,
      }
    : null;

  return (
    <StudentDashboard
      studentName={payload.name}
      catalogCourses={catalog as any}
      classroomDetails={classroomDetails}
      attendanceLogs={attendanceLogs as any}
      announcements={announcements as any}
      assignments={assignments as any}
      materials={materials as any}
      exams={examsList as any}
      reportCards={reportCards as any}
    />
  );
}
