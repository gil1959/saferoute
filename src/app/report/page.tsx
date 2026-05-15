import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import ReportForm from "@/components/report-form";

export default async function ReportPage() {
  // Auth guard — harus login
  const cookieStore = await cookies();
  const token = cookieStore.get("sr_session")?.value;
  let session = null;
  if (token) {
    session = await verifyToken(token);
  }
  if (!session) {
    redirect("/login?redirect=/report");
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "48px 16px",
        backgroundColor: "var(--canvas)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          backgroundColor: "var(--surface-card)",
          border: "2px solid var(--hairline)",
        }}
      >
        <div className="m-stripe-divider" />

        {/* Header */}
        <div
          style={{
            padding: "28px 32px 22px",
            borderBottom: "2px solid var(--hairline)",
          }}
        >
          <p className="caption" style={{ margin: "0 0 4px", color: "var(--muted)", letterSpacing: "1.5px" }}>
            SAFEROUTE
          </p>
          <h1
            className="display-sm"
            style={{ color: "var(--primary)", margin: 0, marginBottom: "8px" }}
          >
            LAPOR INSIDEN
          </h1>
          <p className="body-sm" style={{ color: "var(--muted)", margin: 0 }}>
            Laporkan kejadian atau kondisi jalan berbahaya. Koordinat GPS terdeteksi otomatis.
            Laporan divalidasi admin sebelum ditampilkan di peta.
          </p>
        </div>

        {/* Badge pelapor */}
        <div
          style={{
            padding: "12px 32px",
            backgroundColor: "var(--surface-soft)",
            borderBottom: "2px solid var(--hairline)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--success)",
              flexShrink: 0,
            }}
          />
          <p className="caption" style={{ margin: 0, color: "var(--muted)" }}>
            Masuk sebagai{" "}
            <strong style={{ color: "var(--primary)" }}>{session.name}</strong>
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "28px 32px" }}>
          <ReportForm />
        </div>
      </div>
    </div>
  );
}
