import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Parser from "rss-parser";

export const dynamic = 'force-dynamic';

const parser = new Parser({
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  timeout: 10000,
});

// Keyword → kategori insiden
const KEYWORDS: Record<string, "crime" | "accident" | "road_damage" | "traffic" | "other"> = {
  "begal": "crime",
  "tawuran": "crime",
  "klitih": "crime",
  "ditikam": "crime",
  "pembunuhan": "crime",
  "rampok": "crime",
  "perampokan": "crime",
  "pencurian": "crime",
  "kriminal": "crime",
  "pelaku": "crime",
  "kecelakaan": "accident",
  "tabrakan": "accident",
  "laka lantas": "accident",
  "tabrak lari": "accident",
  "tumbang": "accident",
  "jalan berlubang": "road_damage",
  "jalan amblas": "road_damage",
  "jalan rusak": "road_damage",
  "berlubang": "road_damage",
  "kemacetan parah": "traffic",
  "macet total": "traffic",
};

// RSS feed yang paling relevan untuk insiden di Indonesia
const RSS_FEEDS = [
  'https://www.cnnindonesia.com/nasional/rss',
  'https://www.cnnindonesia.com/metro/rss',
  'https://wartakota.tribunnews.com/rss',
  'https://www.tribunnews.com/rss',
];

// Regex untuk ekstrak lokasi — lebih agresif
const locationPatterns = [
  /di\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})/,
  /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*),?\s+(?:Jakarta|Surabaya|Bandung|Medan|Semarang|Depok|Bekasi|Tangerang|Bogor)/,
  /(Jakarta\s*(?:Selatan|Utara|Timur|Barat|Pusat)?)/i,
  /(Surabaya|Bandung|Medan|Semarang|Depok|Bekasi|Tangerang|Bogor|Yogyakarta|Makassar|Palembang|Batam)/i,
];

function extractLocation(text: string): string | null {
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

export async function GET() {
  try {
    let processedCount = 0;
    let skippedExists = 0;
    let skippedNoLoc = 0;
    const addedIncidents: number[] = [];
    const errors: string[] = [];

    for (const feedUrl of RSS_FEEDS) {
      let feed;
      try {
        feed = await parser.parseURL(feedUrl);
      } catch (e: any) {
        errors.push(`Feed ${feedUrl}: ${e.message?.substring(0, 50)}`);
        continue;
      }

      for (const item of feed.items) {
        const text = (item.title || "") + " " + (item.contentSnippet || "") + " " + (item.summary || "");
        const lowerText = text.toLowerCase();

        // Cari keyword yang cocok
        let matchedCategory: "crime" | "accident" | "road_damage" | "traffic" | "other" | null = null;
        for (const [kw, cat] of Object.entries(KEYWORDS)) {
          if (lowerText.includes(kw)) {
            matchedCategory = cat;
            break;
          }
        }
        if (!matchedCategory) continue;

        // Ekstrak lokasi
        const locationStr = extractLocation(text);
        if (!locationStr) {
          skippedNoLoc++;
          continue;
        }

        // Cek duplikat (judul 30 karakter pertama)
        const titleKey = (item.title || "").substring(0, 40);
        const exists = await prisma.incident.findFirst({
          where: {
            source: "scraping",
            title: { contains: titleKey }
          }
        });
        if (exists) { skippedExists++; continue; }

        // Geocode via Nominatim
        const query = encodeURIComponent(`${locationStr}, Indonesia`);
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&accept-language=id`;

        try {
          const nomRes = await fetch(nomUrl, {
            headers: { 'User-Agent': 'SafeRoute-App/1.0 (saferoute.vercel.app)' }
          });
          const geocode = await nomRes.json();

          if (geocode && geocode.length > 0) {
            const lat = parseFloat(geocode[0].lat);
            const lng = parseFloat(geocode[0].lon);

            const inc = await prisma.incident.create({
              data: {
                title: (item.title || "Insiden dari Berita").substring(0, 199),
                category: matchedCategory,
                severity: matchedCategory === "crime" ? "high" : matchedCategory === "accident" ? "critical" : "medium",
                latitude: lat,
                longitude: lng,
                source: "scraping",
                status: "active",
                danger_radius: 150,
                penalty_score: matchedCategory === "crime" ? 20 : 15,
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 jam
              }
            });
            addedIncidents.push(inc.incident_id);
            processedCount++;
          }
        } catch (geoErr: any) {
          errors.push(`Geocode error for "${locationStr}": ${geoErr.message?.substring(0, 40)}`);
        }

        // Delay untuk hormati rate limit Nominatim (max 1 req/detik)
        await new Promise(r => setTimeout(r, 1100));
      }
    }

    return NextResponse.json({
      status: "success",
      message: `RSS sync selesai. Ditambahkan: ${processedCount}, Duplikat: ${skippedExists}, Tanpa lokasi: ${skippedNoLoc}`,
      added: addedIncidents,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 200 });

  } catch (error: any) {
    console.error("News Cron Error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to run News cron", detail: error.message },
      { status: 500 }
    );
  }
}
