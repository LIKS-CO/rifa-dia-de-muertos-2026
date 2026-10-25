"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SocialProvider = "google" | "github" | "apple";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.46H12v4.65h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29a7.2 7.2 0 0 1 0-4.58V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.35.6 4.6 1.8l3.44-3.44A12 12 0 0 0 1.27 6.6l4.01 3.1c.94-2.84 3.59-4.95 6.72-4.95Z"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.35.77 1.04.77 2.1v3.11c0 .3.2.66.8.55A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}

function SocialButton({
  provider,
  loading,
  onStart,
}: {
  provider: SocialProvider;
  loading: boolean;
  onStart: (p: SocialProvider) => void;
}) {
  const label =
    provider === "google" ? "Google" : provider === "github" ? "GitHub" : "Apple";
  const icon =
    provider === "google" ? (
      <GoogleIcon className="size-4" />
    ) : provider === "github" ? (
      <GithubIcon className="size-4" />
    ) : (
      <AppleIcon className="size-4" />
    );
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      disabled={loading}
      onClick={() => onStart(provider)}
    >
      {icon}
      Continuar con {label}
    </Button>
  );
}

export function SocialProviders({ providers }: { providers: SocialProvider[] }) {
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  if (providers.length === 0) return null;

  async function start(p: SocialProvider) {
    setLoading(p);
    const { error } = await authClient.signIn.social({
      provider: p,
      callbackURL: "/dashboard",
    });
    if (error) {
      toast.error("No se pudo iniciar con ese proveedor");
      setLoading(null);
    }
    // On success better-auth redirects the browser.
  }

  return (
    <div className="grid gap-2">
      {providers.map((p) => (
        <SocialButton key={p} provider={p} loading={loading === p} onStart={start} />
      ))}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">o con correo</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Sign Up ───────────────────────── */

export function SignUpForm({ providers }: { providers: SocialProvider[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      setPending(false);
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      setPending(false);
      return;
    }

    const { error } = await authClient.signUp.email({ name, email, password });
    if (error) {
      const status = (error as { status?: number }).status;
      if (status === 422 || status === 400) {
        toast.error("Ese correo ya está registrado. Intenta iniciar sesión.");
        setPending(false);
        return;
      }
      toast.error(error.message ?? "No se pudo crear la cuenta");
      setPending(false);
      return;
    }

    toast.success("Cuenta creada. Te enviamos un código para verificar tu correo.");
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <SocialProviders providers={providers} />
      <div className="grid gap-1.5">
        <Label htmlFor="name">Nombre completo</Label>
        <Input id="name" name="name" placeholder="Ej. La Catrina Martínez" autoComplete="name" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" placeholder="tu@correo.com" autoComplete="email" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirm">Confirmar contraseña</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Crear cuenta y empezar
      </Button>
    </form>
  );
}

/* ───────────────────────── Log in ───────────────────────── */

export function LoginForm({ providers }: { providers: SocialProvider[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      const status = (error as { status?: number }).status;
      if (status === 403) {
        // Email not verified yet → send the code and take them to verify.
        toast.info("Tu correo aún no está verificado. Te enviamos el código.");
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        setPending(false);
        return;
      }
      toast.error(error.message ?? "Correo o contraseña incorrectos");
      setPending(false);
      return;
    }
    toast.success("¡Bienvenido de vuelta!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <SocialProviders providers={providers} />
      <div className="grid gap-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" placeholder="tu@correo.com" autoComplete="email" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Iniciar sesión
      </Button>
    </form>
  );
}