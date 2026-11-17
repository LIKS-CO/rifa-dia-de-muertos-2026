import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { asc, desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, settings, tickets, user as userTable } from "@/lib/db/schema";
import { RAFFLE } from "@/lib/config";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string | null;
  image?: string | null;
};

/** Read the current session (null-safe). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    role: u.role ?? null,
    image: u.image ?? null,
  };
});

/** Like getSessionUser but redirects to /login when signed out. */
export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  return u;
}

/** Redirects to /admin/login when the caller is not an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  if (u.role !== "admin") redirect("/admin/login");
  return u;
}

/** Raffle settings row (single "general" row). */
export const getSettings = cache(async () => {
  const rows = await db.select().from(settings).where(eq(settings.key, "general")).limit(1);
  return rows[0] ?? null;
});

export async function getAllTickets() {
  return db.select().from(tickets).orderBy(asc(tickets.number));
}

export async function getPaymentsWithUsers() {
  return db
    .select({
      payment: payments,
      userName: userTable.name,
      userEmail: userTable.email,
    })
    .from(payments)
    .leftJoin(userTable, eq(payments.userId, userTable.id))
    .orderBy(desc(payments.createdAt));
}

export async function getMyPayments(userId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function getMyTickets(userId: string) {
  return db
    .select()
    .from(tickets)
    .where(eq(tickets.userId, userId))
    .orderBy(asc(tickets.number));
}

/** Summary numbers used by the dashboard hero. */
export function summarizeTickets(allTickets: { status: string; userId: string | null }[]) {
  const available = allTickets.filter((t) => t.status === "available").length;
  const paid = allTickets.filter((t) => t.status === "paid").length;
  const reserved = allTickets.filter((t) => t.status === "reserved").length;
  return {
    available,
    paid,
    reserved,
    total: RAFFLE.totalTickets,
    taken: paid + reserved,
  };
}

/** Per-payment total owed to the raffle (non-cancelled purchases) and paid confirmed. */
export function userLedger(
  myPayments: { amountMxn: number; status: string }[],
): { owedMxn: number; paidMxn: number } {
  let owedMxn = 0;
  let paidMxn = 0;
  for (const p of myPayments) {
    if (p.status === "cancelled") continue;
    owedMxn += p.amountMxn;
    if (p.status === "paid") paidMxn += p.amountMxn;
  }
  return { owedMxn, paidMxn };
}

export type {
  PaymentRow,
  SettingsRow,
  TicketRow,
} from "@/lib/db/schema";