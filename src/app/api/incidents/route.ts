import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // In the future: Fetch active incidents within the bounding box
    // For now, return mock data matching the map component
    return NextResponse.json({
      status: "success",
      data: [
        {
          id: 1,
          lat: -6.18,
          lng: 106.82,
          weight: 80,
          severity: "critical",
          category: "crime"
        },
        {
          id: 2,
          lat: -6.17,
          lng: 106.83,
          weight: 50,
          severity: "high",
          category: "accident"
        }
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}
