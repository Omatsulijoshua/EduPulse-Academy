import { prisma } from "@/lib/db";
import SuperAdminDashboard from "@/components/SuperAdminDashboard";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // Disable caching to fetch live data

export default async function SuperAdminPage() {
  // Ensure the logged in user is actually a SUPER_ADMIN
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  // 1. Fetch schools data
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
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

  // 2. Fetch subscription plan types
  const subscriptions = await prisma.subscription.findMany({
    include: {
      _count: {
        select: {
          schools: true,
        },
      },
    },
  });

  // 3. Fetch audit logs (limited to 50 for performance)
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // 4. Calculate stats
  const totalSchools = schools.length;
  const totalUsers = await prisma.user.count();
  const activeSubs = schools.filter(s => s.isActive === "active" && s.subscriptionId !== null).length;
  
  // Sum prices of subscriptions for active schools
  const totalRevenue = schools.reduce((acc, school) => {
    if (school.isActive === "active" && school.subscription) {
      return acc + school.subscription.price;
    }
    return acc;
  }, 0);

  return (
    <SuperAdminDashboard
      initialSchools={schools as any}
      initialSubscriptions={subscriptions as any}
      initialAuditLogs={auditLogs as any}
      stats={{
        totalSchools,
        totalUsers,
        totalRevenue,
        activeSubs,
      }}
    />
  );
}
