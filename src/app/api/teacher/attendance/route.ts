import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getTeacher() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== "TEACHER" && payload.role !== "SCHOOL_ADMIN")) return null;

  return payload;
}

// 1. Fetch attendance records for a class on a date
export async function GET(request: Request) {
  const teacher = await getTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const dateStr = searchParams.get("date"); // e.g. "2026-07-05"

  if (!classId || !dateStr) {
    return NextResponse.json({ error: "Class ID and date are required" }, { status: 400 });
  }

  try {
    const queryDate = new Date(dateStr);
    
    // Set hours to midnight to compare correctly
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findMany({
      where: {
        date: queryDate,
        student: { classId },
      },
      select: {
        id: true,
        studentId: true,
        status: true,
        remarks: true,
      },
    });

    return NextResponse.json({ success: true, attendance });
  } catch (error) {
    console.error("Fetch attendance error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}

// 2. Save bulk attendance records
export async function POST(request: Request) {
  const teacher = await getTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { date, records } = await request.json(); // records: Array of { studentId, status, remarks }

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Date and records array are required" }, { status: 400 });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    // Save attendance in a transaction using bulk upserts
    await prisma.$transaction(
      records.map((rec) =>
        prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: rec.studentId,
              date: queryDate,
            },
          },
          update: {
            status: rec.status,
            remarks: rec.remarks || null,
          },
          create: {
            studentId: rec.studentId,
            date: queryDate,
            status: rec.status,
            remarks: rec.remarks || null,
          },
        })
      )
    );

    await prisma.auditLog.create({
      data: {
        userId: teacher.userId,
        action: "RECORD_ATTENDANCE",
        details: `Recorded attendance for ${records.length} students on ${queryDate.toLocaleDateString()}`,
      },
    });

    return NextResponse.json({ success: true, message: "Attendance saved successfully" });
  } catch (error) {
    console.error("Save attendance error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
