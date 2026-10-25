import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-form";
import { enabledSocialProviders } from "@/lib/config";
import { getSessionUser } from "@/lib/queries";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Regresa por tus boletos… o por tu altar ganador."
    >
      <LoginForm providers={enabledSocialProviders()} />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          Regístrate ya
        </Link>
      </p>
    </AuthShell>
  );
}