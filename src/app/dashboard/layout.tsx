import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);
  if (!payload) {
    redirect("/login");
  }

  // Retrieve fresh user info from the database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      school: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const userProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    schoolName: user?.school?.name || undefined,
    schoolSlug: user?.school?.slug || undefined,
  };

  return (
    <DashboardShell user={userProfile}>
      {children}
    </DashboardShell>
  );
}
