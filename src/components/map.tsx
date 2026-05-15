"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapProps {
  routeData?: any;
  originCoords?: {lat: number, lng: number} | null;
  destCoords?: {lat: number, lng: number} | null;
  selectedRouteIndex?: number;
  onClickMap?: (lng: number, lat: number) => void;
}

export default function MapComponent({ routeData, originCoords, destCoords, selectedRouteIndex = 0, onClickMap }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const originMarker = useRef<maplibregl.Marker | null>(null);
  const destMarker = useRef<maplibregl.Marker | null>(null);

  const onClickRef = useRef(onClickMap);
  useEffect(() => {
    onClickRef.current = onClickMap;
  }, [onClickMap]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [106.8272, -6.1751], // Jakarta
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    popup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "custom-popup"
    });

    map.current.on("load", () => {
      // Source untuk insiden
      map.current?.addSource("incidents", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });

      // Layer shadow/radius untuk insiden
      map.current?.addLayer({
        id: "incidents-shadow",
        type: "circle",
        source: "incidents",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 10, 16, 50],
          "circle-color": [
            "match",
            ["get", "severity"],
            "critical", "#c0190c",
            "high", "#b37800",
            "medium", "#e6a100",
            "#0a7a28"
          ],
          "circle-opacity": 0.2
        }
      });

      // Layer titik utama insiden
      map.current?.addLayer({
        id: "incidents-point",
        type: "circle",
        source: "incidents",
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "match",
            ["get", "severity"],
            "critical", "#c0190c",
            "high", "#b37800",
            "medium", "#e6a100",
            "#0a7a28"
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2
        }
      });

      // Hover events for incident popup
      map.current?.on("mouseenter", "incidents-point", (e) => {
        if (!map.current || !popup.current || !e.features || e.features.length === 0) return;
        map.current.getCanvas().style.cursor = "pointer";
        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const description = e.features[0].properties.title;

        // Ensure popup appears over the correct copy of the point if world wraps
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        popup.current.setLngLat(coordinates).setHTML(`<div style="color:black; font-size:12px; font-weight:bold; padding:4px;">${description}</div>`).addTo(map.current);
      });

      map.current?.on("mouseleave", "incidents-point", () => {
        if (!map.current || !popup.current) return;
        map.current.getCanvas().style.cursor = "";
        popup.current.remove();
      });
    });

    // Menangani klik pada peta menggunakan ref untuk menghindari closure usang
    map.current.on("click", (e) => {
      if (onClickRef.current) {
        onClickRef.current(e.lngLat.lng, e.lngLat.lat);
      }
    });

  }, []); // Hapus dependensi onClickMap karena sudah ditangani onClickRef

  // Effect untuk mengupdate marker origin dan dest
  useEffect(() => {
    if (!map.current) return;

    if (originCoords) {
      if (!originMarker.current) {
        originMarker.current = new maplibregl.Marker({ color: "#3b82f6" })
          .setLngLat([originCoords.lng, originCoords.lat])
          .addTo(map.current);
      } else {
        originMarker.current.setLngLat([originCoords.lng, originCoords.lat]);
      }
    } else if (originMarker.current) {
      originMarker.current.remove();
      originMarker.current = null;
    }

    if (destCoords) {
      if (!destMarker.current) {
        destMarker.current = new maplibregl.Marker({ color: "#ef4444" })
          .setLngLat([destCoords.lng, destCoords.lat])
          .addTo(map.current);
      } else {
        destMarker.current.setLngLat([destCoords.lng, destCoords.lat]);
      }
    } else if (destMarker.current) {
      destMarker.current.remove();
      destMarker.current = null;
    }
  }, [originCoords, destCoords]);

  // Effect tunggal untuk update seluruh state peta (rute, highlight, & insiden)
  useEffect(() => {
    if (!map.current) return;

    const syncMapState = () => {
      if (!map.current) return;
      
      // Jika routeData kosong (misal saat di-reset), bersihkan peta
      if (!routeData || !routeData.routes) {
        for (let i = 0; i < 5; i++) {
          if (map.current.getLayer(`route-line-${i}`)) map.current.removeLayer(`route-line-${i}`);
          if (map.current.getSource(`route-${i}`)) map.current.removeSource(`route-${i}`);
        }
        const sourceIncidents = map.current.getSource("incidents");
        if (sourceIncidents) {
          (sourceIncidents as maplibregl.GeoJSONSource).setData({ type: "FeatureCollection", features: [] });
        }
        return;
      }

      // 1. Update Rute (Hapus yang lama, tambah yang baru)
      for (let i = 0; i < 5; i++) {
        if (map.current.getLayer(`route-line-${i}`)) map.current.removeLayer(`route-line-${i}`);
        if (map.current.getSource(`route-${i}`)) map.current.removeSource(`route-${i}`);
      }

      const routesToRender = [...routeData.routes].reverse();

      routesToRender.forEach((route, index) => {
        const realIndex = routeData.routes.length - 1 - index;
        const isSelected = realIndex === selectedRouteIndex;

        map.current?.addSource(`route-${realIndex}`, {
          type: "geojson",
          data: route.geometry
        });

        map.current?.addLayer({
          id: `route-line-${realIndex}`,
          type: "line",
          source: `route-${realIndex}`,
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": route.color,
            "line-width": isSelected ? 8 : 4,
            "line-opacity": isSelected ? 1 : 0.4
          }
        }, "incidents-shadow");

        if (isSelected) {
          map.current?.moveLayer(`route-line-${realIndex}`, "incidents-shadow");
        }
      });

      // 2. Tampilkan insiden HANYA untuk rute yang dipilih
      const selectedRoute = routeData.routes[selectedRouteIndex];
      const sourceIncidents = map.current.getSource("incidents");
      if (sourceIncidents) {
        if (selectedRoute && selectedRoute.incidents && selectedRoute.incidents.length > 0) {
          const features = selectedRoute.incidents.map((inc: any) => ({
            type: "Feature",
            properties: { weight: inc.weight || 50, severity: inc.severity, title: inc.title },
            geometry: { type: "Point", coordinates: [inc.lng, inc.lat] }
          }));
          (sourceIncidents as maplibregl.GeoJSONSource).setData({
            type: "FeatureCollection",
            features: features
          });
        } else {
          // Bersihkan insiden jika rute aman
          (sourceIncidents as maplibregl.GeoJSONSource).setData({
            type: "FeatureCollection",
            features: []
          });
        }
      }

      // 3. Fit bounds ke rute yang dipilih
      if (selectedRoute && selectedRoute.geometry && selectedRoute.geometry.coordinates) {
        const coordinates = selectedRoute.geometry.coordinates;
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce(function(bounds: maplibregl.LngLatBounds, coord: any) {
            return bounds.extend(coord);
          }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
          
          map.current.fitBounds(bounds, { padding: 50, duration: 800 });
        }
      }
    };

    if (map.current.isStyleLoaded()) {
      syncMapState();
    } else {
      map.current.once("styledata", syncMapState);
    }
  }, [routeData, selectedRouteIndex]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
