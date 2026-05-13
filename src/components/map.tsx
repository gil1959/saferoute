"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Initialize MapLibre using a dark basemap from Stadia Maps (Alidade Smooth Dark or standard OSM with dark filters)
    // Since we need an API key for Stadia Maps in production, we will use a public vector tile or raster tile for development.
    // Here we use CartoDB Dark Matter as a free dark fallback which perfectly matches the BMW M canvas.
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [106.8272, -6.1751], // Jakarta
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      // Mock data source for incidents (Heatmap FR-002)
      map.current?.addSource("incidents", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { weight: 80, severity: "critical" },
              geometry: { type: "Point", coordinates: [106.82, -6.18] }
            },
            {
              type: "Feature",
              properties: { weight: 50, severity: "high" },
              geometry: { type: "Point", coordinates: [106.83, -6.17] }
            }
          ]
        }
      });

      // Heatmap layer
      map.current?.addLayer({
        id: "incidents-heat",
        type: "heatmap",
        source: "incidents",
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0, 0,
            100, 1
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(15, 163, 54, 0)", // Success green to transparent
            0.5, "var(--warning)", // Yellow/Warning
            1, "var(--m-red)" // M-Red
          ],
          "heatmap-radius": 30,
          "heatmap-opacity": 0.8
        }
      });
    });

  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
