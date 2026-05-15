import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const TOMTOM_BBOX = "106.6,-6.4,107.0,-6.0"; // Jakarta area
const API_URL = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${process.env.TOMTOM_API_KEY}&bbox=${TOMTOM_BBOX}&fields={incidents{properties{id,iconCategory,magnitudeOfDelay,startTime,endTime},geometry{type,coordinates}}}`;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
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

function getCategory(icon: number) {
  if (icon === 1 || icon === 2) return "accident";
  if (icon === 6 || icon === 7) return "traffic";
  if (icon === 8 || icon === 9) return "road_damage";
  return "other";
}

function getSeverity(delay: number) {
  if (delay > 3) return "critical"; // Major delay
  if (delay > 2) return "high";
  if (delay > 1) return "medium";
  return "low";
}

export async function GET(request: Request) {
  try {
    // 1. Fetch TomTom API
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!data.incidents || !Array.isArray(data.incidents)) {
      return NextResponse.json({ message: "No incidents found or error", data }, { status: 400 });
    }

    // 2. Fetch existing active tomtom incidents from DB to prevent duplicate entries
    const existingIncidents = await prisma.incident.findMany({
      where: {
        source: "tomtom",
        status: "active",
      },
      select: {
        incident_id: true,
        latitude: true,
        longitude: true,
        category: true,
      }
    });

    let newCount = 0;

    for (const inc of data.incidents) {
      // Tomtom returns lines usually, we take the first point
      const coords = inc.geometry.coordinates;
      if (!coords || coords.length === 0) continue;
      const lng = coords[0][0];
      const lat = coords[0][1];
      
      const category = getCategory(inc.properties.iconCategory);
      const severity = getSeverity(inc.properties.magnitudeOfDelay);

      // Check duplicate (same category within 100 meters)
      const isDuplicate = existingIncidents.some(existing => {
        if (existing.category !== category) return false;
        const dist = haversineDistance(
          parseFloat(existing.latitude.toString()), 
          parseFloat(existing.longitude.toString()), 
          lat, lng
        );
        return dist < 100;
      });

      if (!isDuplicate) {
        // Expiration Time: TomTom gives endTime, if not default to +2 hours
        let expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        if (inc.properties.endTime) {
            expiresAt = new Date(inc.properties.endTime);
        }

        await prisma.incident.create({
          data: {
            title: `TomTom Traffic: ${category}`,
            category: category as any,
            severity: severity as any,
            latitude: lat,
            longitude: lng,
            source: "tomtom",
            status: "active",
            danger_radius: 50,
            penalty_score: severity === 'critical' ? 20 : (severity === 'high' ? 15 : 10),
            expires_at: expiresAt,
          }
        });
        
        // Add to our duplicate check memory so we don't insert it again in this loop
        existingIncidents.push({
          incident_id: 0,
          latitude: lat as any,
          longitude: lng as any,
          category: category as any,
        });

        newCount++;
      }
    }

    // 3. Mark expired incidents
    await prisma.incident.updateMany({
      where: {
        source: "tomtom",
        status: "active",
        expires_at: {
          lt: new Date()
        }
      },
      data: {
        status: "expired"
      }
    });

    return NextResponse.json({
      status: "success",
      message: `Successfully synced TomTom incidents. Added ${newCount} new incidents.`
    }, { status: 200 });

  } catch (error: any) {
    console.error("TomTom Cron Error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to run TomTom cron" },
      { status: 500 }
    );
  }
}
