import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchRestaurantDetail } from "@/app/_lib/scraper";
import { BLUERIBBON_BASE_URL } from "@/app/_lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await fetchRestaurantDetail(Number(id));
  if (!detail) return { title: "레스토랑을 찾을 수 없습니다" };
  return {
    title: `${detail.name} - 블루리본 근처 맛집`,
    description: detail.description ?? `${detail.name} 상세 정보`,
  };
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await fetchRestaurantDetail(Number(id));
  if (!detail) notFound();

  return (
    <div className="flex flex-1 flex-col items-center bg-background font-sans">
      <main className="w-full max-w-2xl px-5 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-primary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          목록으로
        </Link>

        {/* Hero Image */}
        {detail.imageUrl && (
          <div className="mb-6 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.imageUrl}
              alt={detail.name}
              className="h-48 w-full object-cover sm:h-64"
            />
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            {detail.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {detail.ribbonLabel && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {detail.ribbonLabel}
              </span>
            )}
            {detail.category && (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                {detail.category}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {detail.description && (
          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-primary">
              블루리본 Pick
            </h2>
            <p className="text-sm leading-relaxed text-zinc-700">
              {detail.description}
            </p>
          </div>
        )}

        {/* Info Card */}
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">
            기본 정보
          </h2>
          <div className="space-y-3.5">
            {detail.address && (
              <InfoRow icon="location" label={detail.address} />
            )}
            {detail.phone && (
              <div className="flex items-start gap-3">
                <InfoIcon type="phone" />
                <a
                  href={`tel:${detail.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {detail.phone}
                </a>
              </div>
            )}
            {detail.hours && (
              <InfoRow icon="time" label={detail.hours} multiline />
            )}
            {detail.priceRange && (
              <InfoRow icon="price" label={detail.priceRange} />
            )}
            {detail.parking && (
              <InfoRow icon="parking" label={detail.parking} />
            )}
          </div>
        </div>

        {/* Features */}
        {detail.features.length > 0 && (
          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">특징</h2>
            <div className="flex flex-wrap gap-2">
              {detail.features.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* External Links */}
        <div className="flex flex-wrap gap-3">
          {detail.instagram && (
            <ExternalLink href={detail.instagram} label="Instagram" />
          )}
          {detail.website && (
            <ExternalLink href={detail.website} label="웹사이트" />
          )}
          <ExternalLink
            href={`${BLUERIBBON_BASE_URL}/restaurants/${detail.id}`}
            label="블루리본에서 보기"
          />
        </div>
      </main>
    </div>
  );
}

function InfoIcon({ type }: { type: string }) {
  const paths: Record<string, string> = {
    location:
      "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z",
    phone:
      "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
    time: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z",
    price:
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.96-3.12 3.19z",
    parking:
      "M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z",
  };

  return (
    <svg
      className="mt-0.5 shrink-0 text-zinc-400"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={paths[type] ?? ""} />
    </svg>
  );
}

function InfoRow({
  icon,
  label,
  multiline,
}: {
  icon: string;
  label: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <InfoIcon type={icon} />
      {multiline ? (
        <span className="whitespace-pre-line text-sm text-zinc-700">
          {label}
        </span>
      ) : (
        <span className="text-sm text-zinc-700">{label}</span>
      )}
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary"
    >
      {label}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}
