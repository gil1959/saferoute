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
  title: "SafeRoute | Smart City Navigation",
  description: "SafeRoute is a Smart City Navigation & Safety Platform focused on prioritizing user safety over speed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} antialiased bg-black text-white h-full`}
    >
      <body className="min-h-full flex flex-col font-sans font-light">
        <TopNav />
        <div className="m-stripe-divider"></div>
        <main className="flex-1 flex flex-col relative">
          {children}
        </main>
      </body>
    </html>
  );
}
