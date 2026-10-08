import type { Metadata } from "next";
import { AuthProvider } from '@/lib/auth'
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ecoponto Certo",
  description: "Mapeamento colaborativo de pontos de reciclagem no Brasil.",
  keywords: ["reciclagem", "mapa", "coleta seletiva", "meio ambiente"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} h-full`}>
      <body className="h-full bg-[#EFF2EF] text-[#0F1C12] font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
