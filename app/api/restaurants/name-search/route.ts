import { NextRequest } from "next/server";
import { BLUERIBBON_BASE_URL, BLUERIBBON_HEADERS } from "@/app/_lib/constants";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const query = sp.get("query")?.trim();
  const ribbonType = sp.get("ribbonType");

  if (!query) {
    return Response.json({ error: "query parameter required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    restaurantName: query,
    ribbon: "true",
  });

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
