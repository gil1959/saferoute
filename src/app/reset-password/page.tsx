"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const PASSWORD_RULES = [
  { label: "Minimal 8 karakter", test: (p: string) => p.length >= 8 },
  { label: "Mengandung huruf besar", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Mengandung angka", test: (p: string) => /[0-9]/.test(p) },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px", backgroundColor: "var(--canvas)" }}>
        <div style={{ width: "100%", maxWidth: "440px", backgroundColor: "var(--surface-card)", border: "2px solid var(--hairline)", padding: "40px 36px", textAlign: "center" }}>
          <p className="label-uppercase" style={{ color: "var(--m-red)", marginBottom: "12px" }}>Link Tidak Valid</p>
          <p className="body-sm" style={{ color: "var(--muted)", marginBottom: "24px" }}>
            Link reset password tidak valid atau sudah kedaluwarsa.
          </p>
          <Link href="/forgot-password" className="btn-primary" style={{ display: "inline-block" }}>
            MINTA LINK BARU
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Password dan konfirmasi tidak cocok.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirm_password: confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "EXPIRED") {
          setError("Link reset sudah kedaluwarsa. Minta link baru dari halaman lupa password.");
          return;
        }
        setError(data.message || data.error || "Reset gagal.");
        return;
      }
      router.push("/login?notice=reset_done");
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = PASSWORD_RULES.filter((r) => r.test(password)).length;

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
              RESET PASSWORD
            </h1>
            <p className="body-sm" style={{ color: "var(--muted)", margin: 0 }}>
              Buat password baru untuk akun Anda.
            </p>
          </div>

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
                PASSWORD BARU
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  className="field-input"
                  placeholder="Minimal 8 karakter..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: "52px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", padding: 0,
                  }}
                >
                  {showPw ? "HIDE" : "SHOW"}
                </button>
              </div>

              {password && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1, height: "3px",
                          backgroundColor: i < pwStrength
                            ? pwStrength === 1 ? "var(--m-red)" : pwStrength === 2 ? "var(--warning)" : "var(--success)"
                            : "var(--hairline)",
                        }}
                      />
                    ))}
                  </div>
                  {PASSWORD_RULES.map((r) => (
                    <p key={r.label} className="caption" style={{ margin: "2px 0", color: r.test(password) ? "var(--success)" : "var(--muted)" }}>
                      {r.test(password) ? "+" : "-"} {r.label}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
                KONFIRMASI PASSWORD BARU
              </label>
              <input
                type={showPw ? "text" : "password"}
                className="field-input"
                placeholder="Ulangi password baru..."
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                style={{ borderColor: confirm && confirm !== password ? "var(--m-red)" : undefined }}
              />
              {confirm && confirm !== password && (
                <p className="caption" style={{ color: "var(--m-red)", marginTop: "6px" }}>
                  Password tidak cocok.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "MENYIMPAN..." : "SIMPAN PASSWORD BARU"}
            </button>

            <p className="caption" style={{ textAlign: "center", color: "var(--muted)", margin: 0 }}>
              <Link href="/forgot-password" style={{ color: "var(--muted)", textDecoration: "underline" }}>
                Minta link baru
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
