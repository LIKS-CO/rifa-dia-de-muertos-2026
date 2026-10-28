"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Ticket as TicketIcon, X } from "lucide-react";
import { toast } from "sonner";

import { cancelMyPayment, createPurchase } from "@/lib/actions";
import { PAYMENT_METHODS, RAFFLE, formatMxn } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type DashboardTicket = {
  number: number;
  status: string;
  userId: string | null;
};

export type DashboardPayment = {
  id: number;
  method: string;
  amountMxn: number;
  status: string;
  createdAt: string;
  ticketNumbers: number[];
};

export function DashboardClient({
  userId,
  tickets,
  payments,
}: {
  userId: string;
  tickets: DashboardTicket[];
  payments: DashboardPayment[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [buying, setBuying] = useState(false);

  const byNumber = useMemo(() => {
    const map = new Map<number, DashboardTicket>();
    for (const t of tickets) map.set(t.number, t);
    return map;
  }, [tickets]);

  const available = tickets.filter((t) => t.status === "available").length;
  const paidByMe = tickets.filter((t) => t.status === "paid" && t.userId === userId).length;
  const progressing = payments.filter((p) => !["paid", "cancelled"].includes(p.status));
  const sold = RAFFLE.totalTickets - available;

  const myTicketNumbers = tickets
    .filter((t) => t.userId === userId && t.status === "paid")
    .map((t) => t.number);

  function toggle(n: number) {
    const t = byNumber.get(n);
    if (!t || t.status !== "available") return;
    setSelected((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b),
    );
  }

  async function buy() {
    if (selected.length === 0) {
      toast.error("Selecciona al menos un boleto.");
      return;
    }
    setBuying(true);
    const res = await createPurchase(selected);
    setBuying(false);
    if (res.ok) {
      toast.success(
        `Boletos ${res.tickets?.join(", ") ?? ""} apartados. Total: ${formatMxn(
          selected.length * RAFFLE.ticketPriceMxn,
        )}.`,
      );
      setSelected([]);
      router.refresh();
    } else {
      if (res.taken?.length) {
        toast.error(`Estos boletos ya se apartaron: ${res.taken.join(", ")}`);
      } else {
        toast.error(res.error ?? "No se pudo completar la compra.");
      }
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6">
      {/* ── Overview ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Boletos disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-semibold text-primary">{available}</p>
            <Progress className="mt-2" value={(sold / RAFFLE.totalTickets) * 100} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Mis boletos pagados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-semibold">{paidByMe}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {myTicketNumbers.length > 0 ? `Números: ${myTicketNumbers.join(", ")}` : "Aún no tienes boletos confirmados"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Órdenes en proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-semibold">{progressing.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Termina de pagarlas o cancelemos</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Ticket picker ── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 text-2xl">
            <TicketIcon className="size-5 text-primary" />
            Elige tus números
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Toca los boletos disponibles para apartarlos (máx. 20 por orden). Los que están apartados
            por otras personas aparecen atenuados.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {tickets.map((t) => {
              const mine = t.userId === userId;
              const isSelected = selected.includes(t.number);
              const cls =
                t.status === "available"
                  ? isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_14px_rgba(0,0,0,0.3)]"
                    : "border-primary/30 bg-popover text-foreground hover:border-primary hover:bg-primary/10 cursor-pointer"
                  : t.status === "paid"
                    ? mine
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                      : "border-emerald-500/25 bg-emerald-500/5 text-emerald-300/40"
                    : mine
                      ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
                      : "border-border bg-muted/50 text-muted-foreground/50";
              return (
                <button
                  key={t.number}
                  type="button"
                  onClick={() => toggle(t.number)}
                  disabled={t.status !== "available"}
                  className={`flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-all ${cls}`}
                  title={`Boleto ${t.number} · ${t.status === "available" ? "disponible" : t.status === "paid" ? (mine ? "tuyo · pagado" : "pagado por alguien más") : mine ? "tuyo · en proceso" : "apartado por alguien más"}`}
                >
                  {t.number}
                </button>
              );
            })}
          </div>

          {/* legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded border border-primary/30 bg-popover" /> Disponible
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded border border-primary bg-primary" /> Seleccionado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded border border-amber-400/60 bg-amber-400/15" /> Mi apartado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded border border-emerald-500/60 bg-emerald-500/15" /> Mi pagado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded border border-border bg-muted/50" /> De otros
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Buy panel ── */}
      {selected.length > 0 && (
        <Card className="glow-ember border-primary/30">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-medium">
                {selected.length} boleto{selected.length > 1 ? "s" : ""}:{" "}
                <span className="text-primary">{selected.join(", ")}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Total a pagar:{" "}
                <strong className="text-foreground">{formatMxn(selected.length * RAFFLE.ticketPriceMxn)}</strong>
              </p>
            </div>
            <div className="grid gap-3 sm:w-72">
              <p className="text-xs text-muted-foreground">
                Pago en efectivo a los organizadores · un administrador lo confirma.
              </p>
              <Button onClick={buy} disabled={buying} size="lg" className="w-full">
                {buying ? <Loader2 className="animate-spin" /> : <Check />}
                Apartar y pagar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── In-progress orders (with payment instructions) ── */}
      {progressing.length > 0 && (
        <div className="grid gap-4">
          <h2 className="font-display text-2xl font-semibold">Tus órdenes en proceso</h2>
          {progressing.map((p) => (
            <OrderCard key={p.id} payment={p} />
          ))}
        </div>
      )}

      {/* ── History ── */}
      {payments.length > 0 && (
        <div className="grid gap-2">
          <h2 className="font-display text-2xl font-semibold">Historial de pagos</h2>
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/15 p-4 text-sm"
            >
              <div>
                <p className="font-medium">
                  Orden #{p.id} · {p.ticketNumbers.join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ?? p.method} ·{" "}
                  {formatMxn(p.amountMxn)}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────── Order / payment card ───────────────────── */

function OrderCard({ payment }: { payment: DashboardPayment }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const total = payment.ticketNumbers.length * RAFFLE.ticketPriceMxn;

  async function cancel() {
    setCancelling(true);
    const res = await cancelMyPayment(payment.id);
    setCancelling(false);
    if (res.ok) {
      toast.success("Orden cancelada; tus boletos volvieron a estar disponibles.");
      router.refresh();
    } else {
      toast.error(res.error ?? "No se pudo cancelar");
    }
  }

  return (
    <Card className="border-primary/25">
      <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              Orden #{payment.id} —{" "}
              {PAYMENT_METHODS[payment.method as keyof typeof PAYMENT_METHODS] ?? payment.method}
            </p>
            <StatusBadge status={payment.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Boletos: <span className="text-foreground">{payment.ticketNumbers.join(", ")}</span> ·{" "}
            {formatMxn(total)}
          </p>

          {payment.status === "pending" && (
            <PaymentHint
              title="Pago en efectivo"
              body="Entrega el efectivo a cualquiera de los organizadores de Takumi Robotics o LIKS Theater Company. Un administrador marcará tus boletos como pagados."
            />
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!["paid", "cancelled"].includes(payment.status) && (
              <Button variant="ghost" size="sm" onClick={cancel} disabled={cancelling} className="text-destructive">
                <X /> Cancelar orden
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentHint({
  title,
  body,
  children,
}: {
  title: string;
  body?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-amber-400/15 text-amber-200 border-amber-400/30" },
    paid: { label: "Pagado ✓", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
    cancelled: { label: "Cancelado", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge variant="outline" className={`border ${s.cls}`}>
      {s.label}
    </Badge>
  );
}