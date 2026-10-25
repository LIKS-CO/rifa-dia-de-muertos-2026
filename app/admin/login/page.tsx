import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Candle } from "@/components/dia/candle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Panel de administración · Acceso" };

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user?.role === "admin") redirect("/admin");

  return (
    <main className="relative flex min-h-dvh flex-col bg-background">
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
        <Card className="w-full max-w-sm border-primary/20 bg-popover/70 shadow-2xl backdrop-blur">
          <CardHeader className="items-center gap-2 text-center">
            <div className="flex items-center gap-3">
              <Candle height={36} glow={false} />
              <ShieldCheck className="size-8 text-primary" />
              <Candle height={36} glow={false} />
            </div>
            <CardTitle className="font-display text-2xl">Panel de administración</CardTitle>
            <p className="text-sm text-muted-foreground">
              Solo para organizadores de Takumi Robotics y LIKS.
            </p>
          </CardHeader>
          <CardContent>
            <AdminLoginForm />
          </CardContent>
        </Card>
      </div>

      <Link
        href="/"
        className="absolute left-4 top-8 z-20 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a la rifa
      </Link>
    </main>
  );
}