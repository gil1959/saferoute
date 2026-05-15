import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isNearIncident(routeCoords: number[][], incidentLat: number, incidentLng: number, radius: number) {
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const lon1 = routeCoords[i][0];
    const lat1 = routeCoords[i][1];
    const lon2 = routeCoords[i+1][0];
    const lat2 = routeCoords[i+1][1];

    const distTotal = haversineDistance(lat1, lon1, lat2, lon2);
    // Interpolate points every 10 meters to accurately detect straight roads crossing incidents
    const steps = Math.max(1, Math.ceil(distTotal / 10)); 

    for (let j = 0; j <= steps; j++) {
      const fraction = j / steps;
      const interpLat = lat1 + (lat2 - lat1) * fraction;
      const interpLon = lon1 + (lon2 - lon1) * fraction;
      
      const dist = haversineDistance(interpLat, interpLon, incidentLat, incidentLng);
      if (dist <= radius) {
        return true;
      }
    }
  }
  return false;
}

function getCategory(icon: number) {
  if (icon === 1 || icon === 2) return "accident";
  if (icon === 6 || icon === 7) return "traffic";
  if (icon === 8 || icon === 9) return "road_damage";
  return "other";
}

function getCategoryTitle(category: string) {
  if (category === "accident") return "Kecelakaan";
  if (category === "traffic") return "Kemacetan Panjang";
  if (category === "road_damage") return "Jalan Rusak / Berlubang";
  if (category === "crime") return "Rawan Begal / Kejahatan";
  return "Gangguan Lalu Lintas";
}

function getSeverity(delay: number) {
  if (delay > 3) return "critical";
  if (delay > 2) return "high";
  if (delay > 1) return "medium";
  return "low";
}

