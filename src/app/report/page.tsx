import ReportForm from "@/components/report-form";

export default function ReportPage() {
  return (
    <div className="flex-1 flex justify-center py-16 px-4">
      <div className="w-full max-w-2xl bg-[var(--surface-card)] border border-[var(--hairline)] p-8 shadow-2xl">
        <h1 className="display-sm mb-2 text-white">LAPOR INSIDEN</h1>
        <p className="body-sm text-[var(--muted)] mb-8">
          Laporkan kejadian atau kerusakan jalan di sekitar Anda. Koordinat GPS Anda akan terdeteksi otomatis.
        </p>
        
        <ReportForm />
      </div>
    </div>
  );
}
