import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activeIncidents = await prisma.incident.findMany({
      where: {
        status: "active",
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      },
      select: {
        incident_id: true,
        latitude: true,
        longitude: true,
        category: true,
        severity: true,
        danger_radius: true,
        penalty_score: true,
        title: true
      }
    });

    const formattedData = activeIncidents.map(inc => ({
      id: inc.incident_id,
      lat: parseFloat(inc.latitude.toString()),
      lng: parseFloat(inc.longitude.toString()),
      weight: inc.penalty_score,
      severity: inc.severity,
      category: inc.category,
      title: inc.title
    }));

    return NextResponse.json({
      status: "success",
      data: formattedData
    });
  } catch (error) {
    console.error("Fetch incidents error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}

