import { fetchRestaurantDetail } from "@/app/_lib/scraper";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = Number(id);
  if (Number.isNaN(numId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const detail = await fetchRestaurantDetail(numId);
  if (!detail) {
    return Response.json({ error: "Restaurant not found" }, { status: 404 });
  }

  return Response.json(detail);
}
