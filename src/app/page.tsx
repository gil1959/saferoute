"use client";

import { useState, useEffect } from "react";
import MapComponent from "@/components/map";

export default function Home() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeData, setRouteData] = useState<any>(null);

  const [activeInput, setActiveInput] = useState<"origin" | "destination" | null>(null);
  
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [isTypingOrigin, setIsTypingOrigin] = useState(false);
  const [isTypingDest, setIsTypingDest] = useState(false);

  // Autocomplete fetcher
  useEffect(() => {
    if (!isTypingOrigin || origin.length < 3) {
      setOriginSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin + ", Indonesia")}&format=json&limit=5&countrycodes=id`);
        const data = await res.json();
        setOriginSuggestions(data || []);
      } catch (err) {}
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [origin, isTypingOrigin]);

  useEffect(() => {
    if (!isTypingDest || destination.length < 3) {
      setDestSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination + ", Indonesia")}&format=json&limit=5&countrycodes=id`);
        const data = await res.json();
        setDestSuggestions(data || []);
      } catch (err) {}
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [destination, isTypingDest]);

  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const doSearch = async (o: string, d: string, oCoords: any, dCoords: any) => {
    if (!o || !d || !oCoords || !dCoords) {
      setError("Masukkan titik awal dan tujuan.");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: o, destination: d, originCoords: oCoords, destCoords: dCoords }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Gagal menghitung rute.");
        return;
      }

      setRouteData(result.data);
      setSelectedRouteIndex(0); // Reset selection
      setActiveInput(null);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSearch = () => {
    doSearch(origin, destination, originCoords, destCoords);
  };

  // Handler click peta
  const handleMapClick = async (lng: number, lat: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      const placeName = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const newCoords = { lat, lng };

      if (activeInput === "origin" || (!originCoords && !activeInput)) {
        setOrigin(placeName);
        setOriginCoords(newCoords);
        setIsTypingOrigin(false);
        setOriginSuggestions([]);
        setActiveInput("destination");
      } else if (activeInput === "destination" || (originCoords && !destCoords)) {
        setDestination(placeName);
        setDestCoords(newCoords);
        setIsTypingDest(false);
        setDestSuggestions([]);
        setActiveInput(null);
        // Auto search if both are available
        doSearch(origin || placeName, placeName, originCoords || newCoords, newCoords);
      } else {
        // Reset and start over if both were already filled
        setOrigin(placeName);
        setOriginCoords(newCoords);
        setDestination("");
        setDestCoords(null);
        setRouteData(null);
        setIsTypingOrigin(false);
        setOriginSuggestions([]);
        setActiveInput("destination");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative flex-1 flex" style={{ minHeight: 0 }}>
      {/* Peta — full background */}
      <MapComponent 
        routeData={routeData} 
        onClickMap={handleMapClick} 
        originCoords={originCoords}
        destCoords={destCoords}
        selectedRouteIndex={selectedRouteIndex}
      />

      {/* Panel Kontrol Rute — sidebar kiri */}
      <aside
        style={{
          position: "absolute",
          top: "24px",
          left: "24px",
          width: "360px",
          backgroundColor: "var(--surface-card)",
          border: "2px solid var(--hairline)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto"
        }}
      >
        {/* Header panel */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "2px solid var(--hairline)",
          }}
        >
          <h1
            className="display-sm"
            style={{ color: "var(--primary)", marginBottom: "4px" }}
          >
            SAFEROUTE
          </h1>
          <p className="body-sm" style={{ color: "var(--muted)", margin: 0 }}>
            Ketik lokasi atau klik pada peta.
          </p>
        </div>

        {/* Form rute */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {error && (
            <div style={{ padding: "8px 12px", backgroundColor: "#fdf0ef", borderLeft: "3px solid var(--m-red)" }}>
              <p className="caption" style={{ margin: 0, color: "var(--m-red)" }}>{error}</p>
            </div>
          )}
          <div style={{ position: "relative" }}>
            <label
              className="caption"
              style={{
                display: "block",
                color: activeInput === "origin" ? "var(--m-blue-dark)" : "var(--muted)",
                marginBottom: "6px",
                letterSpacing: "1px",
                fontWeight: activeInput === "origin" ? "bold" : "normal"
              }}
            >
              LOKASI AWAL {activeInput === "origin" && "(Pilih di Peta)"}
            </label>
            <input
              type="text"
              className="field-input"
              style={{ borderColor: activeInput === "origin" ? "var(--m-blue-dark)" : "var(--hairline)" }}
              placeholder="Contoh: Monas"
              value={origin}
              onFocus={() => setActiveInput("origin")}
              onChange={(e) => {
                setOrigin(e.target.value);
                setOriginCoords(null);
                setIsTypingOrigin(true);
              }}
            />
            {originSuggestions.length > 0 && (
              <div style={{ position: "absolute", zIndex: 20, width: "100%", background: "white", border: "1px solid #ccc", top: "70px", maxHeight: "200px", overflowY: "auto" }}>
                {originSuggestions.map((s, i) => (
                  <div key={i} style={{ padding: "8px", borderBottom: "1px solid #eee", cursor: "pointer", fontSize: "12px" }} 
                    onClick={() => {
                      setOrigin(s.display_name);
                      setOriginCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
                      setOriginSuggestions([]);
                      setIsTypingOrigin(false);
                      if (!destCoords) setActiveInput("destination");
                    }}>
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <label
              className="caption"
              style={{
                display: "block",
                color: activeInput === "destination" ? "var(--m-blue-dark)" : "var(--muted)",
                marginBottom: "6px",
                letterSpacing: "1px",
                fontWeight: activeInput === "destination" ? "bold" : "normal"
              }}
            >
              TUJUAN {activeInput === "destination" && "(Pilih di Peta)"}
            </label>
            <input
              type="text"
              className="field-input"
              style={{ borderColor: activeInput === "destination" ? "var(--m-blue-dark)" : "var(--hairline)" }}
              placeholder="Contoh: Depok"
              value={destination}
              onFocus={() => setActiveInput("destination")}
              onChange={(e) => {
                setDestination(e.target.value);
                setDestCoords(null);
                setIsTypingDest(true);
              }}
            />
            {destSuggestions.length > 0 && (
              <div style={{ position: "absolute", zIndex: 20, width: "100%", background: "white", border: "1px solid #ccc", top: "70px", maxHeight: "200px", overflowY: "auto" }}>
                {destSuggestions.map((s, i) => (
                  <div key={i} style={{ padding: "8px", borderBottom: "1px solid #eee", cursor: "pointer", fontSize: "12px" }} 
                    onClick={() => {
                      setDestination(s.display_name);
                      setDestCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
                      setDestSuggestions([]);
                      setIsTypingDest(false);
                    }}>
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, opacity: loading ? 0.6 : 1 }}
              onClick={handleRouteSearch}
              disabled={loading}
            >
              {loading ? "MENGHITUNG RUTE..." : "CARI RUTE AMAN"}
            </button>
            <button 
              className="btn-secondary" 
              style={{ 
                padding: "0 16px",
                backgroundColor: "var(--surface-soft)", 
                color: "var(--body)", 
                border: "1px solid var(--hairline)",
                cursor: "pointer",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "12px",
                letterSpacing: "1px"
              }}
              onClick={() => {
                setOrigin("");
                setDestination("");
                setOriginCoords(null);
                setDestCoords(null);
                setRouteData(null);
                setSelectedRouteIndex(0);
                setActiveInput(null);
                setError("");
                setOriginSuggestions([]);
                setDestSuggestions([]);
              }}
              disabled={loading}
            >
              RESET
            </button>
          </div>
        </div>

        {/* Hasil 3 Opsi Rute */}
        {routeData && routeData.routes && (
          <div style={{ borderTop: "2px solid var(--hairline)", padding: "16px 24px" }}>
            <p className="caption" style={{ color: "var(--muted)", marginBottom: "16px", letterSpacing: "1px" }}>OPSI RUTE TERSEDIA</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {routeData.routes.map((route: any, index: number) => {
                const isSelected = selectedRouteIndex === index;
                return (
                  <div 
                    key={route.id} 
                    onClick={() => setSelectedRouteIndex(index)}
                    style={{
                      padding: "12px",
                      backgroundColor: isSelected ? "var(--surface-hover)" : "var(--surface-soft)",
                      borderLeft: `6px solid ${route.color}`,
                      borderRadius: "6px",
                      cursor: "pointer",
                      boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                      transform: isSelected ? "scale(1.02)" : "scale(1)",
                      transition: "all 0.2s ease",
                      border: isSelected ? `1px solid ${route.color}40` : "1px solid transparent"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <span className="display-sm" style={{ color: "var(--primary)", fontSize: "24px" }}>
                          {Math.ceil(route.duration / 60)}
                        </span>
                        <span className="title-sm" style={{ color: "var(--muted)", marginLeft: "4px" }}>mnt</span>
                        <p className="caption" style={{ color: "var(--muted)", margin: 0, fontWeight: "bold" }}>
                          Via {route.routeName || `Rute ${index + 1}`}
                        </p>
                        <p className="caption" style={{ color: "var(--muted)", margin: "2px 0 0" }}>
                          {(route.distance / 1000).toFixed(1)} km
                        </p>
                      </div>
                      <span style={{
                        backgroundColor: route.color,
                        color: "white",
                        padding: "4px 8px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        letterSpacing: "1px",
                        borderRadius: "4px"
                      }}>
                        {route.status}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--body)", lineHeight: 1.4, margin: 0 }}>
                      {route.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Tombol shortcut bawah kanan */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          right: "24px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "flex-end",
        }}
      >
        <a
          href="/report"
          className="btn-primary"
          style={{ fontSize: "12px", padding: "10px 18px", height: "40px" }}
        >
          LAPOR INSIDEN
        </a>
      </div>
    </div>
  );
}

