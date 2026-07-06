import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    const { title, amount, dueDate } = await request.json();

    if (!title || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Title, amount, and due date are required" },
        { status: 400 }
      );
    }

    const fee = await prisma.fee.create({
      data: {
        title,
        amount,
        dueDate: new Date(dueDate),
        schoolId,
      },
      include: {
        _count: { select: { payments: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "CREATE_FEE",
        details: `Issued tuition invoice: ${title} ($${amount})`,
      },
    });

    return NextResponse.json({ success: true, fee });
  } catch (error) {
    console.error("Failed to create fee:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
