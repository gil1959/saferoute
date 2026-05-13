import MapComponent from "@/components/map";

export default function Home() {
  return (
    <div className="relative flex-1 flex">
      {/* Background Map */}
      <MapComponent />
      
      {/* Floating UI Panel for Route Search (FR-001) */}
      <div className="absolute top-8 left-8 w-96 bg-[var(--surface-card)] border border-[var(--hairline)] flex flex-col z-10 shadow-2xl">
        <div className="p-6 border-b border-[var(--hairline)]">
          <h1 className="display-sm mb-2 text-white">SAFEROUTE</h1>
          <p className="body-sm text-[var(--muted)]">Navigasi cerdas, mengutamakan keselamatan Anda.</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="caption text-[var(--body)] block mb-2">LOKASI AWAL</label>
            <input 
              type="text" 
              className="w-full bg-[var(--surface-soft)] border border-[var(--hairline)] text-white body-md px-4 py-3 focus:outline-none focus:border-white transition-colors rounded-none"
              placeholder="Masukkan lokasi awal..."
            />
          </div>
          <div>
            <label className="caption text-[var(--body)] block mb-2">TUJUAN</label>
            <input 
              type="text" 
              className="w-full bg-[var(--surface-soft)] border border-[var(--hairline)] text-white body-md px-4 py-3 focus:outline-none focus:border-white transition-colors rounded-none"
              placeholder="Masukkan tujuan..."
            />
          </div>
          <button className="btn-primary w-full mt-4">
            CARI RUTE AMAN
          </button>
        </div>
        
        {/* Mock Result Panel */}
        <div className="p-6 bg-[var(--surface-soft)] border-t border-[var(--hairline)]">
          <h3 className="title-sm mb-4 text-white">RUTE TERBAIK</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="display-md text-[var(--success)]">24<span className="title-sm text-[var(--body)] ml-1">mnt</span></p>
              <p className="caption text-[var(--muted)] mt-1">12 km • 0 Insiden Dihindari</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-1 bg-[var(--success)]/20 text-[var(--success)] text-xs font-bold uppercase tracking-wider">
                PALING AMAN
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
