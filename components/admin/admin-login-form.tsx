"use client";

import { useActionState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { adminLogin } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, null as { error?: string } | null);

  return (
    <form action={action} className="grid gap-3">
      {state?.error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="username">Usuario</Label>
        <Input id="username" name="username" placeholder="admin" autoComplete="username" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
        Entrar al panel
      </Button>
    </form>
  );
}