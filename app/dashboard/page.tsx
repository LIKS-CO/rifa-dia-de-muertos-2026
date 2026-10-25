import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Skull } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardClient, type DashboardTicket } from "@/components/dashboard/dashboard-client";
import { Button } from "@/components/ui/button";
import { RAFFLE } from "@/lib/config";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { getAllTickets, getMyPayments, requireUser } from "@/lib/queries";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Mi tablero" };

export default async function DashboardPage() {
  const user = await requireUser();

  const [allTickets, myPayments, settingsRow] = await Promise.all([
    getAllTickets(),
    getMyPayments(user.id),
    db.select().from(settings).where(eq(settings.key, "general")).limit(1),
  ]);

  // group ticket numbers per payment
  const ticketsByPayment = new Map<number, number[]>();
  for (const t of allTickets) {
    if (t.paymentId != null) {
      const arr = ticketsByPayment.get(t.paymentId) ?? [];
      arr.push(t.number);
      ticketsByPayment.set(t.paymentId, arr);
    }
  }
  for (const arr of ticketsByPayment.values()) arr.sort((a, b) => a - b);

  const myPaymentRows = myPayments.map((p) => ({
    id: p.id,
    method: p.method,
    amountMxn: p.amountMxn,
    status: p.status,
    verified: p.verified,
    proofData: p.proofData,
    createdAt: p.createdAt.toISOString(),
    ticketNumbers: ticketsByPayment.get(p.id) ?? [],
  }));

  const ticketRows: DashboardTicket[] = allTickets.map((t) => ({
    number: t.number,
    status: t.status,
    userId: t.userId,
  }));

  const settingsForClient = settingsRow[0]
    ? {
        cardQr: settingsRow[0].cardQr,
        bankName: settingsRow[0].bankName,
        bankAccountHolder: settingsRow[0].bankAccountHolder,
        bankAccountNumber: settingsRow[0].bankAccountNumber,
        bankClabe: settingsRow[0].bankClabe,
      }
    : null;

  return (
    <main className="relative min-h-dvh bg-background">
      {/* ── Header ── */}
      <header className="relative z-10 mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 pt-10 pb-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Skull className="size-6 text-primary" />
            <span className="font-display text-xl font-semibold">
              Rifa <span className="text-primary">Día de Muertos</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <Button render={<Link href="/admin" />} nativeButton={false} variant="outline" size="sm">
              <ShieldCheck /> Panel admin
            </Button>
          )}
          <LogoutButton />
        </div>
      </header>

      {/* ── Main ── */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">¡Qué onda, {user.name.split(" ")[0]}!</p>
          <h1 className="font-display text-4xl font-semibold">
            Tu suerte, <span className="text-primary">aquí</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {RAFFLE.totalTickets} boletos de {RAFFLE.ticketPriceMxn.toLocaleString("es-MX")} MXN ·
            premio: {RAFFLE.prize}
          </p>
        </div>

        <DashboardClient
          userId={user.id}
          tickets={ticketRows}
          payments={myPaymentRows}
          settings={settingsForClient}
        />
      </div>
    </main>
  );
}