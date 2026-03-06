import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "Grilla operativa con asignaciones, auditoria, permisos y flujo de produccion en vivo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${manrope.variable} ${plexMono.variable} min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
