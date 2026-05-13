import Link from "next/link";

export default function TopNav() {
  return (
    <header className="h-16 bg-[var(--canvas)] text-[var(--primary)] px-6 flex items-center justify-between border-b border-[var(--hairline)]">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          {/* M Tricolor logic for logo */}
          <div className="flex h-4 w-6">
            <div className="flex-1 bg-[var(--m-blue-light)]"></div>
            <div className="flex-1 bg-[var(--m-blue-dark)]"></div>
            <div className="flex-1 bg-[var(--m-red)]"></div>
          </div>
          <span className="font-display font-bold text-xl tracking-wide uppercase">SafeRoute</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/" className="nav-link hover:text-white transition-colors">PETA INSIDEN</Link>
          <Link href="/route" className="nav-link hover:text-white transition-colors">CARI RUTE</Link>
          <Link href="/report" className="nav-link hover:text-white transition-colors">LAPOR WARGA</Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/admin" className="nav-link text-[var(--muted)] hover:text-white transition-colors">
          ADMIN
        </Link>
        <Link href="/login" className="btn-primary" style={{ padding: '8px 16px', height: '36px', fontSize: '12px' }}>
          LOGIN
        </Link>
      </div>
    </header>
  );
}
