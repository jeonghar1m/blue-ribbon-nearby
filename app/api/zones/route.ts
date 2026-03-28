import { NextRequest } from "next/server";
import { BLUERIBBON_BASE_URL, BLUERIBBON_HEADERS } from "@/app/_lib/constants";
import type { Zone } from "@/app/_lib/types";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";

  try {
    const res = await fetch(`${BLUERIBBON_BASE_URL}/search/zone`, {
      headers: BLUERIBBON_HEADERS,
    });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch zones" },
        { status: res.status },
      );
    }

    const html = await res.text();

    // Parse zone links from HTML: zone1=...&zone2=...&zone2Lat=...&zone2Lng=...
    const pattern =
      /zone1=([^"&]+)&amp;zone2=([^"&]+)&amp;zone2Lat=([^"&]+)&amp;zone2Lng=([^"&]+)/g;

    const zones: Zone[] = [];
    let match;
    while ((match = pattern.exec(html)) !== null) {
      zones.push({
        zone1: decodeURIComponent(match[1]),
        zone2: decodeURIComponent(match[2]),
        zone2Lat: parseFloat(match[3]),
        zone2Lng: parseFloat(match[4]),
      });
    }

    if (!query) {
      return Response.json(zones);
    }

    // Filter zones by query substring match on zone2 name
    const filtered = zones.filter(
      (z) => z.zone2.includes(query) || z.zone1.includes(query),
    );
    return Response.json(filtered);
  } catch {
    return Response.json({ error: "Failed to fetch zones" }, { status: 500 });
  }
}
