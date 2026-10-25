import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/auth-form";
import { enabledSocialProviders } from "@/lib/config";
import { getSessionUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Regístrate" };

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="Regístrate ya"
      subtitle="Crea tu cuenta en un minuto para elegir tus números de la suerte."
    >
      <SignUpForm providers={enabledSocialProviders()} />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}