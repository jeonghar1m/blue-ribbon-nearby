import { NextRequest } from "next/server";
import { BLUERIBBON_BASE_URL, BLUERIBBON_HEADERS } from "@/app/_lib/constants";
import type { Restaurant } from "@/app/_lib/types";

// Parse restaurant search results from bluer.co.kr search HTML
function parseSearchResults(html: string): Restaurant[] {
  const items: Restaurant[] = [];
  const seen = new Set<number>();

  // Pattern: restaurant cards with id and details
  // Look for blocks containing a /restaurants/{id} link
  const cardPattern =
    /href="\/restaurants\/(\d+)"[\s\S]{0,600}?(?=href="\/restaurants\/\d+"|$)/g;

  let cardMatch;
  while ((cardMatch = cardPattern.exec(html)) !== null) {
    const id = parseInt(cardMatch[1], 10);
    if (seen.has(id)) continue;
    seen.add(id);

    const block = cardMatch[0];

    // Name: <strong> or <h2>/<h3> text
    const nameMatch =
      /<strong[^>]*>([\s\S]*?)<\/strong>/.exec(block) ||
      /<h[23][^>]*>([\s\S]*?)<\/h[23]>/.exec(block);
    const name = nameMatch
      ? nameMatch[1].replace(/<[^>]+>/g, "").trim()
      : `식당 #${id}`;

    // Ribbon type from class name
    let ribbonType: Restaurant["ribbonType"] = "RIBBON_ONE";
    if (/RIBBON_THREE|ribbon_three|ribbon-three|3ribbon/i.test(block))
      ribbonType = "RIBBON_THREE";
    else if (/RIBBON_TWO|ribbon_two|ribbon-two|2ribbon/i.test(block))
      ribbonType = "RIBBON_TWO";

    // Address
    const addrMatch = /<[^>]+class="[^"]*address[^"]*"[^>]*>([\s\S]*?)<\//.exec(
      block,
    );
    const address = addrMatch
      ? addrMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    // Food type
    const foodMatch =
      /<[^>]+class="[^"]*food[^"]*"[^>]*>([\s\S]*?)<\//.exec(block);
    const foodType = foodMatch
      ? foodMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    items.push({
      id,
      name,
      ribbonType,
      ribbonCount: ribbonType === "RIBBON_THREE" ? 3 : ribbonType === "RIBBON_TWO" ? 2 : 1,
      bookYear: null,
      latitude: 0,
      longitude: 0,
      redRibbon: false,
      address,
      foodTypes: foodType ? [foodType] : [],
      foodDetailTypes: [],
    });
  }

  return items;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const query = sp.get("query")?.trim();
  const ribbonType = sp.get("ribbonType");

  if (!query) {
    return Response.json({ error: "query parameter required" }, { status: 400 });
  }

  // Try search URLs in order
  const searchUrls = [
    `${BLUERIBBON_BASE_URL}/search?q=${encodeURIComponent(query)}`,
    `${BLUERIBBON_BASE_URL}/search?restaurantName=${encodeURIComponent(query)}`,
    `${BLUERIBBON_BASE_URL}/search/restaurant?q=${encodeURIComponent(query)}`,
  ];

  for (const url of searchUrls) {
    try {
      const res = await fetch(url, { headers: BLUERIBBON_HEADERS });
      if (!res.ok) continue;

      const html = await res.text();
      let items = parseSearchResults(html);

      if (ribbonType && ribbonType !== "ALL") {
        items = items.filter((r) => r.ribbonType === ribbonType);
      }

      if (items.length > 0) {
        return Response.json({ items, total: items.length, capped: false });
      }
    } catch {
      continue;
    }
  }

  return Response.json({ items: [], total: 0, capped: false });
}
