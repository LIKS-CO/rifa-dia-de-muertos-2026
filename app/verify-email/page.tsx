import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = { title: "Verifica tu correo" };

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verifica tu correo"
      subtitle="Ingresa el código de 6 dígitos que te enviamos."
      backHref="/login"
      backLabel="Ir a iniciar sesión"
    >
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        El correo salió de{" "}
        <span className="text-muted-foreground">
          {process.env.EMAIL_FROM ? "nuestra cuenta de envíos" : "la consola del servidor (modo desarrollo)"}
        </span>
        . ¿Problemas?{" "}
        <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          Crear otra cuenta
        </Link>
      </p>
    </AuthShell>
  );
}