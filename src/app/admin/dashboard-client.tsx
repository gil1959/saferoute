"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const MENU = [
  { id: "overview", label: "Overview" },
  { id: "reports", label: "Validasi Laporan" },
  { id: "incidents", label: "Kelola Insiden" },
  { id: "users", label: "Pengguna" },
  { id: "config", label: "Konfigurasi" },
];

const STATS = [
  { label: "LAPORAN PENDING", value: "14", sub: "menunggu validasi", color: "var(--warning)" },
  { label: "INSIDEN AKTIF", value: "32", sub: "hari ini", color: "var(--m-red)" },
  { label: "PENGGUNA TERDAFTAR", value: "218", sub: "total akun", color: "var(--m-blue-dark)" },
  { label: "RUTE AMAN DIHITUNG", value: "1.284", sub: "bulan ini", color: "var(--success)" },
];

const SEVERITY_COLOR: Record<string, string> = {
  low: "var(--success)",
  medium: "var(--warning)",
  high: "#e07b00",
  critical: "var(--m-red)",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--warning)",
  processing: "var(--m-blue-dark)",
  resolved: "var(--success)",
  rejected: "var(--m-red)",
};

export default function AdminDashboardClient({ 
  adminName,
  initialIncidents = [],
  initialUsers = [],
  initialReports = []
}: { 
  adminName: string;
  initialIncidents?: any[];
  initialUsers?: any[];
  initialReports?: any[];
}) {
  const router = useRouter();
  const [active, setActive] = useState("overview");
  const [incidentFilter, setIncidentFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [locationNames, setLocationNames] = useState<Record<number, string>>({});
  const [reports, setReports] = useState<any[]>(initialReports);
  const [incidents, setIncidents] = useState<any[]>(initialIncidents);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pendingReports = initialReports.filter(r => r.status === "pending").length;
  const activeIncidentsCount = initialIncidents.filter(i => i.status === "active").length;
  const totalUsers = initialUsers.length;

  // Reverse geocode lokasi laporan
  useEffect(() => {
    initialReports.forEach((rep) => {
      if (!rep.latitude || locationNames[rep.report_id]) return;
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${rep.latitude}&lon=${rep.longitude}&format=json&accept-language=id`,
        { headers: { "User-Agent": "SafeRoute-App/1.0" } }
      )
        .then((r) => r.json())
        .then((data) => {
          const road = data.address?.road || data.address?.neighbourhood || "";
          const city = data.address?.city || data.address?.county || "";
          setLocationNames((prev) => ({
            ...prev,
            [rep.report_id]: [road, city].filter(Boolean).join(", ") || data.display_name?.substring(0, 50) || "Tidak diketahui",
          }));
        })
        .catch(() => {
          setLocationNames((prev) => ({ ...prev, [rep.report_id]: `${rep.latitude?.toFixed(4)}, ${rep.longitude?.toFixed(4)}` }));
        });
    });
  }, [initialReports]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleReportAction = async (reportId: number, action: "approved" | "rejected") => {
    setActionLoading(`${reportId}-${action}`);
    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId, action }),
      });
      if (res.ok) {
        const newStatus = action === "approved" ? "resolved" : "rejected";
        setReports((prev) =>
          prev.map((r) =>
            r.report_id === reportId ? { ...r, status: newStatus } : r
          )
        );
        if (selectedReport?.report_id === reportId) {
          setSelectedReport((prev: any) => ({ ...prev, status: newStatus }));
        }
        // Refresh incidents list dari server jika approved
        if (action === "approved") {
          const adminIncRes = await fetch("/api/admin/incidents");
          if (adminIncRes.ok) {
            const adminData = await adminIncRes.json();
            if (adminData.incidents) {
              setIncidents(adminData.incidents.map((i: any) => ({
                ...i,
                latitude: Number(i.latitude),
                longitude: Number(i.longitude),
              })));
            }
          }
        }
      }
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
    <div style={{ flex: 1, display: "flex", backgroundColor: "var(--surface-soft)", minHeight: 0 }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          backgroundColor: "var(--surface-card)",
          borderRight: "2px solid var(--hairline)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Sidebar header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "2px solid var(--hairline)" }}>
          <p className="caption" style={{ color: "var(--muted)", margin: "0 0 4px", letterSpacing: "1.5px" }}>
            ADMIN PANEL
          </p>
          <p className="body-sm" style={{ margin: 0, color: "var(--primary)", fontWeight: 700, fontSize: "13px" }}>
            {adminName}
          </p>
        </div>

        {/* Nav menu */}
        <nav style={{ flex: 1, padding: "10px 0" }}>
          {MENU.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "11px 20px",
                color: active === id ? "var(--primary)" : "var(--muted)",
                backgroundColor: active === id ? "var(--surface-elevated)" : "transparent",
                borderTop: "none",
                borderRight: "none",
                borderBottom: "none",
                borderLeftWidth: "3px",
                borderLeftStyle: "solid",
                borderLeftColor: active === id ? "var(--m-blue-dark)" : "transparent",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: active === id ? 700 : 400,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "16px 20px", borderTop: "2px solid var(--hairline)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "transparent",
              border: "2px solid var(--hairline)",
              color: "var(--muted)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--m-red)";
              (e.currentTarget as HTMLElement).style.color = "var(--m-red)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--hairline)";
              (e.currentTarget as HTMLElement).style.color = "var(--muted)";
            }}
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>

        {/* ===== OVERVIEW ===== */}
        {active === "overview" && (
          <div>
            <div style={{ marginBottom: "28px" }}>
              <p className="caption" style={{ color: "var(--muted)", margin: "0 0 4px", letterSpacing: "1.5px" }}>
                SAFEROUTE ADMIN
              </p>
              <h1 className="display-sm" style={{ color: "var(--primary)", margin: 0 }}>
                OVERVIEW
              </h1>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
              {[
                { label: "LAPORAN PENDING", value: pendingReports, sub: "menunggu validasi", color: "var(--warning)" },
                { label: "INSIDEN AKTIF", value: activeIncidentsCount, sub: "total db", color: "var(--m-red)" },
                { label: "PENGGUNA TERDAFTAR", value: totalUsers, sub: "total akun", color: "var(--m-blue-dark)" },
                { label: "RUTE AMAN DIHITUNG", value: "1.284", sub: "bulan ini", color: "var(--success)" },
              ].map(({ label, value, sub, color }) => (
                <div
                  key={label}
                  style={{
                    backgroundColor: "var(--surface-card)",
                    border: "2px solid var(--hairline)",
                    padding: "20px 24px",
                  }}
                >
                  <p className="caption" style={{ color: "var(--muted)", margin: "0 0 8px", letterSpacing: "1px" }}>
                    {label}
                  </p>
                  <p style={{ color, margin: "0 0 4px", fontSize: "32px", fontWeight: 700, lineHeight: 1 }}>
                    {value}
                  </p>
                  <p className="caption" style={{ color: "var(--muted)", margin: 0 }}>
                    {sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Two-column: recent reports + incidents */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Recent Reports */}
              <div style={{ backgroundColor: "var(--surface-card)", border: "2px solid var(--hairline)" }}>
                <div style={{ padding: "14px 20px", borderBottom: "2px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p className="label-uppercase" style={{ color: "var(--primary)", margin: 0, fontSize: "12px" }}>
                    Laporan Terbaru
                  </p>
                  <button
                    onClick={() => setActive("reports")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--m-blue-dark)", fontWeight: 700, letterSpacing: "0.5px" }}
                  >
                    LIHAT SEMUA
                  </button>
                </div>
                {initialReports.slice(0, 5).map((r) => (
                  <div
                    key={r.report_id}
                    style={{ padding: "12px 20px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", gap: "12px" }}
                  >
                    <span className="caption" style={{ color: "var(--muted)", minWidth: "44px" }}>—</span>
                    <div style={{ flex: 1 }}>
                      <p className="body-sm" style={{ margin: "0 0 2px", fontWeight: 700, color: "var(--primary)" }}>{r.category}</p>
                      <p className="caption" style={{ margin: 0, color: "var(--muted)" }}>{r.description}</p>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        color: STATUS_COLOR[r.status] || "var(--muted)",
                        padding: "2px 8px",
                        border: `1px solid ${STATUS_COLOR[r.status] || "var(--hairline)"}`,
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Active Incidents */}
              <div style={{ backgroundColor: "var(--surface-card)", border: "2px solid var(--hairline)" }}>
                <div style={{ padding: "14px 20px", borderBottom: "2px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p className="label-uppercase" style={{ color: "var(--primary)", margin: 0, fontSize: "12px" }}>
                    Insiden Aktif
                  </p>
                  <button
                    onClick={() => setActive("incidents")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--m-blue-dark)", fontWeight: 700, letterSpacing: "0.5px" }}
                  >
                    KELOLA
                  </button>
                </div>
                {initialIncidents.slice(0, 5).map((inc) => (
                  <div
                    key={inc.incident_id}
                    style={{ padding: "14px 20px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", gap: "12px" }}
                  >
                    <div
                      style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: SEVERITY_COLOR[inc.severity] || "var(--muted)", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p className="body-sm" style={{ margin: "0 0 2px", fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {inc.title}
                      </p>
                      <p className="caption" style={{ margin: 0, color: "var(--muted)" }}>
                        {inc.source} · {inc.expires_at ? `Berakhir ${formatDate(inc.expires_at)}` : 'Tanpa batas'}
                      </p>
                    </div>
                    <span className="caption" style={{ color: SEVERITY_COLOR[inc.severity] || "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>
                      {inc.severity}
                    </span>
                  </div>
                ))}

                {/* Activity bar chart dummy */}
                <div style={{ padding: "16px 20px" }}>
                  <p className="caption" style={{ color: "var(--muted)", margin: "0 0 12px", letterSpacing: "0.5px" }}>
                    INSIDEN PER JAM (HARI INI)
                  </p>
                  <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "56px" }}>
                    {[2, 1, 0, 3, 5, 4, 8, 12, 10, 7, 6, 9].map((v, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: `${(v / 12) * 100}%`,
                          backgroundColor: i === 11 ? "var(--m-blue-dark)" : "var(--hairline)",
                          minHeight: "2px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== VALIDASI LAPORAN ===== */}
        {active === "reports" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <div>
                <p className="caption" style={{ color: "var(--muted)", margin: "0 0 4px", letterSpacing: "1.5px" }}>ADMIN PANEL</p>
                <h1 className="display-sm" style={{ color: "var(--primary)", margin: 0 }}>VALIDASI LAPORAN</h1>
              </div>
              <button className="btn-outline" style={{ padding: "10px 20px", height: "40px", fontSize: "12px" }}>
                EXPORT CSV
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "PENDING", value: reports.filter(r => r.status === "pending").length, color: "var(--warning)" },
                { label: "DIPROSES", value: reports.filter(r => r.status === "processing").length, color: "var(--m-blue-dark)" },
                { label: "SELESAI", value: reports.filter(r => r.status === "resolved").length, color: "var(--success)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ backgroundColor: "var(--surface-card)", border: "2px solid var(--hairline)", padding: "16px 20px" }}>
                  <p className="caption" style={{ color: "var(--muted)", margin: "0 0 6px", letterSpacing: "1px" }}>{label}</p>
                  <p style={{ color, margin: 0, fontSize: "28px", fontWeight: 700 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ backgroundColor: "var(--surface-card)", border: "2px solid var(--hairline)" }}>
              <div style={{ padding: "14px 20px", borderBottom: "2px solid var(--hairline)" }}>
                <p className="label-uppercase" style={{ color: "var(--primary)", margin: 0, fontSize: "12px" }}>
                  Menunggu Validasi
                </p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--surface-soft)", borderBottom: "2px solid var(--hairline)" }}>
                    {["ID", "KATEGORI", "JUDUL", "LOKASI", "PELAPOR", "STATUS", "AKSI"].map((col, i) => (
                      <th key={col} className="caption" style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.8px", textAlign: i === 6 ? "right" : "left" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((row) => (
                    <tr
                      key={row.report_id}
                      style={{ borderBottom: "1px solid var(--hairline)", cursor: "pointer" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-soft)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                      onClick={() => setSelectedReport(row)}
                    >
                      <td className="caption" style={{ padding: "13px 16px", color: "var(--muted)", fontFamily: "monospace" }}>RPT-{row.report_id}</td>
                      <td className="body-sm" style={{ padding: "13px 16px", fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap" }}>{row.category}</td>
                      <td className="body-sm" style={{ padding: "13px 16px", color: "var(--body)", maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.title || row.description}</td>
                      <td className="caption" style={{ padding: "13px 16px", color: "var(--muted)", maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{locationNames[row.report_id] || "Memuat..."}</td>
                      <td className="caption" style={{ padding: "13px 16px", color: "var(--muted)" }}>{row.user?.username || "Anonim"}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: STATUS_COLOR[row.status] || "var(--muted)", padding: "2px 8px", border: `1px solid ${STATUS_COLOR[row.status] || "var(--hairline)"}` }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "right" }}>
                        {row.status === "pending" ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReportAction(row.report_id, "approved"); }}
                              disabled={actionLoading !== null}
                              style={{ background: "none", border: "none", cursor: actionLoading ? "wait" : "pointer", color: "var(--success)", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginRight: "14px", opacity: actionLoading ? 0.5 : 1 }}
                            >
                              {actionLoading === `${row.report_id}-approved` ? "..." : "APPROVE"}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReportAction(row.report_id, "rejected"); }}
                              disabled={actionLoading !== null}
                              style={{ background: "none", border: "none", cursor: actionLoading ? "wait" : "pointer", color: "var(--m-red)", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", opacity: actionLoading ? 0.5 : 1 }}
                            >
                              {actionLoading === `${row.report_id}-rejected` ? "..." : "REJECT"}
                            </button>
                          </>
                        ) : (
                          <span className="caption" style={{ color: "var(--muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== KELOLA INSIDEN ===== */}
        {active === "incidents" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <div>
                <p className="caption" style={{ color: "var(--muted)", margin: "0 0 4px", letterSpacing: "1.5px" }}>ADMIN PANEL</p>
                <h1 className="display-sm" style={{ color: "var(--primary)", margin: 0 }}>KELOLA INSIDEN</h1>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <select 
                  value={incidentFilter}
                  onChange={(e) => setIncidentFilter(e.target.value)}
                  style={{
                    backgroundColor: "var(--surface-soft)",
                    color: "var(--primary)",
                    border: "2px solid var(--hairline)",
                    padding: "10px 16px",
                    fontWeight: 700,
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">Semua Sumber</option>
                  <option value="tomtom">TomTom</option>
                  <option value="scraping">Scraping (RSS)</option>
                  <option value="crowdsource">Laporan Warga</option>
                  <option value="admin">Sistem Admin</option>
                </select>
                <button className="btn-primary" style={{ padding: "10px 20px", height: "40px", fontSize: "12px" }}>
                  + TAMBAH INSIDEN
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: "var(--surface-card)", border: "2px solid var(--hairline)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--surface-soft)", borderBottom: "2px solid var(--hairline)" }}>
                    {["ID", "KATEGORI", "SEVERITY", "LOKASI", "SUMBER", "STATUS", "BERAKHIR"].map((col) => (
                      <th key={col} className="caption" style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.8px", textAlign: "left" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(incidentFilter === "all" ? incidents : incidents.filter(i => i.source === incidentFilter)).map((inc) => (
                    <tr
                      key={inc.incident_id}
                      style={{ borderBottom: "1px solid var(--hairline)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-soft)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                    >
                      <td className="caption" style={{ padding: "13px 16px", color: "var(--muted)", fontFamily: "monospace" }}>INC-{inc.incident_id}</td>
                      <td className="body-sm" style={{ padding: "13px 16px", fontWeight: 700, color: "var(--primary)", maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inc.title}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: SEVERITY_COLOR[inc.severity] || "var(--muted)" }}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="body-sm" style={{ padding: "13px 16px", color: "var(--body)" }}>{Number(inc.latitude).toFixed(4)}, {Number(inc.longitude).toFixed(4)}</td>
                      <td className="caption" style={{ padding: "13px 16px", color: "var(--muted)" }}>
                        <span style={{ 
                          padding: "2px 6px", 
                          backgroundColor: inc.source === "scraping" ? "var(--m-blue-dark)" : "var(--surface-elevated)", 
                          color: inc.source === "scraping" ? "#fff" : "var(--muted)",
                          borderRadius: "4px"
                        }}>
                          {inc.source}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: inc.status === "active" ? "var(--success)" : "var(--muted)" }}>
                          {inc.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="caption" style={{ padding: "13px 16px", color: "var(--muted)" }}>{inc.expires_at ? formatDate(inc.expires_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== PENGGUNA ===== */}
        {active === "users" && (
          <div>
            <div style={{ marginBottom: "28px" }}>
              <p className="caption" style={{ color: "var(--muted)", margin: "0 0 4px", letterSpacing: "1.5px" }}>ADMIN PANEL</p>
              <h1 className="display-sm" style={{ color: "var(--primary)", margin: 0 }}>PENGGUNA</h1>
            </div>
            <div style={{ backgroundColor: "var(--surface-card)", border: "2px solid var(--hairline)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--surface-soft)", borderBottom: "2px solid var(--hairline)" }}>
                    {["ID", "NAMA LENGKAP", "USERNAME", "EMAIL", "ROLE", "STATUS", "AKSI"].map((col) => (
                      <th key={col} className="caption" style={{ padding: "12px 16px", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.8px", textAlign: "left" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {initialUsers.map((u) => (
                    <tr
                      key={u.user_id}
                      style={{ borderBottom: "1px solid var(--hairline)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-soft)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                    >
                      <td className="caption" style={{ padding: "13px 16px", color: "var(--muted)", fontFamily: "monospace" }}>USR-{u.user_id}</td>
                      <td className="body-sm" style={{ padding: "13px 16px", fontWeight: 700, color: "var(--primary)" }}>{u.full_name}</td>
                      <td className="body-sm" style={{ padding: "13px 16px", color: "var(--body)" }}>@{u.username}</td>
                      <td className="caption" style={{ padding: "13px 16px", color: "var(--muted)" }}>{u.email}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: u.role === "admin" ? "var(--m-blue-dark)" : "var(--muted)", padding: "2px 8px", border: `1px solid ${u.role === "admin" ? "var(--m-blue-dark)" : "var(--hairline)"}` }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: u.is_active ? "var(--success)" : "var(--m-red)" }}>
                          {u.is_active ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>
                          EDIT
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== KONFIGURASI ===== */}
        {active === "config" && (
          <div>
            <div style={{ marginBottom: "28px" }}>
              <p className="caption" style={{ color: "var(--muted)", margin: "0 0 4px", letterSpacing: "1.5px" }}>ADMIN PANEL</p>
              <h1 className="display-sm" style={{ color: "var(--primary)", margin: 0 }}>KONFIGURASI</h1>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { key: "Penalty Score Default", value: "10", type: "Routing" },
                { key: "Danger Radius Default (m)", value: "50", type: "Routing" },
                { key: "Expiry Insiden (jam)", value: "24", type: "Routing" },
                { key: "TomTom Poll Interval (menit)", value: "30", type: "Ingestion" },
              ].map(({ key, value, type }) => (
                <div
                  key={key}
                  style={{
                    backgroundColor: "var(--surface-card)",
                    border: "2px solid var(--hairline)",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p className="body-sm" style={{ margin: "0 0 2px", fontWeight: 700, color: "var(--primary)" }}>{key}</p>
                    <p className="caption" style={{ margin: 0, color: "var(--muted)" }}>Kategori: {type}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      defaultValue={value}
                      style={{
                        width: "80px",
                        padding: "8px 12px",
                        border: "2px solid var(--hairline)",
                        backgroundColor: "var(--surface-soft)",
                        color: "var(--primary)",
                        fontWeight: 700,
                        fontSize: "14px",
                        textAlign: "center",
                      }}
                    />
                    <button className="btn-outline" style={{ padding: "8px 16px", fontSize: "11px", height: "36px" }}>
                      SIMPAN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>

    {/* ===== MODAL DETAIL LAPORAN ===== */}
    {selectedReport && (
      <div
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px", overflowY: "auto" }}
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedReport(null); }}
      >
        <div style={{ backgroundColor: "var(--surface-card)", border: "2px solid var(--hairline)", width: "100%", maxWidth: "700px", marginTop: "40px" }}>
          {/* Header */}
          <div style={{ padding: "20px 24px", borderBottom: "2px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="caption" style={{ color: "var(--muted)", margin: "0 0 2px", letterSpacing: "1px" }}>DETAIL LAPORAN · RPT-{selectedReport.report_id}</p>
              <p className="body-sm" style={{ margin: 0, fontWeight: 700, color: "var(--primary)" }}>{selectedReport.title || selectedReport.description?.substring(0, 60)}</p>
            </div>
            <button onClick={() => setSelectedReport(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "22px", lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Status + Kategori */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: STATUS_COLOR[selectedReport.status] || "var(--muted)", padding: "4px 12px", border: `1px solid ${STATUS_COLOR[selectedReport.status] || "var(--hairline)"}` }}>
                {selectedReport.status}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", padding: "4px 12px", border: "1px solid var(--hairline)" }}>
                {selectedReport.category}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", padding: "4px 12px", border: "1px solid var(--hairline)" }}>
                Pelapor: {selectedReport.user?.username || "Anonim"}
              </span>
            </div>

            {/* Lokasi */}
            <div style={{ backgroundColor: "var(--surface-soft)", border: "1px solid var(--hairline)", padding: "12px 16px" }}>
              <p className="caption" style={{ color: "var(--muted)", margin: "0 0 4px", letterSpacing: "0.5px" }}>LOKASI KEJADIAN</p>
              <p className="body-sm" style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--primary)" }}>
                {locationNames[selectedReport.report_id] || "Memuat nama lokasi..."}
              </p>
              <p className="caption" style={{ margin: 0, color: "var(--muted)", fontFamily: "monospace" }}>
                {selectedReport.latitude?.toFixed(6)}, {selectedReport.longitude?.toFixed(6)}
              </p>
            </div>

            {/* Deskripsi */}
            <div>
              <p className="caption" style={{ color: "var(--muted)", margin: "0 0 8px", letterSpacing: "0.5px" }}>DESKRIPSI KEJADIAN</p>
              <p className="body-sm" style={{ color: "var(--body)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selectedReport.description}</p>
            </div>

            {/* Foto bukti */}
            {selectedReport.photos && selectedReport.photos.length > 0 ? (
              <div>
                <p className="caption" style={{ color: "var(--muted)", margin: "0 0 12px", letterSpacing: "0.5px" }}>FOTO BUKTI ({selectedReport.photos.length} foto)</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px" }}>
                  {selectedReport.photos.map((photo: any) => (
                    <a key={photo.photo_id} href={photo.photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={photo.photo_url} alt="Foto bukti" style={{ width: "100%", height: "120px", objectFit: "cover", border: "1px solid var(--hairline)", display: "block" }} />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p className="caption" style={{ color: "var(--muted)", fontStyle: "italic" }}>Tidak ada foto bukti dilampirkan.</p>
            )}

            {/* Aksi */}
            {selectedReport.status === "pending" && (
              <div style={{ display: "flex", gap: "12px", paddingTop: "8px", borderTop: "1px solid var(--hairline)" }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, fontSize: "12px", opacity: actionLoading ? 0.5 : 1 }}
                  disabled={actionLoading !== null}
                  onClick={() => handleReportAction(selectedReport.report_id, "approved")}
                >
                  {actionLoading === `${selectedReport.report_id}-approved` ? "MEMPROSES..." : "APPROVE LAPORAN"}
                </button>
                <button
                  className="btn-outline"
                  style={{ flex: 1, fontSize: "12px", borderColor: "var(--m-red)", color: "var(--m-red)", opacity: actionLoading ? 0.5 : 1 }}
                  disabled={actionLoading !== null}
                  onClick={() => handleReportAction(selectedReport.report_id, "rejected")}
                >
                  {actionLoading === `${selectedReport.report_id}-rejected` ? "MEMPROSES..." : "REJECT LAPORAN"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
