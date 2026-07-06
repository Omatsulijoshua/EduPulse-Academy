import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

async function getSchoolAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "SCHOOL_ADMIN" || !payload.schoolId) return null;

  return payload;
}

export async function POST(request: Request) {
  const admin = await getSchoolAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const schoolId = admin.schoolId;

  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and profile in transaction
    const profile = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          schoolId,
        },
      });

      if (role === "TEACHER") {
        const { payrollSalary, bio, qualifications } = body;
        const teacher = await tx.teacher.create({
          data: {
            userId: user.id,
            payrollSalary: parseFloat(payrollSalary || "0"),
            bio: bio || null,
            qualifications: qualifications || null,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        });

        await tx.auditLog.create({
          data: {
            userId: admin.userId,
            action: "CREATE_TEACHER",
            details: `Created teacher account for: ${name} (${email})`,
          },
        });

        return teacher;
      }

      if (role === "STUDENT") {
        const { parentId, classId } = body;
        
        // Generate Student ID
        const studentCount = await tx.student.count();
        const studentIdCode = `CN-2026-${String(studentCount + 1).padStart(4, "0")}`;

        const student = await tx.student.create({
          data: {
            userId: user.id,
            studentId: studentIdCode,
            parentId: parentId || null,
            classId: classId || null,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
            class: { select: { name: true } },
            parent: {
              include: { user: { select: { name: true } } },
            },
          },
        });

        await tx.auditLog.create({
          data: {
            userId: admin.userId,
            action: "CREATE_STUDENT",
            details: `Created student account for: ${name} (${email}), student ID: ${studentIdCode}`,
          },
        });

        return student;
      }

      if (role === "PARENT") {
        const parent = await tx.parent.create({
          data: {
            userId: user.id,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        });

        await tx.auditLog.create({
          data: {
            userId: admin.userId,
            action: "CREATE_PARENT",
            details: `Created parent account for: ${name} (${email})`,
          },
        });

        return parent;
      }

      throw new Error("Invalid role selected");
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: error.message || "An internal server error occurred" },
      { status: 500 }
    );
  }
}
