import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RAFFLE } from "@/lib/config";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: {
    default: `${RAFFLE.name} · Takumi Robotics × LIKS`,
    template: `%s · ${RAFFLE.name}`,
  },
  description: `Participa en la rifa que apoya a Takumi Robotics y LIKS. ${RAFFLE.totalTickets} boletos de ${RAFFLE.ticketPriceMxn
    .toLocaleString("es-MX")} MXN · ¡Gana un altar de Día de Muertos hecho en corte láser!`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={cn(
        "h-full antialiased dark",
        inter.variable,
        geistMono.variable,
        cormorant.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="dark" richColors position="top-center" />
      </body>
    </html>
  );
}