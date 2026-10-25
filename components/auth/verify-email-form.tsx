"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, MailCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Falta el correo. Vuelve a iniciar sesión.");
      return;
    }
    setPending(true);
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp: code.trim() });
    setPending(false);
    if (error) {
      toast.error(error.message ?? "Código incorrecto o expirado.");
      return;
    }
    setDone(true);
    toast.success("¡Correo verificado! Bienvenido 🎉");
    setTimeout(() => router.push("/dashboard"), 800);
  }

  async function resend() {
    if (!email) {
      toast.error("Falta el correo.");
      return;
    }
    setSending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setSending(false);
    if (error) {
      toast.error(error.message ?? "No se pudo reenviar el código.");
      return;
    }
    toast.success("Te enviamos un nuevo código.");
  }

  return (
    <div className="grid gap-4">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Check className="size-6" />
          </span>
          <p className="font-medium">Correo verificado. ¡Nos vemos en tu tablero!</p>
        </div>
      ) : (
        <form onSubmit={verify} className="grid gap-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MailCheck className="size-4" />
            <span>Te enviamos un código de 6 dígitos a:</span>
          </div>
          <p className="text-center font-medium text-primary">{email || "tu correo"}</p>
          <div className="grid gap-1.5">
            <Label htmlFor="code">Código de verificación</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="h-12 text-center font-mono text-xl tracking-[0.5em]"
              placeholder="••••••"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </div>
          <Button type="submit" size="lg" disabled={pending || code.length !== 6}>
            {pending && <Loader2 className="animate-spin" />}
            Verificar correo
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={resend} disabled={sending}>
            {sending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            Reenviar código
          </Button>
        </form>
      )}
    </div>
  );
}