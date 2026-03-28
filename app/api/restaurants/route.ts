import { NextRequest } from "next/server";
import { BLUERIBBON_BASE_URL, BLUERIBBON_HEADERS } from "@/app/_lib/constants";
import { getBoundingBox } from "@/app/_lib/geo";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const params = new URLSearchParams();

  const zone1 = sp.get("zone1");
  const latitude = sp.get("latitude");
  const longitude = sp.get("longitude");
  const distance = sp.get("distance") || "1000";
  const ribbonType = sp.get("ribbonType");

  if (zone1) {
    // Zone-based search
    params.set("zone1", zone1);
    const zone2 = sp.get("zone2");
    if (zone2) params.set("zone2", zone2);
    const zone2Lat = sp.get("zone2Lat");
    const zone2Lng = sp.get("zone2Lng");
    if (zone2Lat) params.set("zone2Lat", zone2Lat);
    if (zone2Lng) params.set("zone2Lng", zone2Lng);
  } else if (latitude && longitude) {
    // GPS-based search using bounding box
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const dist = parseInt(distance, 10);
    const box = getBoundingBox(lat, lng, dist);
    params.set("latitude1", String(box.lat1));
    params.set("latitude2", String(box.lat2));
    params.set("longitude1", String(box.lng1));
    params.set("longitude2", String(box.lng2));
  } else {
    return Response.json(
      { error: "Provide zone1 or latitude/longitude" },
      { status: 400 },
    );
  }

  params.set("isAround", "true");
  params.set("ribbon", "true");
  params.set("distance", distance);
  if (ribbonType && ribbonType !== "ALL") {
    params.set("ribbonType", ribbonType);
  }

  try {
    const res = await fetch(
      `${BLUERIBBON_BASE_URL}/restaurants/map?${params.toString()}`,
      { headers: BLUERIBBON_HEADERS },
    );

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch restaurants" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 },
    );
  }
}
