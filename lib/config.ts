/**
 * Central raffle configuration. Tweak these values to adapt the raffle.
 */
export const RAFFLE = {
  /** Name shown across the app */
  name: "Rifa Día de Muertos",
  /** Total number of tickets available */
  totalTickets: Number(process.env.RAFFLE_TOTAL_TICKETS ?? 350),
  /** Price per ticket in MXN */
  ticketPriceMxn: Number(process.env.RAFFLE_TICKET_PRICE ?? 200),
  /** Beneficiary organizations */
  organizations: ["Takumi Robotics", "LIKS Theater Company"],
  /** Prize description */
  prize: "Altar de Día de Muertos en corte láser",
  /** Currency formatting locale */
  currency: "MXN",
} as const;

/** Format a number as Mexican pesos. */
export function formatMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a date in Spanish (Mexico). */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

/** Payment method labels */
export const PAYMENT_METHODS = {
  cash: "Efectivo",
  transfer: "Transferencia bancaria",
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const PAYMENT_STATUS: Record<string, { label: string; tone: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", tone: "secondary" },
  in_review: { label: "En revisión (comprobante subido)", tone: "default" },
  verified: { label: "Verificado · falta confirmar", tone: "default" },
  paid: { label: "Pagado ✓", tone: "secondary" },
  cancelled: { label: "Cancelado", tone: "destructive" },
};

export const TICKET_STATUS: Record<string, string> = {
  available: "Disponible",
  reserved: "Apartado (en proceso de pago)",
  paid: "Pagado ✓",
};

export const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME ?? "admin",
  // Password is intentionally only compared through the user database
  // (the seeded admin account) — never stored here.
  email: process.env.ADMIN_EMAIL ?? "admin@rifa.example",
};

/** Providers whose OAuth keys are configured. Server-only. */
export function enabledSocialProviders() {
  return (["google", "github", "apple"] as const).filter((p) => {
    const key = p.toUpperCase();
    return Boolean(
      process.env[`${key}_CLIENT_ID`] && process.env[`${key}_CLIENT_SECRET`],
    );
  });
}