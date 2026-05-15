"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (params.get("verified") === "1") {
      setNotice("Email berhasil diverifikasi. Silakan masuk.");
    }
    if (params.get("notice") === "already_registered") {
      setNotice("Akun dengan email atau nomor HP ini sudah terdaftar. Silakan masuk.");
    }
    if (params.get("notice") === "reset_done") {
      setNotice("Password berhasil diubah. Silakan masuk dengan password baru.");
    }
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "EMAIL_NOT_VERIFIED") {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        setError(data.error || "Login gagal.");
        return;
      }

      const redirect = params.get("redirect") || "/";
      router.push(data.role === "admin" ? "/admin" : redirect);
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
        {/* Card */}
        <div
          style={{
            backgroundColor: "var(--surface-card)",
            border: "2px solid var(--hairline)",
          }}
        >
          {/* M stripe */}
          <div className="m-stripe-divider" />

          {/* Header */}
          <div style={{ padding: "32px 36px 24px" }}>
            <p
              className="caption"
              style={{ margin: "0 0 6px", color: "var(--muted)", letterSpacing: "2px" }}
            >
              SAFEROUTE
            </p>
            <h1
              className="display-sm"
              style={{ margin: 0, color: "var(--primary)" }}
            >
              MASUK
            </h1>
          </div>

          {/* Notice */}
          {notice && (
            <div
              style={{
                margin: "0 36px 16px",
                padding: "12px 16px",
                backgroundColor: "#e8f4fd",
                border: "2px solid var(--m-blue-dark)",
                borderLeft: "4px solid var(--m-blue-dark)",
              }}
            >
              <p className="body-sm" style={{ margin: 0, color: "var(--m-blue-dark)" }}>
                {notice}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                margin: "0 36px 16px",
                padding: "12px 16px",
                backgroundColor: "#fdf0ef",
                border: "2px solid var(--m-red)",
                borderLeft: "4px solid var(--m-red)",
              }}
            >
              <p className="body-sm" style={{ margin: 0, color: "var(--m-red)" }}>
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "0 36px 32px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label
                htmlFor="credential"
                className="caption"
                style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}
              >
                EMAIL ATAU NOMOR HP
              </label>
              <input
                id="credential"
                type="text"
                className="field-input"
                placeholder="Masukkan email atau nomor HP..."
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <label
                  htmlFor="password"
                  className="caption"
                  style={{ color: "var(--muted)", letterSpacing: "1px" }}
                >
                  PASSWORD
                </label>
                <Link
                  href="/forgot-password"
                  className="caption"
                  style={{ color: "var(--m-blue-dark)", textDecoration: "none" }}
                >
                  Lupa password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="field-input"
                  placeholder="Masukkan password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: "52px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    padding: 0,
                  }}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", marginTop: "4px", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "MEMPROSES..." : "MASUK"}
            </button>

            <p className="body-sm" style={{ textAlign: "center", color: "var(--muted)", margin: 0 }}>
              Belum punya akun?{" "}
              <Link
                href="/register"
                style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
              >
                Daftar sekarang
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
