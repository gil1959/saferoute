import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/top-nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SafeRoute | Navigasi Kota Aman",
  description:
    "SafeRoute — platform navigasi dan keamanan kota cerdas yang mengutamakan keselamatan pengguna.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--canvas)",
          color: "var(--primary)",
          fontFamily: "var(--font-sans)",
          fontWeight: 300,
          margin: 0,
          padding: 0,
        }}
      >
        <TopNav />
        <div className="m-stripe-divider" />
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            minHeight: 0,
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
