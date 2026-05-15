"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [codes, setCodes] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleCodeChange = (idx: number, val: string) => {
    // Allow paste of 6 digits
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      const newCodes = val.split("");
      setCodes(newCodes);
      inputRefs.current[5]?.focus();
      return;
    }
    const digit = val.replace(/\D/g, "").slice(-1);
    const newCodes = [...codes];
    newCodes[idx] = digit;
    setCodes(newCodes);
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codes[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codes.join("");
    if (code.length < 6) {
      setError("Masukkan 6 digit kode verifikasi.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Verifikasi gagal.");
        return;
      }
      router.push("/login?verified=1");
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendMsg("");
    setResending(true);
    try {
      await fetch("/api/auth/resend-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendMsg("Kode baru telah dikirim ke email Anda.");
      setResendCooldown(60);
    } catch {
      setResendMsg("Gagal mengirim ulang. Coba lagi.");
    } finally {
      setResending(false);
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

          <div style={{ padding: "32px 36px 28px" }}>
            <p className="caption" style={{ margin: "0 0 6px", color: "var(--muted)", letterSpacing: "2px" }}>
              SAFEROUTE
            </p>
            <h1 className="display-sm" style={{ margin: "0 0 12px", color: "var(--primary)" }}>
              VERIFIKASI EMAIL
            </h1>
            <p className="body-sm" style={{ color: "var(--muted)", margin: 0 }}>
              Kode 6 digit telah dikirim ke{" "}
              <strong style={{ color: "var(--primary)" }}>{email || "email Anda"}</strong>.
              Berlaku 15 menit.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "0 36px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 6 Digit input */}
            <div>
              <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "16px", letterSpacing: "1px" }}>
                MASUKKAN KODE VERIFIKASI
              </label>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                {codes.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      width: "48px",
                      height: "56px",
                      textAlign: "center",
                      fontSize: "24px",
                      fontWeight: 700,
                      fontFamily: "monospace",
                      backgroundColor: "var(--surface-soft)",
                      border: `2px solid ${digit ? "var(--primary)" : "var(--hairline)"}`,
                      color: "var(--primary)",
                      outline: "none",
                      transition: "border-color 0.15s",
                      borderRadius: 0,
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                ))}
              </div>
            </div>

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

            {resendMsg && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#e8f4fd",
                  border: "2px solid var(--m-blue-dark)",
                  borderLeft: "4px solid var(--m-blue-dark)",
                }}
              >
                <p className="body-sm" style={{ margin: 0, color: "var(--m-blue-dark)" }}>{resendMsg}</p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "MEMVERIFIKASI..." : "VERIFIKASI"}
            </button>

            <div style={{ textAlign: "center" }}>
              <p className="body-sm" style={{ color: "var(--muted)", margin: "0 0 8px" }}>
                Tidak menerima kode?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                style={{
                  background: "none",
                  border: "none",
                  cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  color: resendCooldown > 0 ? "var(--muted)" : "var(--m-blue-dark)",
                  padding: 0,
                }}
              >
                {resendCooldown > 0
                  ? `Kirim ulang dalam ${resendCooldown}s`
                  : resending ? "Mengirim..."
                  : "Kirim ulang kode"}
              </button>
            </div>

            <p className="caption" style={{ textAlign: "center", color: "var(--muted)", margin: 0 }}>
              <Link href="/login" style={{ color: "var(--muted)", textDecoration: "underline" }}>
                Kembali ke halaman masuk
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
