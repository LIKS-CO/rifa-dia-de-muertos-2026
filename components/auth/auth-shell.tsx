import { ArrowLeft, Skull } from "lucide-react";
import Link from "next/link";

import { Candle } from "@/components/dia/candle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Volver a la rifa",
  children,
}: {
  title: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col bg-background">
      <Link
        href={backHref}
        className="absolute left-4 top-8 z-20 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md border-primary/20 bg-popover/70 shadow-2xl backdrop-blur">
          <CardHeader className="items-center gap-2 text-center">
            <div className="flex items-center gap-3">
              <Candle height={40} glow={false} />
              <Skull className="size-7 text-primary/80" />
              <Candle height={40} glow={false} />
            </div>
            <CardTitle className="font-display text-3xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}