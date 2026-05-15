"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PASSWORD_RULES = [
  { label: "Minimal 8 karakter", test: (p: string) => p.length >= 8 },
  { label: "Mengandung huruf besar", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Mengandung angka", test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "EMAIL_EXISTS" || data.error === "PHONE_EXISTS") {
          router.push("/login?notice=already_registered");
          return;
        }
        setError(data.message || data.error || "Pendaftaran gagal.");
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = PASSWORD_RULES.filter((r) => r.test(form.password)).length;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 16px",
        backgroundColor: "var(--canvas)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "520px" }}>
        <div
          style={{
            backgroundColor: "var(--surface-card)",
            border: "2px solid var(--hairline)",
          }}
        >
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
              DAFTAR AKUN
            </h1>
          </div>

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

          <form
            onSubmit={handleSubmit}
            style={{ padding: "0 36px 32px", display: "flex", flexDirection: "column", gap: "18px" }}
          >
            {/* Nama Lengkap */}
            <div>
              <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
                NAMA LENGKAP
              </label>
              <input
                type="text"
                className="field-input"
                placeholder="Masukkan nama lengkap..."
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
                EMAIL
              </label>
              <input
                type="email"
                className="field-input"
                placeholder="contoh@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Nomor HP */}
            <div>
              <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
                NOMOR HP
              </label>
              <input
                type="tel"
                className="field-input"
                placeholder="08xx atau +628xx"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
                autoComplete="tel"
              />
              <p className="caption" style={{ color: "var(--muted)", marginTop: "6px" }}>
                Format: 08xx atau +628xx. Tidak dibagikan ke pihak lain.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  className="field-input"
                  placeholder="Minimal 8 karakter..."
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
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

              {/* Password strength indicator */}
              {form.password && (
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1, height: "3px",
                          backgroundColor: i < pwStrength
                            ? pwStrength === 1 ? "var(--m-red)" : pwStrength === 2 ? "var(--warning)" : "var(--success)"
                            : "var(--hairline)",
                          transition: "background-color 0.2s",
                        }}
                      />
                    ))}
                  </div>
                  {PASSWORD_RULES.map((r) => (
                    <p key={r.label} className="caption" style={{ margin: 0, color: r.test(form.password) ? "var(--success)" : "var(--muted)" }}>
                      {r.test(form.password) ? "+" : "-"} {r.label}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
                KONFIRMASI PASSWORD
              </label>
              <input
                type={showPw ? "text" : "password"}
                className="field-input"
                placeholder="Ulangi password..."
                value={form.confirm_password}
                onChange={(e) => update("confirm_password", e.target.value)}
                required
                autoComplete="new-password"
                style={{
                  borderColor: form.confirm_password && form.confirm_password !== form.password
                    ? "var(--m-red)" : undefined,
                }}
              />
              {form.confirm_password && form.confirm_password !== form.password && (
                <p className="caption" style={{ color: "var(--m-red)", marginTop: "6px" }}>
                  Password tidak cocok.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", marginTop: "4px", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "MENDAFTARKAN..." : "DAFTAR"}
            </button>

            <p className="body-sm" style={{ textAlign: "center", color: "var(--muted)", margin: 0 }}>
              Sudah punya akun?{" "}
              <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
                Masuk
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
