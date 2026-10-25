"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await authClient.signOut();
    toast.success("Hasta la próxima 🌼");
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={logout} disabled={pending} className={className}>
      {pending ? <Loader2 className="animate-spin" /> : <LogOut />}
      Cerrar sesión
    </Button>
  );
}