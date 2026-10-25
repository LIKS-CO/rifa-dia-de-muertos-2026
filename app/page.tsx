import type { Metadata } from "next";
import Link from "next/link";
import {
  Banknote,
  Flame,
  Gift,
  QrCode,
  Skull,
  Sparkles,
  Ticket,
} from "lucide-react";

import { Candle } from "@/components/dia/candle";
import { Marigold } from "@/components/dia/marigold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RAFFLE, formatMxn } from "@/lib/config";

export const metadata: Metadata = {
  title: `${RAFFLE.name} · Takumi Robotics × LIKS`,
  description: `Participa por el altar de Día de Muertos en corte láser y apoya a Takumi Robotics y a LIKS. ${RAFFLE.totalTickets} boletos de ${formatMxn(RAFFLE.ticketPriceMxn)}.`,
};

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-background">
      {/* ── Nav ── */}
      <nav className="relative z-30 mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Skull className="size-6 text-primary" />
          <span>
            Rifa <span className="text-primary">Día de Muertos</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">
            Iniciar sesión
          </Button>
          <Button render={<Link href="/signup" />} nativeButton={false} size="sm">
            Regístrate YA
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-16 pb-10 text-center md:pt-24">
        <Badge variant="secondary" className="mb-5 gap-1.5 px-3 py-1 text-xs uppercase tracking-widest">
          <Sparkles className="size-3" /> Edición 2 de Noviembre
        </Badge>

        <h1 className="font-display max-w-3xl text-5xl leading-tight font-semibold sm:text-6xl md:text-7xl">
          Tu boleto puede llevar a casa un{" "}
          <span className="text-glow-marigold text-primary">altar de Día de Muertos</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Un altar ceremonial en <strong className="text-foreground">corte láser</strong> para
          recordar a los que se fueron — todo mientras apoyas a{" "}
          <strong className="text-foreground">Takumi Robotics</strong> y a{" "}
          <strong className="text-foreground">LIKS Compañía de Teatro</strong>.
        </p>

        {/* stats */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Stat icon={<Ticket className="size-4" />} label={`${RAFFLE.totalTickets} boletos`} />
          <Stat icon={<Banknote className="size-4" />} label={`${formatMxn(RAFFLE.ticketPriceMxn)} c/u`} />
          <Stat icon={<Gift className="size-4" />} label="1 premio único" />
          <Stat icon={<Flame className="size-4" />} label="100% para las causas" />
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            render={<Link href="/signup" />}
            nativeButton={false}
            size="lg"
            className="h-14 px-8 text-lg shadow-[0_0_32px_rgba(0,0,0,0.35)]"
          >
            Regístrate YA
          </Button>
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            size="lg"
            variant="outline"
            className="h-14 px-8 text-lg"
          >
            Ya tengo cuenta · Entrar
          </Button>
        </div>

        {/* Altar scene */}
        <div className="mt-12 w-full max-w-3xl">
          <AltarScene />
        </div>
      </section>

      {/* ── Prize ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="relative">
            <Card className="glow-ember relative overflow-hidden border-primary/25 bg-popover/80 backdrop-blur">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <Gift className="size-10 text-primary" />
                <h2 className="font-display text-3xl font-semibold">El premio</h2>
                <p className="text-muted-foreground">
                  Un <strong className="text-foreground">altar de Día de Muertos en corte láser</strong>,
                  diseñado para esta rifa: una ofrenda desmontable con siluetas de catrinas, flores de
                  cempasúchil y velas. Una pieza única para honrar a tus seres queridos todo el año.
                  Incluye <strong className="text-foreground">3 niveles</strong> y retroiluminación opcional.
                </p>
                <Badge className="gap-1.5 text-xs uppercase tracking-wider">
                  <Sparkles className="size-3" /> Edición limitada
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* orgs */}
          <div className="grid gap-4">
            <OrgCard
              name="Takumi Robotics"
              tagline="La robótica como camino"
              body="Equipo estudiantil que diseña, construye y compite con robots. Forma a la próxima generación de ingenieras e ingenieros mexicanos."
              emoji="🤖"
            />
            <OrgCard
              name="LIKS Compañía de Teatro"
              tagline="El teatro como puente"
              body="Compañía que lleva historias a escena, promueve las artes y construye comunidad a través de la cultura y el teatro independiente."
              emoji="🎭"
            />
            <p className="text-center text-sm text-muted-foreground md:text-left">
              Al comprar un boleto, el <strong className="text-foreground">100% de lo recaudado</strong>{" "}
              se reparte entre estas dos causas.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-center text-3xl font-semibold md:text-4xl">
          ¿Cómo participo?
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Más fácil que prender una veladora.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <StepCard
            n="1"
            title="Regístrate"
            body="Crea tu cuenta con correo o redes sociales. Solo te pedimos un nombre para saber a quién entregar el premio."
          />
          <StepCard
            n="2"
            title="Elige tus números"
            body="Del 1 al 100, aparta los que más te gusten: tu día de suerte, tu año de nacimiento o el número que pasó la catrina a visitar."
          />
          <StepCard
            n="3"
            title="Paga y espera la suerte"
            body="Efectivo, tarjeta (QR) o transferencia (CLABE). Si pagas con tarjeta o transferencia, sube tu comprobante y un administrador lo confirma."
          />
        </div>
        <div className="mt-10 space-y-3 text-center text-sm text-muted-foreground md:text-base">
          <p>📅 El sorteo se realizará el <strong className="text-foreground">2 de noviembre</strong>.</p>
          <p>🎟️ Cada boleto cuesta <strong className="text-foreground">{formatMxn(RAFFLE.ticketPriceMxn)} MXN</strong> — puedes comprar varios.</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="bg-marigold-fade relative rounded-3xl border border-primary/20 p-10 md:p-16">
          <h2 className="font-display text-4xl font-semibold md:text-5xl">
            El 2 de noviembre, un <span className="text-glow-marigold text-primary">altar</span> busca dueñ@
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
            Apoya a Takumi Robotics y LIKS, y llévate una pieza única hecha con láser y dedicación.
          </p>
          <Button
            render={<Link href="/signup" />}
            nativeButton={false}
            size="lg"
            className="mt-8 h-14 px-10 text-lg"
          >
            Regístrate YA
          </Button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="font-display text-center text-2xl font-semibold">Preguntas frecuentes</h2>
        <div className="mt-6 grid gap-3 text-sm">
          <Faq q="¿Cómo pago con tarjeta?" a="Selecciona “Tarjeta / QR”, escanea el código QR con tu app bancaria, paga, y sube una foto del comprobante. Un administrador lo valida." />
          <Faq q="¿Cómo pago por transferencia?" a="Selecciona “Transferencia” y verás la CLABE y los datos bancarios. Transfiere el monto exacto y sube tu comprobante para validación." />
          <Faq q="¿Puedo pagar en efectivo?" a="Sí. Elige “Efectivo”, apunta tus números y ponte en contacto con los organizadores para entregar el dinero. Solo los administradores pueden marcarlo como pagado." />
          <Faq q="¿Qué pasa si no pago mis boletos apartados?" a="Se liberan de nuevo tras la rifa. Si quieres liberarlos antes, puedes cancelar la orden desde tu tablero." />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-primary/15 py-8 text-center text-xs text-muted-foreground">
        <p>
          💀 Rifa organizada por Takumi Robotics y LIKS Compañía de Teatro ·{" "}
          {RAFFLE.totalTickets} boletos · {formatMxn(RAFFLE.ticketPriceMxn)} MXN c/u
        </p>
        <Link href="/admin" className="mt-2 inline-block text-muted-foreground/60 hover:text-muted-foreground">
          Acceso administradores
        </Link>
      </footer>
    </main>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 border-primary/25 px-4 py-2 text-sm">
      {icon}
      {label}
    </Badge>
  );
}