async function geocode(query: string) {
  const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(nomUrl, { headers: { 'User-Agent': 'SafeRoute-App/1.0' } });
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { origin, destination, originCoords, destCoords } = body;

    if (!originCoords && origin) originCoords = await geocode(`${origin}, Indonesia`);
    if (!destCoords && destination) destCoords = await geocode(`${destination}, Indonesia`);

    if (!originCoords || !destCoords) {
      return NextResponse.json({ error: "Lokasi tidak ditemukan." }, { status: 404 });
    }

    // Call Mapbox Directions API with alternatives=true
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const mbUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?alternatives=true&access_token=${mapboxToken}&geometries=geojson&overview=full`;
    
    const mbRes = await fetch(mbUrl);
    const mbData = await mbRes.json();

    if (!mbData.routes || mbData.routes.length === 0) {
      return NextResponse.json({ error: "Rute tidak ditemukan." }, { status: 404 });
    }

    // Find bounding box covering ALL routes to fetch incidents efficiently
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    for (const route of mbData.routes) {
      for (const coord of route.geometry.coordinates) {
        if (coord[1] < minLat) minLat = coord[1];
        if (coord[1] > maxLat) maxLat = coord[1];
        if (coord[0] < minLng) minLng = coord[0];
        if (coord[0] > maxLng) maxLng = coord[0];
      }
    }
    minLat -= 0.05; maxLat += 0.05;
    minLng -= 0.05; maxLng += 0.05;

    // Fetch TomTom API dynamically for this specific route box
    const tomtomUrl = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${process.env.TOMTOM_API_KEY}&bbox=${minLng},${minLat},${maxLng},${maxLat}&fields={incidents{properties{iconCategory,magnitudeOfDelay,endTime},geometry{coordinates}}}`;
    
    try {
      const ttRes = await fetch(tomtomUrl);
      const ttData = await ttRes.json();

      if (ttData.incidents && Array.isArray(ttData.incidents)) {
        for (const inc of ttData.incidents) {
          const incCoords = inc.geometry.coordinates;
          if (!incCoords || incCoords.length === 0) continue;
          const iLng = incCoords[0][0];
          const iLat = incCoords[0][1];
          const category = getCategory(inc.properties.iconCategory);
          const severity = getSeverity(inc.properties.magnitudeOfDelay);

          const isDup = await prisma.incident.findFirst({
            where: {
              source: "tomtom",
              status: "active",
              latitude: { gte: iLat - 0.001, lte: iLat + 0.001 },
              longitude: { gte: iLng - 0.001, lte: iLng + 0.001 },
            }
          });
          if (!isDup) {
            await prisma.incident.create({
              data: {
                title: getCategoryTitle(category),
                category: category as any,
                severity: severity as any,
                latitude: iLat,
                longitude: iLng,
                source: "tomtom",
                status: "active",
                danger_radius: 20,
                penalty_score: severity === 'critical' ? 20 : (severity === 'high' ? 15 : 10),
                expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000)
              }
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch dynamic TomTom data:", e);
    }

    // Fetch all active incidents in this bounds from DB
    const activeIncidents = await prisma.incident.findMany({
      where: {
        status: "active",
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });

    const processedRoutes = [];

    // Process each alternative route
    for (let i = 0; i < mbData.routes.length; i++) {
      const route = mbData.routes[i];
      const coords = route.geometry.coordinates;
      
      let penaltyScore = 0;
      let incidentsAvoided = 0;
      let uniqueTitles = new Set<string>();
      let routeIncidentsMap = new Map();

      for (const incident of activeIncidents) {
        const isNear = isNearIncident(
          coords, 
          parseFloat(incident.latitude.toString()), 
          parseFloat(incident.longitude.toString()), 
          incident.danger_radius
        );

        if (isNear) {
          penaltyScore += incident.penalty_score;
          incidentsAvoided++;
          uniqueTitles.add(incident.title);

          routeIncidentsMap.set(incident.incident_id, {
            id: incident.incident_id,
            lat: parseFloat(incident.latitude.toString()),
            lng: parseFloat(incident.longitude.toString()),
            weight: incident.penalty_score,
            severity: incident.severity,
            category: incident.category,
            title: incident.title,
            radius: incident.danger_radius
          });
        }
      }

      let status = "AMAN";
      let color = "#0a7a28"; // Hijau
      let description = "Jalur bersih dari insiden besar.";

      const incidentSummary = Array.from(uniqueTitles).join(", ");

      if (penaltyScore > 50) {
        status = "BAHAYA";
        color = "#c0190c"; // Merah
        description = incidentSummary ? `Melewati area rawan: ${incidentSummary}.` : "Jalur ini memiliki tingkat bahaya sangat tinggi.";
      } else if (penaltyScore > 30) {
        status = "WASPADA";
        color = "#b37800"; // Oranye
        description = incidentSummary ? `Harap berhati-hati dengan ${incidentSummary} di rute ini.` : "Terdapat beberapa kendala ringan di jalan.";
      } else if (penaltyScore > 0) {
        status = "AMAN";
        color = "#0a7a28";
        description = "Rute aman dengan sedikit hambatan ringan.";
      }

      const summaryName = route.legs && route.legs[0] && route.legs[0].summary 
        ? route.legs[0].summary 
        : `Rute Alternatif ${i + 1}`;

      processedRoutes.push({
        id: i,
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        penalty_score: penaltyScore,
        incidents_avoided: incidentsAvoided,
        status,
        color,
        description,
        routeName: summaryName,
        incidents: Array.from(routeIncidentsMap.values())
      });
    }

    // Sort based on penalty score, then distance
    processedRoutes.sort((a, b) => {
      if (a.penalty_score !== b.penalty_score) {
        return a.penalty_score - b.penalty_score;
      }
      return a.duration - b.duration;
    });

    return NextResponse.json({
      status: "success",
      data: {
        routes: processedRoutes,
        origin_coords: originCoords,
        dest_coords: destCoords
      }
    });

  } catch (error: any) {
    console.error("Route calculation error:", error);
    return NextResponse.json(
      { status: "error", message: "Gagal menghitung rute." },
      { status: 500 }
    );
  }
}
