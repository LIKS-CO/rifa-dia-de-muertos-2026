"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { ADMIN_CREDENTIALS, RAFFLE } from "@/lib/config";
import { db } from "@/lib/db";
import { payments, tickets } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/queries";

const MAX_PER_PURCHASE = 20;

function now() {
  return new Date();
}

/* ─────────────────────────────────────────────────────────────
 * User-facing actions
 * ───────────────────────────────────────────────────────────── */

/**
 * Reserve the selected ticket numbers and create a pending payment.
 * The optimistic UPDATE ... WHERE status = 'available' guard makes the
 * race between two buyers safe without a DB transaction.
 */
export async function createPurchase(numbers: number[]) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "Inicia sesión para comprar boletos." };

  const clean = Array.from(new Set(numbers)).map(Number).filter(Number.isInteger);
  const valid = clean.filter((n) => n >= 1 && n <= RAFFLE.totalTickets);
  if (clean.length !== numbers.length || valid.length !== numbers.length) {
    return { ok: false as const, error: `Elige boletos entre 1 y ${RAFFLE.totalTickets}.` };
  }
  if (valid.length < 1) return { ok: false as const, error: "Selecciona al menos un boleto." };
  if (valid.length > MAX_PER_PURCHASE) {
    return { ok: false as const, error: `Máximo ${MAX_PER_PURCHASE} boletos por compra.` };
  }

  // 1) Optimistically reserve only still-available tickets.
  const reserved = await db
    .update(tickets)
    .set({ userId: user.id, status: "reserved" })
    .where(and(inArray(tickets.number, valid), eq(tickets.status, "available")))
    .returning({ number: tickets.number });

  if (reserved.length !== valid.length) {
    // Some numbers were taken by someone else — release ours and report.
    await db
      .update(tickets)
      .set({ userId: null, status: "available" })
      .where(
        and(
          inArray(tickets.number, valid),
          eq(tickets.userId, user.id),
          eq(tickets.status, "reserved"),
        ),
      );
    const ours = new Set(reserved.map((r) => r.number));
    const taken = valid.filter((n) => !ours.has(n));
    return {
      ok: false as const,
      error: "Algunos boletos ya fueron apartados por otra persona.",
      taken,
    };
  }

  // 2) Create the payment and link it to the tickets.
  let paymentId: number | null = null;
  try {
    const [payment] = await db
      .insert(payments)
      .values({
        userId: user.id,
        method: "cash",
        amountMxn: valid.length * RAFFLE.ticketPriceMxn,
        status: "pending",
      })
      .returning({ id: payments.id });
    paymentId = payment.id;
    await db.update(tickets).set({ paymentId }).where(inArray(tickets.number, valid));
  } catch (err) {
    console.error("createPurchase failed:", err);
    await db
      .update(tickets)
      .set({ userId: null, paymentId: null, status: "available" })
      .where(inArray(tickets.number, valid));
    return { ok: false as const, error: "No se pudo registrar la compra, intenta de nuevo." };
  }

  revalidatePath("/dashboard");
  return { ok: true as const, paymentId, tickets: valid };
}

/** Allow a user to cancel one of their own non-paid purchases (releases tickets). */
export async function cancelMyPayment(paymentId: number) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "Inicia sesión." };

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.userId, user.id)))
    .limit(1);
  if (!payment) return { ok: false as const, error: "No se encontró el pago." };
  if (payment.status === "paid" || payment.status === "cancelled") {
    return { ok: false as const, error: "Este pago ya no se puede cancelar." };
  }

  await db.update(payments).set({ status: "cancelled", updatedAt: now() }).where(eq(payments.id, paymentId));
  await db
    .update(tickets)
    .set({ userId: null, paymentId: null, status: "available" })
    .where(eq(tickets.paymentId, paymentId));

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { ok: true as const };
}

/* ─────────────────────────────────────────────────────────────
 * Admin-facing actions (authorization re-checked on the server)
 * ───────────────────────────────────────────────────────────── */

async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

/** Mark the payment as received and the tickets as paid. */
export async function adminConfirmPayment(paymentId: number) {
  const admin = await requireAdminUser();
  if (!admin) return { ok: false as const, error: "No autorizado." };

  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!payment) return { ok: false as const, error: "No se encontró el pago." };
  if (payment.status === "paid") return { ok: false as const, error: "Ya está pagado." };
  if (payment.status === "cancelled") return { ok: false as const, error: "El pago fue cancelado." };

  await db
    .update(payments)
    .set({
      status: "paid",
      confirmedAt: now(),
      confirmedBy: admin.id,
      updatedAt: now(),
    })
    .where(eq(payments.id, paymentId));
  await db
    .update(tickets)
    .set({ status: "paid", paidAt: now() })
    .where(eq(tickets.paymentId, paymentId));

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

/** Cancel a payment and release its tickets (e.g. never paid). */
export async function adminCancelPayment(paymentId: number) {
  const admin = await requireAdminUser();
  if (!admin) return { ok: false as const, error: "No autorizado." };

  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!payment) return { ok: false as const, error: "No se encontró el pago." };
  if (payment.status === "paid") return { ok: false as const, error: "No puedes cancelar un pago confirmado." };
  if (payment.status === "cancelled") return { ok: false as const, error: "Ya está cancelado." };

  await db.update(payments).set({ status: "cancelled", updatedAt: now() }).where(eq(payments.id, paymentId));
  await db
    .update(tickets)
    .set({ userId: null, paymentId: null, status: "available" })
    .where(eq(tickets.paymentId, paymentId));

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

/* ─────────────────────────────────────────────────────────────
 * Admin login
 * ───────────────────────────────────────────────────────────── */

/**
 * Signs in the admin. The username/password are the ones defined in
 * ADMIN_USERNAME / ADMIN_PASSWORD (defaults: admin / 4dmiN123*). The
 * actual credential check happens against the seeded admin account by
 * Better Auth; the user and password stored in the DB stay in sync with
 * the env vars via `bun run db:setup`.
 */
export async function adminLogin(
  state: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const expectedUsername = process.env.ADMIN_USERNAME ?? "admin";

  if (username !== expectedUsername) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const email = process.env.ADMIN_EMAIL ?? ADMIN_CREDENTIALS.email;
  try {
    const res = await auth.api.signInEmail({ body: { email, password } });
    if (!res.token) return { error: "Usuario o contraseña incorrectos." };
  } catch {
    return { error: "Usuario o contraseña incorrectos." };
  }

  redirect("/admin");
}

export type PurchaseResult = Awaited<ReturnType<typeof createPurchase>>;
export type SimpleResult = { ok: boolean; error?: string };