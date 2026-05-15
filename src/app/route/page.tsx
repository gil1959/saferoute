export default function RoutePage() {
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
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          backgroundColor: "var(--surface-card)",
          border: "2px solid var(--hairline)",
        }}
      >
        <div className="m-stripe-divider" />
        <div style={{ padding: "40px 36px" }}>
          <p className="caption" style={{ margin: "0 0 6px", color: "var(--muted)", letterSpacing: "2px" }}>
            SAFEROUTE
          </p>
          <h1 className="display-sm" style={{ margin: "0 0 16px", color: "var(--primary)" }}>
            CARI RUTE AMAN
          </h1>
          <p className="body-md" style={{ color: "var(--body)", margin: "0 0 28px", lineHeight: 1.7 }}>
            Fitur pencarian rute berbasis keselamatan sedang dalam pengembangan.
            Algoritma SafeRoute akan menganalisis insiden aktif di sepanjang jalur
            dan merekomendasikan rute dengan risiko terendah.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            {[
              { label: "Analisis insiden real-time", status: "Dalam Pengembangan" },
              { label: "Penalty score per rute", status: "Dalam Pengembangan" },
              { label: "Rute alternatif aman", status: "Dalam Pengembangan" },
              { label: "Estimasi waktu tempuh", status: "Dalam Pengembangan" },
            ].map(({ label, status }) => (
              <div
                key={label}
                style={{
                  padding: "16px",
                  backgroundColor: "var(--surface-soft)",
                  border: "2px solid var(--hairline)",
                }}
              >
                <p className="label-uppercase" style={{ margin: "0 0 4px", fontSize: "11px", color: "var(--primary)" }}>
                  {label}
                </p>
                <p className="caption" style={{ margin: 0, color: "var(--warning)" }}>
                  {status}
                </p>
              </div>
            ))}
          </div>

          <a href="/" className="btn-outline" style={{ display: "inline-block" }}>
            KEMBALI KE PETA INSIDEN
          </a>
        </div>
      </div>
    </div>
  );
}
