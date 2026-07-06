import { prisma } from "@/lib/db";
import ParentDashboard from "@/components/ParentDashboard";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // Live data reload

export default async function ParentPage() {
  // 1. Verify auth and role
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "PARENT") {
    redirect("/login");
  }

  const userId = payload.userId;

  // 2. Fetch Parent Profile
  const parent = await prisma.parent.findUnique({
    where: { userId },
  });

  if (!parent) {
    redirect("/login");
  }

  // 3. Fetch linked children (Student profiles)
  const students = await prisma.student.findMany({
    where: { parentId: parent.id },
    include: {
      user: { select: { name: true, email: true } },
      class: {
        include: {
          formTeacher: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      },
      enrollments: {
        include: {
          course: { select: { title: true, description: true } },
        },
      },
      attendance: {
        orderBy: { date: "desc" },
      },
      attempts: {
        where: { submittedAt: { not: null } },
        include: {
          exam: { select: { title: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
      submissions: {
        include: {
          assignment: {
            select: {
              title: true,
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
      reportCards: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // 4. Fetch all school Fee templates and map them to Payments for each student
  const fees = await prisma.fee.findMany({
    where: { schoolId: payload.schoolId! },
    orderBy: { dueDate: "asc" },
  });

  const childrenData = await Promise.all(
    students.map(async (student) => {
      const studentPayments = await prisma.payment.findMany({
        where: { studentId: student.id },
      });

      const paymentMap = new Map(studentPayments.map((p) => [p.feeId, p]));

      const invoices = fees.map((fee) => {
        const payment = paymentMap.get(fee.id);
        return {
          id: fee.id,
          title: fee.title,
          amount: fee.amount,
          dueDate: fee.dueDate,
          status: payment ? payment.status : "UNPAID",
          paidAt: payment?.paidAt ?? null,
        };
      });

      return {
        id: student.id,
        studentId: student.studentId,
        user: student.user,
        class: student.class ? {
          name: student.class.name,
          formTeacher: student.class.formTeacher ? {
            user: {
              name: student.class.formTeacher.user.name,
            },
          } : null,
        } : null,
        enrollments: student.enrollments.map((en) => ({
          id: en.id,
          course: en.course,
          progress: en.progress,
          isCompleted: en.isCompleted,
        })),
        attendance: student.attendance.map((att) => ({
          id: att.id,
          date: att.date.toISOString(),
          status: att.status,
          remarks: att.remarks,
        })),
        invoices,
        attempts: student.attempts.map((att) => ({
          id: att.id,
          exam: att.exam,
          score: att.score,
          isGraded: att.isGraded,
        })),
        submissions: student.submissions.map((sub) => ({
          id: sub.id,
          assignment: sub.assignment,
          score: sub.score,
          feedback: sub.feedback,
        })),
        reportCards: student.reportCards.map((rc) => ({
          id: rc.id,
          termName: rc.termName,
          sessionName: rc.sessionName,
          gpa: rc.gpa,
          remarks: rc.remarks,
          createdAt: rc.createdAt.toISOString(),
        })),
      };
    })
  );

  return (
    <ParentDashboard
      parentName={payload.name}
      children={childrenData as any}
    />
  );
}
