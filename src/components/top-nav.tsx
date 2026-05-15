"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SessionInfo {
  name: string;
  role: string;
}

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setSession(data?.user ?? null);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: "CARI RUTE" },
    { href: "/report", label: "LAPOR INSIDEN" },
  ];

  return (
    <header
      className="h-16 bg-[var(--surface-card)] text-[var(--primary)] border-b-2 border-[var(--hairline)] flex-shrink-0"
    >
      <div className="h-full px-6 flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Logo + Nav Utama */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="flex h-5 w-7">
              <div className="flex-1 bg-[var(--m-blue-light)]"></div>
              <div className="flex-1 bg-[var(--m-blue-dark)]"></div>
              <div className="flex-1 bg-[var(--m-red)]"></div>
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--primary)",
                textDecoration: "none",
              }}
            >
              SafeRoute
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="nav-link px-4 py-2 hover:bg-[var(--surface-elevated)] transition-colors no-underline"
                style={{
                  textDecoration: "none",
                  color: pathname === href ? "var(--primary)" : "var(--muted)",
                  fontWeight: pathname === href ? 700 : 400,
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Kanan: state auth */}
        <div className="flex items-center gap-3">
          {!checked ? null : session ? (
            <>
              <span className="caption" style={{ color: "var(--muted)", letterSpacing: "0.5px" }}>
                {session.name.split(" ")[0].toUpperCase()}
              </span>
              <Link
                href="/my-reports"
                className="btn-outline"
                style={{ padding: "10px 20px", height: "40px", fontSize: "12px", textDecoration: "none", display: "flex", alignItems: "center" }}
              >
                LAPORAN SAYA
              </Link>
              <button
                onClick={handleLogout}
                className="btn-outline"
                style={{ padding: "10px 20px", height: "40px", fontSize: "12px" }}
              >
                KELUAR
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="btn-primary"
              style={{ padding: "10px 20px", height: "40px", fontSize: "12px" }}
            >
              MASUK
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
