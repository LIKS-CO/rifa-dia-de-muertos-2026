"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Check,
  Copy,
  ImageUp,
  Loader2,
  QrCode,
  Ticket as TicketIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cancelMyPayment, createPurchase, uploadProof } from "@/lib/actions";
import { fileToCompressedJpeg } from "@/lib/client-image";
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
  verified: boolean;
  proofData: string | null;
  createdAt: string;
  ticketNumbers: number[];
};

export type DashboardSettings = {
  cardQr: string | null;
  bankName: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankClabe: string | null;
} | null;

const METHODS = [
  { id: "cash", icon: Banknote },
  { id: "card", icon: QrCode },
  { id: "transfer", icon: Copy },
] as const;

export function DashboardClient({
  userId,
  tickets,
  payments,
  settings,
}: {
  userId: string;
  tickets: DashboardTicket[];
  payments: DashboardPayment[];
  settings: DashboardSettings;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("card");
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
    const res = await createPurchase(selected, method);
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
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all ${
                        active
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <Icon className="size-4" />
                      {PAYMENT_METHODS[m.id]}
                    </button>
                  );
                })}
              </div>
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
            <OrderCard key={p.id} payment={p} settings={settings} />
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

function OrderCard({
  payment,
  settings,
}: {
  payment: DashboardPayment;
  settings: DashboardSettings;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const total = payment.ticketNumbers.length * RAFFLE.ticketPriceMxn;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await fileToCompressedJpeg(file);
      const res = await uploadProof(payment.id, compressed);
      if (res.ok) {
        toast.success("Comprobante subido. Un administrador lo verificará.");
        router.refresh();
      } else {
        toast.error(res.error ?? "No se pudo subir el comprobante");
      }
    } catch (err) {
      toast.error("Ocurrió un error procesando la imagen");
      console.error(err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const canUpload = payment.method !== "cash" && payment.status === "pending";
  const showInstructions = payment.status === "pending";

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

          {showInstructions && payment.method === "card" && (
            <PaymentHint
              title={
                settings?.cardQr
                  ? "Escanea el QR con tu banco para pagar:"
                  : "QR de pago no configurado todavía"
              }
              body={
                settings?.cardQr ? undefined : (
                  "Los organizadores aún no publican el QR. Escríbeles o intenta más tarde."
                )
              }
            >
              {settings?.cardQr && <QrImage src={settings.cardQr} />}
            </PaymentHint>
          )}

          {showInstructions && payment.method === "transfer" && (
            <PaymentHint title="Transfiere a esta cuenta y sube tu comprobante:">
              <div className="grid gap-1.5 text-sm">
                {settings?.bankName && (
                  <CopyRow label="Banco" value={settings.bankName} onCopy={() => copy(settings.bankName!, "bank")} copied={copied} />
                )}
                {settings?.bankAccountHolder && (
                  <CopyRow label="Titular" value={settings.bankAccountHolder} onCopy={() => copy(settings.bankAccountHolder!, "holder")} copied={copied} />
                )}
                {settings?.bankAccountNumber && (
                  <CopyRow label="Cuenta" value={settings.bankAccountNumber} onCopy={() => copy(settings.bankAccountNumber!, "number")} copied={copied} />
                )}
                {settings?.bankClabe ? (
                  <CopyRow label="CLABE" value={settings.bankClabe} highlight onCopy={() => copy(settings.bankClabe!, "clabe")} copied={copied} />
                ) : (
                  <p className="text-xs text-muted-foreground">La CLABE aún no está configurada por los organizadores.</p>
                )}
              </div>
            </PaymentHint>
          )}

          {showInstructions && payment.method === "cash" && (
            <PaymentHint
              title="Pago en efectivo"
              body="Entrega el efectivo a cualquiera de los organizadores de Takumi Robotics o LIKS. Un administrador marcará tus boletos como pagados."
            />
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canUpload && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFile}
                />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="animate-spin" /> : <ImageUp />}
                  Subir comprobante de pago
                </Button>
              </>
            )}
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

function QrImage({ src }: { src: string }) {
  return (
    <div className="mt-3 inline-flex w-40 rounded-xl border border-primary/30 bg-white p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="QR de pago" className="w-full" />
    </div>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
  copied,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: string | null;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:border-primary/50 ${
        highlight ? "border-primary/40 bg-primary/10" : "border-border bg-background/60"
      }`}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 font-mono text-foreground">
        {value}
        {copied === label ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-muted-foreground" />}
      </span>
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-amber-400/15 text-amber-200 border-amber-400/30" },
    in_review: { label: "Comprobante en revisión", cls: "bg-sky-400/15 text-sky-200 border-sky-400/30" },
    verified: { label: "Verificado · pendiente confirmar", cls: "bg-violet-400/15 text-violet-200 border-violet-400/30" },
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