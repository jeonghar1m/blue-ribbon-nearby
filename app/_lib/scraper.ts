import {
  BLUERIBBON_BASE_URL,
  BLUERIBBON_HEADERS,
} from "@/app/_lib/constants";
import type { RestaurantDetail } from "@/app/_lib/types";

function extractFirst(html: string, pattern: RegExp): string | null {
  const match = pattern.exec(html);
  return match?.[1]?.trim() || null;
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseDetail(id: number, html: string): RestaurantDetail {
  // Name: <h1> inside .header-title
  const nameBlock = extractFirst(html, /<h1>\s*([\s\S]*?)\s*<\/h1>/);
  const name = nameBlock ? stripTags(nameBlock).replace(/\s+/g, " ") : "";

  // Ribbon label: <li class="label-year ...">서울 2026 선정</li>
  const ribbonLabel = extractFirst(
    html,
    /<li\s+class="label-year[^"]*">(.*?)<\/li>/,
  );

  // Category: <ol class="foodtype"><li>뉴코리안</li>
  const category = extractFirst(
    html,
    /<ol\s+class="foodtype">\s*<li>(.*?)<\/li>/,
  );

  // Image: first background-image: url(/images/...) in .restaurant-img
  const imageMatch = extractFirst(
    html,
    /background-image:\s*url\((\/images\/[^)]+)\)/,
  );
  const imageUrl = imageMatch ? `${BLUERIBBON_BASE_URL}${imageMatch}` : null;

  // Description: .restaurant-review-info > .content
  const descriptionRaw = extractFirst(
    html,
    /class="restaurant-review-info[^"]*">\s*<div\s+class="title">[^<]*<\/div>\s*<div\s+class="content">([\s\S]*?)<\/div>/,
  );
  const description = descriptionRaw ? stripTags(descriptionRaw) : null;

  // Info items are structured as: icon_xxx.png followed by content
  // Address: icon_location.png → <div class="content">...</div>
  const address = extractFirst(
    html,
    /icon_location\.png"[^>]*\/>\s*<div\s+class="content">([\s\S]*?)<\/div>/,
  );
  const addressClean = address ? stripTags(address) : null;

  // Parking: icon_parking.png → <div class="content">...</div>
  const parkingRaw = extractFirst(
    html,
    /icon_parking\.png"[^>]*\/>\s*<div\s+class="content">([\s\S]*?)<\/div>/,
  );
  const parking = parkingRaw ? stripTags(parkingRaw) : null;

  // Phone: href="tel:..."
  const phone = extractFirst(html, /href="tel:([^"]+)"/);

  // Hours: icon_time.png → content with .extra
  const hoursRaw = extractFirst(
    html,
    /icon_time\.png"[^>]*\/>\s*<div\s+class="content">\s*<div\s+class="extra[^"]*"[^>]*>([\s\S]*?)<\/div>/,
  );
  const hours = hoursRaw ? stripTags(hoursRaw).replace(/\n{2,}/g, "\n") : null;

  // Instagram
  const instagram = extractFirst(
    html,
    /icon_instagram\.png"[^>]*\/>\s*<a\s+class="link"\s+href="([^"]+)"/,
  );

  // Website
  const website = extractFirst(
    html,
    /icon_website\.png"[^>]*\/>\s*<a\s+class="link"\s+href="([^"]+)"/,
  );

  // Price range: <span class="price">₩300,000 ~ ₩400,000</span> inside .restaurant-info-menu
  const priceRange = extractFirst(
    html,
    /restaurant-info-menu[\s\S]*?<span\s+class="price">([\s\S]*?)<\/span>/,
  );
  const priceClean = priceRange ? stripTags(priceRange) : null;

  // Features: .restaurant-info-feature .content > <span>...</span>
  const featuresBlock = extractFirst(
    html,
    /class="restaurant-info-feature">\s*[\s\S]*?<div\s+class="content">([\s\S]*?)<\/div>/,
  );
  const features: string[] = [];
  if (featuresBlock) {
    const spanPattern = /<span>(.*?)<\/span>/g;
    let spanMatch;
    while ((spanMatch = spanPattern.exec(featuresBlock)) !== null) {
      const text = stripTags(spanMatch[1]);
      if (text) features.push(text);
    }
  }

  return {
    id,
    name,
    category,
    ribbonLabel,
    address: addressClean,
    phone,
    hours,
    priceRange: priceClean,
    parking,
    description,
    website,
    instagram,
    imageUrl,
    features,
  };
}

export async function fetchRestaurantDetail(
  id: number,
): Promise<RestaurantDetail | null> {
  try {
    const res = await fetch(`${BLUERIBBON_BASE_URL}/restaurants/${id}`, {
      headers: BLUERIBBON_HEADERS,
    });
    if (!res.ok) return null;
    const html = await res.text();
    return parseDetail(id, html);
  } catch {
    return null;
  }
}
