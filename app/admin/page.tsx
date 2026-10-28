import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { AdminClient, type AdminOwner, type AdminPayment, type AdminTicket, type AdminUser } from "@/components/admin/admin-client";
import { LogoutButton } from "@/components/auth/logout-button";
import { RAFFLE } from "@/lib/config";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { getAllTickets, getPaymentsWithUsers, requireAdmin } from "@/lib/queries";

export const metadata: Metadata = { title: "Panel de administración" };

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [ticketsAll, paymentsWithUsers, allUsers] = await Promise.all([
    getAllTickets(),
    getPaymentsWithUsers(),
    db.select({ id: userTable.id, name: userTable.name, email: userTable.email, role: userTable.role }).from(userTable),
  ]);

  const usersById = new Map(allUsers.map((u) => [u.id, u]));

  // ticket numbers per payment
  const ticketsByPayment = new Map<number, number[]>();
  for (const t of ticketsAll) {
    if (t.paymentId != null) {
      const arr = ticketsByPayment.get(t.paymentId) ?? [];
      arr.push(t.number);
      ticketsByPayment.set(t.paymentId, arr);
    }
  }
  for (const arr of ticketsByPayment.values()) arr.sort((a, b) => a - b);

  const adminPayments: AdminPayment[] = paymentsWithUsers.map(({ payment, userName, userEmail }) => ({
    id: payment.id,
    userId: payment.userId,
    method: payment.method,
    amountMxn: payment.amountMxn,
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
    confirmedAt: payment.confirmedAt?.toISOString() ?? null,
    userName,
    userEmail,
    ticketNumbers: ticketsByPayment.get(payment.id) ?? [],
  }));

  const adminTickets: AdminTicket[] = ticketsAll.map((t) => ({
    number: t.number,
    status: t.status,
    userId: t.userId,
  }));

  // Ledger per user (non-admins with activity)
  const ledger = new Map<
    string,
    { name: string; email: string; ticketCount: number; owedMxn: number; paidMxn: number }
  >();

  function bump(userId: string | null) {
    if (!userId) return;
    if (!ledger.has(userId)) {
      const u = usersById.get(userId);
      ledger.set(userId, {
        name: u?.name ?? "Usuario",
        email: u?.email ?? "—",
        ticketCount: 0,
        owedMxn: 0,
        paidMxn: 0,
      });
    }
  }

  for (const t of ticketsAll) {
    if (t.userId && t.status !== "available") {
      bump(t.userId);
      const entry = ledger.get(t.userId)!;
      entry.ticketCount += 1;
    }
  }
  for (const p of paymentsWithUsers.map((r) => r.payment)) {
    if (p.status === "cancelled") continue;
    bump(p.userId);
    const entry = ledger.get(p.userId)!;
    entry.owedMxn += p.amountMxn;
    if (p.status === "paid") entry.paidMxn += p.amountMxn;
  }

  const adminUsers: AdminUser[] = Array.from(ledger.entries())
    .filter(([id]) => usersById.get(id)?.role !== "admin")
    .map(([id, e]) => ({ id, role: usersById.get(id)?.role ?? null, ...e }))
    .sort((a, b) => b.paidMxn + b.owedMxn - (a.paidMxn + a.owedMxn));

  return (
    <main className="relative min-h-dvh bg-background">
      <header className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-10 pb-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft className="size-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            <div>
              <p className="font-display text-xl font-semibold leading-none">Panel de administración</p>
              <p className="text-xs text-muted-foreground">
                {RAFFLE.name} · {admin.name}
              </p>
            </div>
          </div>
        </div>
        <LogoutButton />
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6">
        <AdminClient
          payments={adminPayments}
          tickets={adminTickets}
          users={adminUsers}
          owners={allUsers.map(
            (u): AdminOwner => ({ id: u.id, name: u.name, email: u.email }),
          )}
        />
      </div>
    </main>
  );
}