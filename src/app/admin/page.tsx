import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminDashboardClient from "./dashboard-client";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  // Server-side auth guard — harus role admin
  const cookieStore = await cookies();
  const token = cookieStore.get("sr_session")?.value;

  if (!token) redirect("/login?redirect=/admin");

  const session = await verifyToken(token);
  if (!session) redirect("/login?redirect=/admin");
  if (session.role !== "admin") redirect("/");

  const [rawIncidents, users, rawReports] = await Promise.all([
    prisma.incident.findMany({
      orderBy: { incident_id: 'desc' },
      take: 100
    }),
    prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: { user_id: true, full_name: true, username: true, email: true, role: true, is_active: true }
    }),
    prisma.report.findMany({
      orderBy: { report_id: 'desc' },
      take: 50,
      include: {
        user: { select: { username: true } },
        photos: true,
      }
    })
  ]);

  const incidents = rawIncidents.map(inc => ({
    ...inc,
    latitude: Number(inc.latitude),
    longitude: Number(inc.longitude)
  }));

  const reports = rawReports.map(rep => ({
    ...rep,
    latitude: Number(rep.latitude),
    longitude: Number(rep.longitude)
  }));

  return (
    <AdminDashboardClient 
      adminName={session.name} 
      initialIncidents={incidents as any}
      initialUsers={users as any}
      initialReports={reports as any}
    />
  );
}
