import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import CheckoutForm from "./CheckoutForm";
import Logo from "@/components/Logo";

interface CheckoutPageProps {
  searchParams: Promise<{
    feeId?: string;
    studentId?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  // 1. Verify parent session
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "PARENT") {
    redirect("/login");
  }

  const { feeId, studentId } = await searchParams;

  if (!feeId || !studentId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-red-400">Invalid Payment Session</h2>
          <p className="text-xs text-slate-400">Missing checkout parameters.</p>
        </div>
      </div>
    );
  }

  // 2. Fetch parent profile
  const parent = await prisma.parent.findUnique({
    where: { userId: payload.userId },
  });

  if (!parent) redirect("/login");

  // 3. Fetch Fee and Student details
  const fee = await prisma.fee.findUnique({
    where: { id: feeId },
  });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true } },
    },
  });

  if (!fee || !student || student.parentId !== parent.id) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-red-400">Unauthorized Checkout</h2>
          <p className="text-xs text-slate-400">The billing statement or student matches do not exist or are unauthorized.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6">
      
      {/* Brand Header */}
      <header className="max-w-6xl mx-auto w-full flex justify-between items-center py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Logo size="md" showText={true} />
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          Secure Stripe Sandboxed Checkout
        </span>
      </header>

      {/* Main Form Split */}
      <main className="flex-1 max-w-5xl w-full mx-auto grid md:grid-cols-12 gap-8 items-center py-12">
        <CheckoutForm
          feeId={fee.id}
          studentId={student.id}
          feeTitle={fee.title}
          feeAmount={fee.amount}
          studentName={student.user.name}
        />
      </main>

      <footer className="max-w-6xl mx-auto w-full text-center py-4 border-t border-slate-800 text-[10px] text-slate-500 font-medium">
        &copy; {new Date().getFullYear()} ClassNova Inc. Powered by Stripe checkout APIs.
      </footer>

    </div>
  );
}
