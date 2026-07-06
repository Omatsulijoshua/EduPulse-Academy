import { prisma } from "@/lib/db";
import SchoolAdminDashboard from "@/components/SchoolAdminDashboard";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // Live data reload

export default async function SchoolAdminPage() {
  // Verify auth and role
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "SCHOOL_ADMIN" || !payload.schoolId) {
    redirect("/login");
  }

  const schoolId = payload.schoolId;

  // 1. Fetch teachers
  const teachers = await prisma.teacher.findMany({
    where: { user: { schoolId } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // 2. Fetch students
  const students = await prisma.student.findMany({
    where: { user: { schoolId } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      class: {
        select: {
          name: true,
        },
      },
      parent: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // 3. Fetch parents
  const parents = await prisma.parent.findMany({
    where: { user: { schoolId } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // 4. Fetch classes
  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: {
      formTeacher: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          students: true,
          subjects: true,
        },
      },
    },
  });

  // 5. Fetch subjects
  const subjects = await prisma.subject.findMany({
    where: { class: { schoolId } },
    include: {
      class: {
        select: {
          name: true,
        },
      },
      teacher: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // 6. Fetch sessions & terms
  const sessions = await prisma.session.findMany({
    where: { schoolId },
  });

  const terms = await prisma.term.findMany({
    where: { session: { schoolId } },
    include: {
      session: {
        select: {
          name: true,
        },
      },
    },
  });

  // 7. Fetch fees
  const fees = await prisma.fee.findMany({
    where: { schoolId },
    include: {
      _count: {
        select: {
          payments: true,
        },
      },
    },
  });

  // 8. Fetch active school metadata
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    redirect("/login");
  }

  const schoolProfile = {
    id: school.id,
    name: school.name,
    slug: school.slug,
    logo: school.logo,
    themeColor: school.themeColor,
    tagline: school.tagline,
    about: school.about,
  };

  return (
    <SchoolAdminDashboard
      teachers={teachers as any}
      students={students as any}
      parents={parents as any}
      classes={classes as any}
      subjects={subjects as any}
      sessions={sessions as any}
      terms={terms as any}
      fees={fees as any}
      school={schoolProfile}
    />
  );
}
