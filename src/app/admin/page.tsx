import { ShieldCheck, AlertTriangle, MapPin, Database } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="flex-1 flex bg-[var(--surface-soft)]">
      {/* Sidebar Admin */}
      <div className="w-64 bg-[var(--surface-card)] border-r border-[var(--hairline)] flex flex-col">
        <div className="p-6 border-b border-[var(--hairline)]">
          <h2 className="label-uppercase text-[var(--muted)]">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[var(--surface-elevated)] text-white label-uppercase">
            <ShieldCheck className="w-5 h-5 text-[var(--m-blue-light)]" />
            Validasi Laporan
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-[var(--muted)] hover:text-white label-uppercase transition-colors">
            <MapPin className="w-5 h-5" />
            Kelola Insiden
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-[var(--muted)] hover:text-white label-uppercase transition-colors">
            <AlertTriangle className="w-5 h-5" />
            Analitik Rawan
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-[var(--muted)] hover:text-white label-uppercase transition-colors">
            <Database className="w-5 h-5" />
            Konfigurasi DB
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="display-sm text-white">VALIDASI LAPORAN</h1>
          <button className="btn-primary" style={{ padding: '8px 16px', height: '40px', fontSize: '12px' }}>
            EXPORT CSV
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[var(--surface-card)] p-6 border border-[var(--hairline)]">
            <p className="caption text-[var(--muted)] mb-2">LAPORAN PENDING</p>
            <p className="display-md text-[var(--warning)]">14</p>
          </div>
          <div className="bg-[var(--surface-card)] p-6 border border-[var(--hairline)]">
            <p className="caption text-[var(--muted)] mb-2">INSIDEN AKTIF (HARI INI)</p>
            <p className="display-md text-[var(--m-red)]">32</p>
          </div>
          <div className="bg-[var(--surface-card)] p-6 border border-[var(--hairline)]">
            <p className="caption text-[var(--muted)] mb-2">RUTE DIAMANKAN</p>
            <p className="display-md text-[var(--success)]">1.284</p>
          </div>
        </div>

        {/* Pending Reports Table Mock */}
        <div className="bg-[var(--surface-card)] border border-[var(--hairline)]">
          <div className="p-4 border-b border-[var(--hairline)] flex justify-between items-center">
            <h3 className="label-uppercase text-white">Menunggu Validasi</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--hairline)] bg-[var(--surface-soft)]">
                <th className="p-4 caption text-[var(--muted)]">TANGGAL</th>
                <th className="p-4 caption text-[var(--muted)]">KATEGORI</th>
                <th className="p-4 caption text-[var(--muted)]">PELAPOR</th>
                <th className="p-4 caption text-[var(--muted)]">BUKTI</th>
                <th className="p-4 caption text-[var(--muted)] text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--hairline)] hover:bg-[var(--surface-elevated)] transition-colors">
                <td className="p-4 body-sm text-white">13 Mei 2026 14:30</td>
                <td className="p-4 body-sm text-white"><span className="text-[var(--m-red)]">Kriminal</span></td>
                <td className="p-4 body-sm text-[var(--muted)]">user_823</td>
                <td className="p-4 body-sm text-[var(--m-blue-light)] underline cursor-pointer">Lihat (2 Foto)</td>
                <td className="p-4 text-right">
                  <button className="text-[var(--success)] label-uppercase mr-4 hover:underline">Approve</button>
                  <button className="text-[var(--m-red)] label-uppercase hover:underline">Reject</button>
                </td>
              </tr>
              <tr className="hover:bg-[var(--surface-elevated)] transition-colors">
                <td className="p-4 body-sm text-white">13 Mei 2026 14:15</td>
                <td className="p-4 body-sm text-white"><span className="text-[var(--warning)]">Jalan Rusak</span></td>
                <td className="p-4 body-sm text-[var(--muted)]">anon_91</td>
                <td className="p-4 body-sm text-[var(--m-blue-light)] underline cursor-pointer">Lihat (1 Foto)</td>
                <td className="p-4 text-right">
                  <button className="text-[var(--success)] label-uppercase mr-4 hover:underline">Approve</button>
                  <button className="text-[var(--m-red)] label-uppercase hover:underline">Reject</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