function OrgCard({
  name,
  tagline,
  body,
  emoji,
}: {
  name: string;
  tagline: string;
  body: string;
  emoji: string;
}) {
  return (
    <Card className="border-primary/15 bg-popover/70 backdrop-blur">
      <CardContent className="flex gap-4 p-5">
        <span className="text-3xl" aria-hidden="true">
          {emoji}
        </span>
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-xs font-medium text-primary">{tagline}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StepCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <Card className="relative border-primary/15 bg-popover/70">
      <CardContent className="p-6">
        <span className="font-display text-5xl font-semibold text-primary/30">{n}</span>
        <h3 className="mt-2 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-primary/15 p-4">
      <p className="font-medium">{q}</p>
      <p className="mt-1 text-muted-foreground">{a}</p>
    </div>
  );
}

/** Decorative ofrenda scene for the hero. */
function AltarScene() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="relative flex flex-col items-center rounded-t-[140px] border-x-4 border-t-4 border-primary/30 bg-gradient-to-b from-primary/10 via-popover to-popover px-6 pt-14 pb-6 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
        {/* top notch */}
        <div className="absolute -top-3 left-1/2 h-6 w-28 -translate-x-1/2 rounded-full border-4 border-primary/30 bg-primary/20" />
        {/* ofrenda items */}
        <div className="flex w-full items-end justify-around gap-3">
          <Candle height={72} />
          <Marigold size={64} className="marigold-sway opacity-90" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-5xl" aria-hidden="true">💀</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Catrina</span>
          </div>
          <Marigold size={64} className="marigold-sway opacity-90" />
          <Candle height={72} />
        </div>
        <div className="mt-6 h-2 w-full rounded-full bg-primary/30 shadow-[0_0_20px_rgba(0,0,0,0.5)]" />
      </div>
      <div className="flex justify-center gap-8 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <QrCode className="size-3" /> 100 boletos
        </span>
        <span className="inline-flex items-center gap-1">
          <Banknote className="size-3" /> {formatMxn(RAFFLE.ticketPriceMxn)}
        </span>
      </div>
    </div>
  );
}