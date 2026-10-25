"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  Settings as SettingsIcon,
  Ticket as TicketIcon,
  Users as UsersIcon,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/dashboard/dashboard-client";
import { adminCancelPayment, adminConfirmPayment, adminFirstCheck, adminUpdateSettings } from "@/lib/actions";
import { fileToCompressedJpeg } from "@/lib/client-image";
import { PAYMENT_METHODS, formatDate, formatMxn } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AdminPayment = {
  id: number;
  userId: string;
  method: string;
  amountMxn: number;
  status: string;
  verified: boolean;
  proofData: string | null;
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

export type AdminSettings = {
  cardQr: string;
  bankName: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankClabe: string;
};

export function AdminClient({
  payments,
  tickets,
  users,
  settings,
  owners,
}: {
  payments: AdminPayment[];
  tickets: AdminTicket[];
  users: AdminUser[];
  settings: AdminSettings;
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
          {payments.some((p) => p.status === "in_review" || p.status === "verified" || (p.status === "pending" && p.method !== "cash")) && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {payments.filter((p) => !["paid", "cancelled"].includes(p.status) && (p.status !== "pending" || p.method === "cash")).length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="boletos" className="gap-1.5">
          <TicketIcon /> Boletos
        </TabsTrigger>
        <TabsTrigger value="usuarios" className="gap-1.5">
          <UsersIcon /> Usuarios
        </TabsTrigger>
        <TabsTrigger value="config" className="gap-1.5">
          <SettingsIcon /> Configuración
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
      <TabsContent value="config">
        <SettingsTab settings={settings} />
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
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: "first" | "confirm" | "cancel") {
    setBusy(action);
    const fn =
      action === "first"
        ? adminFirstCheck
        : action === "confirm"
          ? adminConfirmPayment
          : adminCancelPayment;
    const res = await fn(payment.id);
    setBusy(null);
    if (res.ok) {
      toast.success(
        action === "first"
          ? "Comprobante aprobado (revisión 1)."
          : action === "confirm"
            ? "¡Pago confirmado y boletos marcados como pagados!"
            : "Pago cancelado y boletos liberados.",
      );
      router.refresh();
    } else {
      toast.error(res.error ?? "Ocurrió un error.");
      router.refresh();
    }
  }

  const needsFirstCheck =
    payment.method !== "cash" && !payment.verified && ["pending", "in_review", "verified"].includes(payment.status);
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
          {payment.proofData && (
            <Dialog>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                <ImageIcon /> Ver comprobante
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Comprobante · Orden #{payment.id}</DialogTitle>
                  <DialogDescription>
                    {payment.userName} ({payment.userEmail}) · {formatMxn(payment.amountMxn)}
                  </DialogDescription>
                </DialogHeader>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={payment.proofData} alt="Comprobante de pago" className="max-h-[60vh] w-full rounded-lg border object-contain" />
              </DialogContent>
            </Dialog>
          )}
          {needsFirstCheck && (
            <Button size="sm" variant="secondary" onClick={() => run("first")} disabled={busy !== null}>
              {busy === "first" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Revisión 1: aprobar comprobante
            </Button>
          )}
          {canConfirm && (
            <Button
              size="sm"
              onClick={() => run("confirm")}
              disabled={busy !== null || (payment.method !== "cash" && !payment.verified)}
              title={
                payment.method !== "cash" && !payment.verified
                  ? "Primero aprueba el comprobante (revisión 1)"
                  : "Marcar como pagado y confirmar boletos"
              }
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

/* ─────────────────────── Configuración ─────────────────────── */

function SettingsTab({ settings }: { settings: AdminSettings }) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [qrUrl, setQrUrl] = useState(settings.cardQr);
  const [saving, setSaving] = useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const img = await fileToCompressedJpeg(file, 900, 0.8);
      const buf = await img.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      setQrUrl(`data:image/jpeg;base64,${base64}`);
      toast.success("QR cargado. Guarda los cambios para aplicarlo.");
    } catch {
      toast.error("No se pudo procesar el QR");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("cardQr", qrUrl);
    const res = await adminUpdateSettings(fd);
    setSaving(false);
    if (res.ok) {
      toast.success("Configuración guardada. Los compradores ya la verán.");
    } else {
      toast.error(res.error ?? "No se pudo guardar");
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid max-w-2xl gap-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote /> Pago con tarjeta (QR)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="cardQr">URL del código QR</Label>
            <Input id="cardQr" name="cardQr" placeholder="https://… o imagen cargada" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <ImageIcon /> Cargar imagen QR
            </Button>
            {qrUrl && (
              <div className="w-16 rounded-lg border bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="Vista previa del QR" className="w-full" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Los compradores ven este QR al elegir «Tarjeta / QR».
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote /> Transferencia (CLABE)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Banco" name="bankName" defaultValue={settings.bankName} />
            <Field label="Titular" name="bankAccountHolder" defaultValue={settings.bankAccountHolder} />
            <Field label="Número de cuenta" name="bankAccountNumber" defaultValue={settings.bankAccountNumber} />
            <Field label="CLABE interbancaria" name="bankClabe" defaultValue={settings.bankClabe} />
          </div>
          <p className="text-xs text-muted-foreground">
            Los compradores ven estos datos al elegir «Transferencia».
          </p>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="justify-self-start" disabled={saving}>
        {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
        Guardar configuración
      </Button>
    </form>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} />
    </div>
  );
}