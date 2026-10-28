"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  Ticket as TicketIcon,
  Users as UsersIcon,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/dashboard/dashboard-client";
import { adminCancelPayment, adminConfirmPayment } from "@/lib/actions";
import { PAYMENT_METHODS, formatDate, formatMxn } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AdminPayment = {
  id: number;
  userId: string;
  method: string;
  amountMxn: number;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
  userName: string | null;
  userEmail: string | null;
  ticketNumbers: number[];
};

export type AdminTicket = {
  number: number;
  status: string;
  userId: string | null;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  ticketCount: number;
  owedMxn: number;
  paidMxn: number;
};

export type AdminOwner = {
  id: string;
  name: string;
  email: string;
};

export function AdminClient({
  payments,
  tickets,
  users,
  owners,
}: {
  payments: AdminPayment[];
  tickets: AdminTicket[];
  users: AdminUser[];
  owners: AdminOwner[];
}) {
  return (
    <Tabs defaultValue="resumen" className="w-full">
      <TabsList className="mb-4 flex-wrap h-auto">
        <TabsTrigger value="resumen" className="gap-1.5">
          <LayoutDashboard /> Resumen
        </TabsTrigger>
        <TabsTrigger value="pagos" className="gap-1.5">
          <ClipboardList /> Pagos
          {payments.some((p) => p.status === "pending") && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {payments.filter((p) => p.status === "pending").length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="boletos" className="gap-1.5">
          <TicketIcon /> Boletos
        </TabsTrigger>
        <TabsTrigger value="usuarios" className="gap-1.5">
          <UsersIcon /> Usuarios
        </TabsTrigger>
      </TabsList>

      <TabsContent value="resumen">
        <Summary payments={payments} tickets={tickets} />
      </TabsContent>
      <TabsContent value="pagos">
        <PaymentsTab payments={payments} />
      </TabsContent>
      <TabsContent value="boletos">
        <BoletosTab tickets={tickets} owners={owners} />
      </TabsContent>
      <TabsContent value="usuarios">
        <UsersTab users={users} />
      </TabsContent>
    </Tabs>
  );
}

/* ───────────────────────── Resumen ───────────────────────── */

function Summary({ payments, tickets }: { payments: AdminPayment[]; tickets: AdminTicket[] }) {
  const collected = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountMxn, 0);
  const expected = payments.filter((p) => p.status !== "cancelled").reduce((s, p) => s + p.amountMxn, 0);
  const pending = expected - collected;
  const sold = tickets.filter((t) => t.status === "paid").length;
  const reserved = tickets.filter((t) => t.status === "reserved").length;
  const available = tickets.filter((t) => t.status === "available").length;

  const byMethod = new Map<string, { count: number; amount: number }>();
  for (const p of payments) {
    if (p.status === "cancelled") continue;
    const entry = byMethod.get(p.method) ?? { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += p.amountMxn;
    byMethod.set(p.method, entry);
  }

  const total = sold + reserved + available;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Recaudado (confirmado)" value={formatMxn(collected)} accent="text-emerald-400" />
        <StatCard label="Por cobrar / en proceso" value={formatMxn(pending)} accent="text-amber-300" />
        <StatCard label="Total esperado" value={formatMxn(expected)} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Boletos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Pagados" value={sold} />
            <MiniStat label="Apartados" value={reserved} />
            <MiniStat label="Disponibles" value={available} />
          </div>
          <Progress className="mt-4" value={((sold + reserved) / total) * 100} />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {Math.round(((sold + reserved) / total) * 100)}% apartado/pagado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Desglose por método</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {Array.from(byMethod.entries()).map(([m, e]) => (
            <div key={m} className="flex items-center justify-between rounded-lg border border-primary/15 px-3 py-2">
              <span className="text-sm">{PAYMENT_METHODS[m as keyof typeof PAYMENT_METHODS] ?? m}</span>
              <span className="text-sm font-medium">
                {e.count} · {formatMxn(e.amount)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`font-display text-3xl font-semibold ${accent ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ───────────────────────── Pagos ───────────────────────── */

function PaymentsTab({ payments }: { payments: AdminPayment[] }) {
  return (
    <div className="grid gap-3">
      {payments.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay pagos registrados.</p>
      )}
      {payments.map((p) => (
        <PaymentAdminRow key={p.id} payment={p} />
      ))}
    </div>
  );
}

function PaymentAdminRow({ payment }: { payment: AdminPayment }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);

  async function run(action: "confirm" | "cancel") {
    setBusy(action);
    const res = action === "confirm" ? await adminConfirmPayment(payment.id) : await adminCancelPayment(payment.id);
    setBusy(null);
    if (res.ok) {
      toast.success(
        action === "confirm"
          ? "¡Pago confirmado y boletos marcados como pagados!"
          : "Pago cancelado y boletos liberados.",
      );
      router.refresh();
    } else {
      toast.error(res.error ?? "Ocurrió un error.");
      router.refresh();
    }
  }

  const canConfirm = payment.status !== "paid" && payment.status !== "cancelled";
  const canCancel = payment.status !== "paid" && payment.status !== "cancelled";

  return (
    <Card className="border-primary/15">
      <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              Orden #{payment.id} — {payment.userName ?? "Usuario"}
            </p>
            <StatusBadge status={payment.status} />
            <Badge variant="outline" className="text-xs">
              {PAYMENT_METHODS[payment.method as keyof typeof PAYMENT_METHODS] ?? payment.method}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {payment.userEmail} · {formatMxn(payment.amountMxn)} · Boletos:{" "}
            <span className="text-foreground">{payment.ticketNumbers.join(", ") || "—"}</span>
          </p>
          <p className="text-xs text-muted-foreground">Creado: {formatDate(payment.createdAt)}</p>

          {payment.confirmedAt &&
            (payment.status === "paid" ? (
              <p className="mt-1 text-xs text-emerald-400">Confirmado: {formatDate(payment.confirmedAt)}</p>
            ) : null)}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {canConfirm && (
            <Button
              size="sm"
              onClick={() => run("confirm")}
              disabled={busy !== null}
              title="Marcar como pagado y confirmar boletos"
            >
              {busy === "confirm" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Marcar como pagado
            </Button>
          )}
          {canCancel && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => run("cancel")} disabled={busy !== null}>
              {busy === "cancel" ? <Loader2 className="animate-spin" /> : <XCircle />}
              Cancelar y liberar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── Boletos ───────────────────────── */

function BoletosTab({
  tickets,
  owners,
}: {
  tickets: AdminTicket[];
  owners: AdminOwner[];
}) {
  const ownersById = useMemo(
    () => new Map(owners.map((o) => [o.id, o])),
    [owners],
  );
  const ownerLabel = (userId: string | null) => {
    if (!userId) return { name: "Disponible", email: "" };
    const o = ownersById.get(userId);
    return { name: o?.name ?? "Usuario", email: o?.email ?? "—" };
  };
  const [filter, setFilter] = useState<"all" | "paid" | "reserved" | "available">("all");
  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Todos" />
          <FilterChip active={filter === "paid"} onClick={() => setFilter("paid")} label="Pagados" />
          <FilterChip active={filter === "reserved"} onClick={() => setFilter("reserved")} label="Apartados" />
          <FilterChip active={filter === "available"} onClick={() => setFilter("available")} label="Disponibles" />
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {filtered.map((t) => {
            const owner = ownerLabel(t.userId);
            return (
              <div
                key={t.number}
                className={`relative flex h-11 items-center justify-center rounded-lg border text-sm font-medium ${
                  t.status === "paid"
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                    : t.status === "reserved"
                      ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                      : "border-border bg-muted/40 text-muted-foreground"
                }`}
                title={
                  t.status === "available"
                    ? `#${t.number} · disponible`
                    : `#${t.number} · ${t.status} · ${owner.name} (${owner.email})`
                }
              >
                {t.number}
              </div>
            );
          })}
        </div>
        {tickets.some((t) => t.status !== "available") && (
          <Separator className="my-4" />
        )}
        <div className="grid gap-1 text-xs text-muted-foreground">
          {tickets
            .filter((t) => t.status !== "available")
            .map((t) => {
              const owner = ownerLabel(t.userId);
              return (
                <p key={t.number}>
                  #{t.number} · <span className={t.status === "paid" ? "text-emerald-400" : "text-amber-300"}>{t.status}</span> ·{" "}
                  {owner.name} · {owner.email}
                </p>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}

/* ───────────────────────── Usuarios ───────────────────────── */

function UsersTab({ users }: { users: AdminUser[] }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-4">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
              <th className="pb-2 pr-4">Usuario</th>
              <th className="pb-2 pr-4">Boletos</th>
              <th className="pb-2 pr-4">Adeuda</th>
              <th className="pb-2">Ha pagado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-primary/10">
                <td className="py-2.5 pr-4">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="py-2.5 pr-4">{u.ticketCount}</td>
                <td className="py-2.5 pr-4 text-amber-300">{formatMxn(u.owedMxn)}</td>
                <td className="py-2.5 text-emerald-400">{formatMxn(u.paidMxn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}