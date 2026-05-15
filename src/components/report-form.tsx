"use client";

import { useState, useRef } from "react";

interface ToastProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

function Toast({ type, message, onClose }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "24px",
        zIndex: 9999,
        minWidth: "320px",
        maxWidth: "420px",
        backgroundColor: "var(--surface-card)",
        border: `2px solid ${type === "success" ? "var(--success)" : "var(--m-red)"}`,
        padding: "16px 20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        animation: "slideInRight 0.25s ease",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: type === "success" ? "var(--success)" : "var(--m-red)",
          marginTop: "5px",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <p
          className="body-sm"
          style={{
            margin: "0 0 4px",
            fontWeight: 700,
            color: type === "success" ? "var(--success)" : "var(--m-red)",
            fontSize: "12px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          {type === "success" ? "Laporan Terkirim" : "Gagal Mengirim"}
        </p>
        <p className="body-sm" style={{ margin: 0, color: "var(--primary)" }}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--muted)",
          fontSize: "16px",
          lineHeight: 1,
          padding: "0 0 0 8px",
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function ReportForm() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 6000);
  };

  const getLocation = () => {
    setLocating(true);
    setLocError("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocating(false);
        },
        () => {
          setLocError("Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.");
          setLocating(false);
        }
      );
    } else {
      setLocError("Browser Anda tidak mendukung geolokasi.");
      setLocating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) {
        showToast("error", "Maksimal 5 foto per laporan.");
        return;
      }
      setFiles([...files, ...newFiles]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      showToast("error", "Lokasi GPS wajib diaktifkan sebelum melapor.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("category", categoryRef.current?.value || "");
      fd.append("title", titleRef.current?.value || "");
      fd.append("description", descRef.current?.value || "");
      fd.append("lat", String(location.lat));
      fd.append("lng", String(location.lng));
      for (const f of files) fd.append("files", f);

      const res = await fetch("/api/reports", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || data.message || "Gagal mengirim laporan.");
      } else {
        setSubmitted(true);
        showToast("success", "Laporan berhasil dikirim dan menunggu validasi admin.");
      }
    } catch {
      showToast("error", "Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          backgroundColor: "var(--surface-card)",
          border: "2px solid var(--success)",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "var(--success)",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            color: "#fff",
          }}
        >
          ✓
        </div>
        <p
          className="display-sm"
          style={{ color: "var(--success)", margin: "0 0 8px", fontSize: "20px" }}
        >
          LAPORAN TERKIRIM
        </p>
        <p className="body-sm" style={{ color: "var(--muted)", margin: "0 0 24px" }}>
          Terima kasih! Laporan Anda sedang menunggu validasi dari tim admin SafeRoute.
        </p>
        <button
          onClick={() => { setSubmitted(false); setFiles([]); setLocation(null); }}
          className="btn-outline"
          style={{ fontSize: "12px", padding: "10px 24px" }}
        >
          BUAT LAPORAN BARU
        </button>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Judul */}
        <div>
          <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
            JUDUL LAPORAN
          </label>
          <input
            ref={titleRef}
            type="text"
            className="field-input"
            placeholder="Contoh: Kecelakaan di Jalan Sudirman..."
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        {/* Kategori */}
        <div>
          <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
            KATEGORI INSIDEN
          </label>
          <div style={{ position: "relative" }}>
            <select ref={categoryRef} className="field-select" required>
              <option value="">Pilih kategori...</option>
              <option value="crime">Tindak Kriminal</option>
              <option value="accident">Kecelakaan Lalu Lintas</option>
              <option value="road_damage">Jalan Rusak / Amblas</option>
              <option value="traffic">Kemacetan Parah</option>
              <option value="other">Lainnya</option>
            </select>
            <div style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "10px", color: "var(--muted)" }}>
              &#9660;
            </div>
          </div>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
            DESKRIPSI KEJADIAN
          </label>
          <textarea
            ref={descRef}
            className="field-textarea"
            placeholder="Jelaskan detail kejadian secara lengkap — waktu, kondisi, korban, dll..."
            required
            style={{ minHeight: "120px" }}
          />
        </div>

        {/* Lokasi GPS */}
        <div>
          <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
            LOKASI GPS
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "var(--surface-soft)", border: "2px solid var(--hairline)", padding: "12px 16px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: location ? "var(--success)" : locError ? "var(--m-red)" : "var(--muted)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              {locating ? (
                <span className="body-sm" style={{ color: "var(--muted)" }}>Mendeteksi lokasi...</span>
              ) : location ? (
                <span className="body-sm" style={{ color: "var(--primary)", fontFamily: "monospace", fontSize: "13px" }}>
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              ) : (
                <span className="body-sm" style={{ color: locError ? "var(--m-red)" : "var(--muted)" }}>
                  {locError || "Lokasi belum tersedia"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={getLocation}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: "var(--m-blue-dark)", textTransform: "uppercase", padding: "4px 0" }}
            >
              {locating ? "MENCARI..." : location ? "PERBARUI" : "DETEKSI"}
            </button>
          </div>
        </div>

        {/* Upload Foto */}
        <div>
          <label className="caption" style={{ display: "block", color: "var(--muted)", marginBottom: "8px", letterSpacing: "1px" }}>
            FOTO BUKTI (MAKS. 5 FOTO, @5MB)
          </label>
          <div style={{ border: "2px dashed var(--hairline-strong)", padding: "32px 16px", textAlign: "center", cursor: "pointer", position: "relative", backgroundColor: "var(--surface-soft)", transition: "border-color 0.15s ease" }}>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
            />
            <p className="label-uppercase" style={{ color: "var(--primary)", margin: 0, fontSize: "12px" }}>
              KLIK ATAU SERET FOTO KE SINI
            </p>
            <p className="caption" style={{ color: "var(--muted)", marginTop: "6px" }}>
              {files.length > 0 ? `${files.length} foto dipilih` : "Belum ada foto dipilih"}
            </p>
          </div>
          {files.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
              {files.map((f, i) => (
                <div key={i} style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--hairline)", padding: "4px 10px", fontSize: "11px", color: "var(--muted)" }}>
                  {f.name.length > 20 ? f.name.substring(0, 20) + "..." : f.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !location}
          className="btn-primary"
          style={{ width: "100%", marginTop: "4px", opacity: isSubmitting || !location ? 0.45 : 1, cursor: isSubmitting || !location ? "not-allowed" : "pointer" }}
        >
          {isSubmitting ? "MENGIRIM LAPORAN..." : "KIRIM LAPORAN"}
        </button>

        {!location && (
          <p className="caption" style={{ color: "var(--muted)", textAlign: "center", marginTop: "-8px" }}>
            Aktifkan GPS untuk mengirim laporan.{" "}
            <button type="button" onClick={getLocation} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--m-blue-dark)", fontWeight: 700, fontSize: "12px", letterSpacing: "0.5px", padding: 0 }}>
              Deteksi sekarang
            </button>
          </p>
        )}
      </form>
    </>
  );
}
