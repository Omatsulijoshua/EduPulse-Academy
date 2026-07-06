import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getParent() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "PARENT") return null;

  const parent = await prisma.parent.findUnique({
    where: { userId: payload.userId },
  });

  return parent;
}

// Parent pays tuition fee (Mock Checkout Payment)
export async function POST(request: Request) {
  const parent = await getParent();
  if (!parent) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { feeId, studentId } = await request.json();

    if (!feeId || !studentId) {
      return NextResponse.json({ error: "Fee ID and student ID are required" }, { status: 400 });
    }

    // Verify parent ownership of student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { name: true } } },
    });

    if (!student || student.parentId !== parent.id) {
      return NextResponse.json({ error: "Unauthorized student billing access" }, { status: 403 });
    }

    // Fetch the Fee template
    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee statement not found" }, { status: 404 });
    }

    // Upsert Payment record to PAID status
    const reference = `ref_pay_${studentId.slice(0, 4)}_${feeId.slice(0, 4)}_${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Find if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { feeId, studentId },
    });

    let payment;
    if (existingPayment) {
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: "PAID",
          amountPaid: fee.amount,
          paidAt: new Date(),
          reference,
        },
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          feeId,
          studentId,
          status: "PAID",
          amountPaid: fee.amount,
          reference,
          paidAt: new Date(),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: parent.userId,
        action: "PAY_FEES",
        details: `Parent paid fee: ${fee.title} (Amount: $${fee.amount}) for student ${student.user.name}`,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Pay tuition fees error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
