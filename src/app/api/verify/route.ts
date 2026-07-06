import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public verification search
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim();

  if (!code) {
    return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
  }

  try {
    // 1. Search Certificate
    const certificate = await prisma.certificate.findUnique({
      where: { certificateCode: code },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { school: { select: { name: true } } } },
          },
        },
        course: { select: { title: true } },
      },
    });

    if (certificate) {
      return NextResponse.json({
        success: true,
        type: "certificate",
        data: {
          studentName: certificate.student.user.name,
          courseTitle: certificate.course.title,
          schoolName: certificate.student.class?.school.name || "ClassNova Academy",
          issuedAt: certificate.issuedAt,
          code: certificate.certificateCode,
        },
      });
    }

    // 2. Search Report Card (by ID as verification reference)
    const reportCard = await prisma.reportCard.findUnique({
      where: { id: code },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { name: true, school: { select: { name: true } } } },
          },
        },
      },
    });

    if (reportCard) {
      return NextResponse.json({
        success: true,
        type: "report_card",
        data: {
          studentName: reportCard.student.user.name,
          className: reportCard.student.class?.name || "Unassigned",
          schoolName: reportCard.student.class?.school.name || "ClassNova Academy",
          termName: reportCard.termName,
          sessionName: reportCard.sessionName,
          gpa: reportCard.gpa,
          remarks: reportCard.remarks,
          createdAt: reportCard.createdAt,
          code: reportCard.id,
        },
      });
    }

    return NextResponse.json(
      { error: "No valid credential found matching this verification code." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Public verification search error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
