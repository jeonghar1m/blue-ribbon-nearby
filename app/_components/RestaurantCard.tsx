import Link from "next/link";
import type { Restaurant } from "@/app/_lib/types";
import RibbonBadge from "./RibbonBadge";

export default function RestaurantCard({
  restaurant,
  distance,
}: {
  restaurant: Restaurant;
  distance?: number;
}) {
  const displayDistance =
    distance !== undefined
      ? distance < 1000
        ? `${Math.round(distance)}m`
        : `${(distance / 1000).toFixed(1)}km`
      : null;

  const foodLabel = restaurant.foodTypes?.[0] ?? "";

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-zinc-900">{restaurant.name}</h3>
        {displayDistance && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {displayDistance}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <RibbonBadge ribbonType={restaurant.ribbonType} />
        {foodLabel && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">
            {foodLabel}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-zinc-500 leading-relaxed truncate">
        {restaurant.address}
      </p>
    </Link>
  );
}
