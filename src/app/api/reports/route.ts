import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getSession } from "@/lib/auth";

// POST: User submit laporan baru
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const category = formData.get("category") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const lat = parseFloat(formData.get("lat") as string);
    const lng = parseFloat(formData.get("lng") as string);
    const files = formData.getAll("files") as File[];

    if (!category || !title || !description || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Data laporan tidak lengkap." }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        user_id: session.userId,
        category: category as any,
        title,
        description,
        latitude: lat,
        longitude: lng,
        status: "pending",
      },
    });

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "saferoute_reports" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      await prisma.reportPhoto.create({
        data: {
          report_id: report.report_id,
          photo_url: uploadResult.secure_url,
          file_size: file.size,
          mime_type: file.type,
        },
      });
    }

    return NextResponse.json({
      status: "success",
      message: "Laporan berhasil disubmit dan menunggu validasi.",
      report_id: report.report_id,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Report POST error:", error);
    return NextResponse.json({ status: "error", message: "Gagal mengirim laporan." }, { status: 500 });
  }
}

// GET: User ambil laporan miliknya sendiri
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: { user_id: session.userId },
      orderBy: { report_id: "desc" },
      include: { photos: true },
    });

    const serialized = reports.map((r) => ({
      ...r,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
    }));

    return NextResponse.json({ reports: serialized });
  } catch (error: any) {
    console.error("Report GET error:", error);
    return NextResponse.json({ error: "Gagal mengambil laporan." }, { status: 500 });
  }
}

// PATCH: Admin approve atau reject laporan
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { report_id, action, admin_notes } = await request.json();

    if (!report_id || !["approved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 });
    }

    // Ambil data laporan lengkap
    const report = await prisma.report.findUnique({
      where: { report_id: Number(report_id) },
    });

    if (!report) {
      return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
    }

    let newIncidentId: number | null = null;

    if (action === "approved") {
      // Severity mapping berdasarkan kategori
      const severityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
        crime: "high",
        accident: "critical",
        road_damage: "medium",
        traffic: "low",
        other: "medium",
      };
      const penaltyMap: Record<string, number> = {
        crime: 25,
        accident: 30,
        road_damage: 15,
        traffic: 10,
        other: 10,
      };

      // Buat incident baru dari data laporan
      const incident = await prisma.incident.create({
        data: {
          title: report.title,
          category: report.category as any,
          severity: severityMap[report.category] ?? "medium",
          latitude: report.latitude,
          longitude: report.longitude,
          source: "crowdsource",
          status: "active",
          danger_radius: 100,
          penalty_score: penaltyMap[report.category] ?? 10,
          reported_by: report.user_id,
          validated_by: session.userId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
        },
      });

      newIncidentId = incident.incident_id;

      // Update report: link ke incident yang baru dibuat + status resolved
      await prisma.report.update({
        where: { report_id: Number(report_id) },
        data: {
          status: "resolved",
          incident_id: newIncidentId,
          admin_notes: admin_notes || null,
        },
      });
    } else {
      // Reject: hanya update status
      await prisma.report.update({
        where: { report_id: Number(report_id) },
        data: {
          status: "rejected",
          admin_notes: admin_notes || null,
        },
      });
    }

    return NextResponse.json({
      status: "success",
      message: action === "approved"
        ? `Laporan disetujui dan insiden INC-${newIncidentId} berhasil dibuat.`
        : "Laporan ditolak.",
      new_status: action === "approved" ? "resolved" : "rejected",
      incident_id: newIncidentId,
    });

  } catch (error: any) {
    console.error("Report PATCH error:", error);
    return NextResponse.json({ error: "Gagal memperbarui laporan." }, { status: 500 });
  }
}

