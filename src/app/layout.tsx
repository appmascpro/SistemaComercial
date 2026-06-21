import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: {
    default: "ConectaInsumos",
    template: "%s | ConectaInsumos",
  },
  description:
    "Plataforma comercial para empresas de insumos, matérias-primas e produtos químicos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
