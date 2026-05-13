"use client";

import { useState, useEffect } from "react";
import { Camera, MapPin, Loader2 } from "lucide-react";

export default function ReportForm() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Auto-capture GPS on mount as per FR-003
    getLocation();
  }, []);

  const getLocation = () => {
    setLocating(true);
    setLocError("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocating(false);
        },
        (error) => {
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
        alert("Maksimal 5 foto.");
        return;
      }
      setFiles([...files, ...newFiles]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert("Lokasi GPS wajib diaktifkan sebelum melapor.");
      return;
    }
    
    setIsSubmitting(true);
    // TODO: Implement actual API call to /api/reports with FormData
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Laporan berhasil dikirim. Menunggu validasi admin.");
      // Redirect to /tracking logic here
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="caption text-[var(--body)] block mb-2">KATEGORI INSIDEN</label>
        <select 
          className="w-full bg-[var(--surface-soft)] border border-[var(--hairline)] text-white body-md px-4 py-3 focus:outline-none focus:border-white transition-colors rounded-none appearance-none"
          required
        >
          <option value="">Pilih Kategori...</option>
          <option value="crime">Tindak Kriminal / Kejahatan</option>
          <option value="accident">Kecelakaan Lalu Lintas</option>
          <option value="road_damage">Jalan Rusak / Amblas</option>
          <option value="traffic">Kemacetan Parah</option>
          <option value="other">Lainnya</option>
        </select>
      </div>

      <div>
        <label className="caption text-[var(--body)] block mb-2">DESKRIPSI KEJADIAN</label>
        <textarea 
          className="w-full bg-[var(--surface-soft)] border border-[var(--hairline)] text-white body-md px-4 py-3 focus:outline-none focus:border-white transition-colors rounded-none min-h-[120px]"
          placeholder="Jelaskan detail kejadian..."
          required
        ></textarea>
      </div>

      <div>
        <label className="caption text-[var(--body)] block mb-2">LOKASI (OTOMATIS)</label>
        <div className="flex items-center gap-4 bg-[var(--surface-soft)] border border-[var(--hairline)] p-4">
          <MapPin className="text-[var(--m-red)] w-6 h-6" />
          <div className="flex-1">
            {locating ? (
              <span className="body-md text-[var(--muted)]">Sedang mendeteksi lokasi...</span>
            ) : location ? (
              <span className="body-md text-white font-mono">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
            ) : (
              <span className="body-md text-[var(--warning)]">{locError || "Lokasi belum tersedia"}</span>
            )}
          </div>
          <button 
            type="button" 
            onClick={getLocation}
            className="text-[var(--m-blue-light)] hover:text-[var(--m-blue-dark)] caption transition-colors"
          >
            REFRESH LOKASI
          </button>
        </div>
      </div>

      <div>
        <label className="caption text-[var(--body)] block mb-2">FOTO BUKTI (MAKS. 5, @5MB)</label>
        <div className="border-2 border-dashed border-[var(--hairline)] p-8 text-center cursor-pointer hover:border-[var(--body)] transition-colors relative">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Camera className="mx-auto text-[var(--muted)] w-8 h-8 mb-4" />
          <p className="body-md text-white">Klik atau seret foto ke sini</p>
          <p className="caption text-[var(--muted)] mt-2">{files.length} foto terpilih</p>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting || !location}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            MENGIRIM...
          </>
        ) : (
          "KIRIM LAPORAN"
        )}
      </button>
    </form>
  );
}
