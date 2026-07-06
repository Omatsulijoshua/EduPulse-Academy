import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Auth helper for admin endpoints
async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "SUPER_ADMIN") return null;

  return payload;
}

// 1. Create a school
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { name, slug, subscriptionId } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existing = await prisma.school.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "School slug is already in use" },
        { status: 400 }
      );
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        subscriptionId: subscriptionId || null,
      },
      include: {
        subscription: {
          select: {
            name: true,
            price: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "CREATE_SCHOOL",
        details: `Super Admin created school: ${name} (slug: ${slug})`,
      },
    });

    return NextResponse.json({ success: true, school });
  } catch (error) {
    console.error("Failed to create school:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}

// 2. Update school status (active/blocked)
export async function PUT(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { id, isActive } = await request.json();

    if (!id || !isActive) {
      return NextResponse.json(
        { error: "School ID and status are required" },
        { status: 400 }
      );
    }

    if (isActive !== "active" && isActive !== "blocked") {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Update school status
    const school = await prisma.school.update({
      where: { id },
      data: { isActive },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "UPDATE_SCHOOL_STATUS",
        details: `Super Admin set school status for ${school.name} to: ${isActive.toUpperCase()}`,
      },
    });

    return NextResponse.json({ success: true, school });
  } catch (error) {
    console.error("Failed to update school status:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
