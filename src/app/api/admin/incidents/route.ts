import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET semua incidents untuk admin dashboard (semua status, semua source)
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const incidents = await prisma.incident.findMany({
      orderBy: { incident_id: "desc" },
      take: 200,
    });

    const serialized = incidents.map((i) => ({
      ...i,
      latitude: Number(i.latitude),
      longitude: Number(i.longitude),
    }));

    return NextResponse.json({ incidents: serialized });
  } catch (error: any) {
    console.error("Admin incidents error:", error);
    return NextResponse.json({ error: "Gagal mengambil data insiden." }, { status: 500 });
  }
}
