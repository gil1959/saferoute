"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORY_LABEL: Record<string, string> = {
  crime: "Tindak Kriminal",
  accident: "Kecelakaan Lalu Lintas",
  road_damage: "Jalan Rusak / Amblas",
  traffic: "Kemacetan Parah",
  other: "Lainnya",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--warning)",
  processing: "var(--m-blue-dark)",
  resolved: "var(--success)",
  rejected: "var(--m-red)",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Validasi",
  processing: "Sedang Diproses",
  resolved: "Selesai",
  rejected: "Ditolak",
};

interface Photo {
  photo_id: number;
  photo_url: string;
  mime_type: string;
}

interface Report {
  report_id: number;
  category: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  admin_notes: string | null;
  photos: Photo[];
}

export default function MyReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const [locationNames, setLocationNames] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.user) {
          router.push("/login?redirect=/my-reports");
          return;
        }
        return fetch("/api/reports");
      })
      .then((r) => (r && r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reports) setReports(data.reports);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  // Reverse geocode lokasi setelah laporan dimuat
  useEffect(() => {
    reports.forEach((rep) => {
      if (locationNames[rep.report_id]) return;
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${rep.latitude}&lon=${rep.longitude}&format=json&accept-language=id`,
        { headers: { "User-Agent": "SafeRoute-App/1.0" } }
      )
        .then((r) => r.json())
        .then((data) => {
          const road = data.address?.road || data.address?.neighbourhood || data.display_name?.split(",")[0] || "";
          const city = data.address?.city || data.address?.county || "";
          setLocationNames((prev) => ({
            ...prev,
            [rep.report_id]: [road, city].filter(Boolean).join(", ") || data.display_name?.substring(0, 60) || "Lokasi tidak dikenali",
          }));
        })
        .catch(() => {
          setLocationNames((prev) => ({
            ...prev,
            [rep.report_id]: `${rep.latitude.toFixed(4)}, ${rep.longitude.toFixed(4)}`,
          }));
        });
    });
  }, [reports]);

  const formatDate = (id: number) => {
    // Estimate from ID ordering (fallback)
    return `#${id}`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p className="caption" style={{ color: "var(--muted)", letterSpacing: "2px" }}>MEMUAT DATA...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p className="caption" style={{ color: "var(--muted)", margin: "0 0 4px", letterSpacing: "1.5px" }}>
          AKUN SAYA
        </p>
        <h1 className="display-sm" style={{ color: "var(--primary)", margin: "0 0 8px" }}>
          LAPORAN SAYA
        </h1>
        <p className="body-sm" style={{ color: "var(--muted)", margin: 0 }}>
          Pantau status dan detail laporan insiden yang telah Anda kirimkan.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "TOTAL", value: reports.length, color: "var(--primary)" },
          { label: "PENDING", value: reports.filter((r) => r.status === "pending").length, color: "var(--warning)" },
          { label: "DIPROSES", value: reports.filter((r) => r.status === "processing").length, color: "var(--m-blue-dark)" },
          { label: "SELESAI", value: reports.filter((r) => r.status === "resolved").length, color: "var(--success)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: "var(--surface-card)", border: "2px solid var(--hairline)", padding: "16px 20px" }}>
            <p className="caption" style={{ color: "var(--muted)", margin: "0 0 6px", letterSpacing: "1px" }}>{label}</p>
            <p style={{ color, margin: 0, fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {reports.length === 0 ? (
        <div style={{ backgroundColor: "var(--surface-card)", border: "2px solid var(--hairline)", padding: "60px", textAlign: "center" }}>
          <p className="label-uppercase" style={{ color: "var(--muted)", marginBottom: "8px" }}>Belum Ada Laporan</p>
          <p className="body-sm" style={{ color: "var(--muted)", margin: "0 0 24px" }}>
            Anda belum pernah mengirimkan laporan insiden.
          </p>
          <Link href="/report" className="btn-primary" style={{ padding: "12px 28px", textDecoration: "none", fontSize: "12px" }}>
            BUAT LAPORAN PERTAMA
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reports.map((rep) => (
            <div
              key={rep.report_id}
              style={{
                backgroundColor: "var(--surface-card)",
                border: "2px solid var(--hairline)",
                padding: "20px 24px",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--m-blue-dark)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}
              onClick={() => setSelected(rep)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        backgroundColor: "var(--surface-elevated)",
                        color: "var(--muted)",
                        padding: "2px 8px",
                      }}
                    >
                      {CATEGORY_LABEL[rep.category] || rep.category}
                    </span>
                    <span className="caption" style={{ color: "var(--muted)" }}>
                      RPT-{rep.report_id}
                    </span>
                  </div>
                  <p className="body-sm" style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {rep.title}
                  </p>
                  <p className="caption" style={{ margin: 0, color: "var(--muted)" }}>
                    {locationNames[rep.report_id] || "Memuat lokasi..."}
                  </p>
                  {rep.photos.length > 0 && (
                    <p className="caption" style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      {rep.photos.length} foto bukti
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      color: STATUS_COLOR[rep.status] || "var(--muted)",
                      padding: "4px 12px",
                      border: `1px solid ${STATUS_COLOR[rep.status] || "var(--hairline)"}`,
                      display: "block",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {STATUS_LABEL[rep.status] || rep.status}
                  </span>
                  <p className="caption" style={{ color: "var(--muted)", margin: "6px 0 0", fontSize: "11px" }}>
                    Klik untuk detail →
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "24px",
            overflowY: "auto",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              border: "2px solid var(--hairline)",
              width: "100%",
              maxWidth: "680px",
              marginTop: "40px",
            }}
          >
            {/* Modal header */}
            <div style={{ padding: "20px 24px", borderBottom: "2px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p className="caption" style={{ color: "var(--muted)", margin: "0 0 2px", letterSpacing: "1px" }}>
                  DETAIL LAPORAN · RPT-{selected.report_id}
                </p>
                <p className="body-sm" style={{ margin: 0, fontWeight: 700, color: "var(--primary)" }}>
                  {selected.title}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "22px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Status */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: STATUS_COLOR[selected.status], padding: "4px 12px", border: `1px solid ${STATUS_COLOR[selected.status]}` }}>
                  {STATUS_LABEL[selected.status]}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", padding: "4px 12px", border: "1px solid var(--hairline)" }}>
                  {CATEGORY_LABEL[selected.category]}
                </span>
              </div>

              {/* Lokasi */}
              <div style={{ backgroundColor: "var(--surface-soft)", border: "1px solid var(--hairline)", padding: "12px 16px", marginBottom: "16px" }}>
                <p className="caption" style={{ color: "var(--muted)", margin: "0 0 4px", letterSpacing: "0.5px" }}>LOKASI KEJADIAN</p>
                <p className="body-sm" style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--primary)" }}>
                  {locationNames[selected.report_id] || "Memuat nama lokasi..."}
                </p>
                <p className="caption" style={{ margin: 0, color: "var(--muted)", fontFamily: "monospace" }}>
                  {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
                </p>
              </div>

              {/* Deskripsi */}
              <div style={{ marginBottom: "20px" }}>
                <p className="caption" style={{ color: "var(--muted)", margin: "0 0 8px", letterSpacing: "0.5px" }}>DESKRIPSI KEJADIAN</p>
                <p className="body-sm" style={{ color: "var(--body)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {selected.description}
                </p>
              </div>

              {/* Admin notes */}
              {selected.admin_notes && (
                <div style={{ backgroundColor: "var(--surface-soft)", border: "1px solid var(--m-blue-dark)", padding: "12px 16px", marginBottom: "20px" }}>
                  <p className="caption" style={{ color: "var(--m-blue-dark)", margin: "0 0 6px", letterSpacing: "0.5px", fontWeight: 700 }}>CATATAN ADMIN</p>
                  <p className="body-sm" style={{ margin: 0, color: "var(--body)" }}>{selected.admin_notes}</p>
                </div>
              )}

              {/* Foto */}
              {selected.photos.length > 0 && (
                <div>
                  <p className="caption" style={{ color: "var(--muted)", margin: "0 0 12px", letterSpacing: "0.5px" }}>
                    FOTO BUKTI ({selected.photos.length} foto)
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px" }}>
                    {selected.photos.map((photo) => (
                      <a key={photo.photo_id} href={photo.photo_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={photo.photo_url}
                          alt="Foto bukti"
                          style={{ width: "100%", height: "120px", objectFit: "cover", border: "1px solid var(--hairline)", display: "block" }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selected.photos.length === 0 && (
                <p className="caption" style={{ color: "var(--muted)", fontStyle: "italic" }}>Tidak ada foto bukti dilampirkan.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
