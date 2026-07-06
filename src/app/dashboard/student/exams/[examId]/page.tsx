import { prisma } from "@/lib/db";
import CBTExamPlayer from "@/components/CBTExamPlayer";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // Live data reload

interface PageProps {
  params: Promise<{ examId: string }>;
}

export default async function ExamPlayerPage({ params }: PageProps) {
  // 1. Verify auth and role
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "STUDENT") {
    redirect("/login");
  }

  const { examId } = await params;

  // 2. Fetch student details
  const student = await prisma.student.findUnique({
    where: { userId: payload.userId },
  });

  if (!student) redirect("/login");

  // 3. Fetch exam along with questions
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        select: {
          id: true,
          type: true,
          questionText: true,
          options: true,
          points: true,
        },
      },
    },
  });

  if (!exam) {
    redirect("/dashboard/student");
  }

  return (
    <CBTExamPlayer
      exam={{
        id: exam.id,
        title: exam.title,
        instructions: exam.instructions,
        duration: exam.duration,
        showResult: exam.showResult,
        questions: exam.questions as any,
      }}
    />
  );
}
