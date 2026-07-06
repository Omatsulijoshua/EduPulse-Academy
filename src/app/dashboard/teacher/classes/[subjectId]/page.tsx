import { prisma } from "@/lib/db";
import ClassroomManager from "@/components/ClassroomManager";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // Live data reload

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectManagerPage({ params }: PageProps) {
  // 1. Verify auth and role
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== "TEACHER" && payload.role !== "SCHOOL_ADMIN")) {
    redirect("/login");
  }

  const { subjectId } = await params;

  // 2. Fetch subject and class section
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      class: {
        select: { id: true, name: true },
      },
    },
  });

  if (!subject) {
    redirect("/dashboard/teacher");
  }

  // 3. Fetch student roster in that class
  const roster = await prisma.student.findMany({
    where: { classId: subject.class.id },
    select: {
      id: true,
      studentId: true,
      user: {
        select: { name: true, email: true },
      },
    },
  });

  // 4. Fetch materials
  const materials = await prisma.material.findMany({
    where: { subjectId },
    orderBy: { createdAt: "desc" },
  });

  // 5. Fetch assignments
  const assignments = await prisma.assignment.findMany({
    where: { subjectId },
    orderBy: { dueDate: "desc" },
  });

  return (
    <ClassroomManager
      subject={{
        id: subject.id,
        name: subject.name,
        class: {
          id: subject.class.id,
          name: subject.class.name,
        },
      }}
      roster={roster as any}
      initialMaterials={materials as any}
      initialAssignments={assignments as any}
    />
  );
}
