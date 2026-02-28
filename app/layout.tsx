import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: {
    default: "Docszin — Documentação simples e rápida",
    template: "%s · Docszin",
  },
  description: "Crie, edite e compartilhe documentação com Markdown de forma simples e rápida.",
  keywords: ["Docszin", "documentação", "markdown", "editor", "notas", "docs"],
  authors: [{ name: "Docszin" }],
  creator: "Docszin",
  openGraph: {
    title: "Docszin",
    description: "Documentação simples e rápida com Markdown.",
    siteName: "Docszin",
  },
  twitter: {
    card: "summary_large_image",
    title: "Docszin",
    description: "Documentação simples e rápida com Markdown.",
    creator: "@victorborges97",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
