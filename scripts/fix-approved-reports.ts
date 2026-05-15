import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const cs = await p.incident.findMany({ where: { source: 'crowdsource' } });
  console.log('Crowdsource incidents count:', cs.length);

  const reports = await p.report.findMany({ where: { status: 'resolved', incident_id: null } });
  console.log('Resolved reports without incident link:', reports.length);

  const severityMap: any = { crime: 'high', accident: 'critical', road_damage: 'medium', traffic: 'low', other: 'medium' };
  const penaltyMap: any = { crime: 25, accident: 30, road_damage: 15, traffic: 10, other: 10 };

  for (const r of reports) {
    const inc = await p.incident.create({
      data: {
        title: r.title,
        category: r.category,
        severity: severityMap[r.category] ?? 'medium',
        latitude: r.latitude,
        longitude: r.longitude,
        source: 'crowdsource',
        status: 'active',
        danger_radius: 100,
        penalty_score: penaltyMap[r.category] ?? 10,
        reported_by: r.user_id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    await p.report.update({ where: { report_id: r.report_id }, data: { incident_id: inc.incident_id } });
    console.log(`Created INC-${inc.incident_id} from RPT-${r.report_id}: ${r.title}`);
  }

  if (reports.length === 0) console.log('No pending conversion needed.');
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
