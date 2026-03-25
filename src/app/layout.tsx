import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { AdminSessionProvider } from "@/components/AdminSession/AdminSessionProvider";
import { CompareProvider } from "@/components/Compare/CompareProvider";
import { FavoritesProvider } from "@/components/Favorites/FavoritesProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pokemon App",
  description: "A fullstack Pokemon application built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <FavoritesProvider>
            <CompareProvider>
              <AdminSessionProvider>{children}</AdminSessionProvider>
            </CompareProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
