"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan.");
        return;
      }
      setSent(true);
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        backgroundColor: "var(--canvas)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div
          style={{
            backgroundColor: "var(--surface-card)",
            border: "2px solid var(--hairline)",
          }}
        >
          <div className="m-stripe-divider" />

          <div style={{ padding: "32px 36px 24px" }}>
            <p className="caption" style={{ margin: "0 0 6px", color: "var(--muted)", letterSpacing: "2px" }}>
              SAFEROUTE
            </p>
            <h1 className="display-sm" style={{ margin: "0 0 10px", color: "var(--primary)" }}>
              LUPA PASSWORD
            </h1>
            <p className="body-sm" style={{ color: "var(--muted)", margin: 0 }}>
              Masukkan email yang terdaftar. Kami akan mengirimkan link untuk mereset password Anda.
            </p>
          </div>

          {sent ? (
            <div style={{ padding: "0 36px 32px" }}>
              <div
                style={{
                  padding: "20px 20px",
                  backgroundColor: "#e8f4fd",
                  border: "2px solid var(--m-blue-dark)",
                  borderLeft: "4px solid var(--m-blue-dark)",
                  marginBottom: "24px",
                }}
              >
                <p className="body-sm" style={{ margin: "0 0 4px", color: "var(--primary)", fontWeight: 700 }}>
                  Email dikirim
                </p>
                <p className="body-sm" style={{ margin: 0, color: "var(--body)" }}>
                  Jika akun dengan email <strong>{email}</strong> terdaftar dan sudah diverifikasi,
                  Anda akan menerima link reset password. Cek juga folder spam.
                </p>
              </div>
              <Link href="/login" className="btn-outline" style={{ display: "block", textAlign: "center", width: "100%" }}>
                KEMBALI KE HALAMAN MASUK
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: "0 36px 32px", display: "flex", flexDirection: "column", gap: "18px" }}>
              {error && (
                <div
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#fdf0ef",
                    border: "2px solid var(--m-red)",
                    borderLeft: "4px solid var(--m-red)",
                  }}
                >
                  <p className="body-sm" style={{ margin: 0, color: "var(--m-red)" }}>{error}</p>
                </div>
              )}

              <div>
                <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
                  EMAIL TERDAFTAR
                </label>
                <input
                  type="email"
                  className="field-input"
                  placeholder="Masukkan email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: "100%", opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "MENGIRIM..." : "KIRIM LINK RESET"}
              </button>

              <p className="body-sm" style={{ textAlign: "center", color: "var(--muted)", margin: 0 }}>
                <Link href="/login" style={{ color: "var(--muted)", textDecoration: "underline" }}>
                  Kembali ke halaman masuk
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
