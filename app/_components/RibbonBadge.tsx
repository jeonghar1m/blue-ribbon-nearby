import type { Restaurant } from "@/app/_lib/types";

const RIBBON_CONFIG: Record<
  string,
  { count: number; color: string; label: string }
> = {
  RIBBON_THREE: { count: 3, color: "text-ribbon-gold", label: "3리본" },
  RIBBON_TWO: { count: 2, color: "text-ribbon-silver", label: "2리본" },
  RIBBON_ONE: { count: 1, color: "text-ribbon-bronze", label: "1리본" },
};

export default function RibbonBadge({
  ribbonType,
}: {
  ribbonType: Restaurant["ribbonType"];
}) {
  const config = RIBBON_CONFIG[ribbonType];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 ${config.color}`}>
      {Array.from({ length: config.count }, (_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M5 2v18l7-3 7 3V2H5z" />
        </svg>
      ))}
      <span className="ml-1 text-xs font-semibold">{config.label}</span>
    </span>
  );
}
