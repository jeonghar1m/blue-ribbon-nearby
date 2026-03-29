"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  Zone,
  Restaurant,
  RibbonFilter,
  DistanceOption,
} from "@/app/_lib/types";
import { DISTANCE_OPTIONS, RIBBON_OPTIONS } from "@/app/_lib/constants";
import { haversineDistance } from "@/app/_lib/geo";
import RestaurantCard from "./RestaurantCard";

const SESSION_KEY = "brn_search_state";

interface SavedState {
  query: string;
  restaurants: Restaurant[];
  ribbonFilter: RibbonFilter;
  distance: DistanceOption;
  gpsCoords: { lat: number; lng: number } | null;
  searchCenter: { lat: number; lng: number } | null;
  searchMode: "zone" | "gps" | null;
  lastZone: Zone | null;
  searched: boolean;
  currentPage: number;
}

function loadSavedState(): SavedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as SavedState;
  } catch {
    // ignore
  }
  return null;
}

export default function SearchSection() {
  const saved = useRef(loadSavedState());

  const [query, setQuery] = useState(saved.current?.query ?? "");
  const [zones, setZones] = useState<Zone[]>([]);
  const [showZoneList, setShowZoneList] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(
    saved.current?.restaurants ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ribbonFilter, setRibbonFilter] = useState<RibbonFilter>(
    saved.current?.ribbonFilter ?? "ALL",
  );
  const [distance, setDistance] = useState<DistanceOption>(
    saved.current?.distance ?? 1000,
  );
  const [gpsCoords, setGpsCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(saved.current?.gpsCoords ?? null);
  const [searchCenter, setSearchCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(saved.current?.searchCenter ?? null);
  const [searchMode, setSearchMode] = useState<"zone" | "gps" | null>(
    saved.current?.searchMode ?? null,
  );
  const [lastZone, setLastZone] = useState<Zone | null>(
    saved.current?.lastZone ?? null,
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searched, setSearched] = useState(saved.current?.searched ?? false);
  const [currentPage, setCurrentPage] = useState(
    saved.current?.currentPage ?? 1,
  );

  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!searched) return;
    try {
      const state: SavedState = {
        query,
        restaurants,
        ribbonFilter,
        distance,
        gpsCoords,
        searchCenter,
        searchMode,
        lastZone,
        searched,
        currentPage,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [
    query,
    restaurants,
    ribbonFilter,
    distance,
    gpsCoords,
    searchCenter,
    searchMode,
    lastZone,
    searched,
    currentPage,
  ]);

  const fetchRestaurantsByZone = useCallback(
    async (zone: Zone, dist: DistanceOption, ribbon: RibbonFilter) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          zone1: zone.zone1,
          zone2: zone.zone2,
          zone2Lat: String(zone.zone2Lat),
          zone2Lng: String(zone.zone2Lng),
          distance: String(dist),
          ...(ribbon !== "ALL" && { ribbonType: ribbon }),
        });
        const res = await fetch(`/api/restaurants?${params}`);
        if (!res.ok) throw new Error("검색에 실패했습니다");
        const data = await res.json();
        setRestaurants(data.items ?? []);
        setSearchCenter({ lat: zone.zone2Lat, lng: zone.zone2Lng });
        setSearched(true);
        setCurrentPage(1);
      } catch {
        setError("레스토랑 검색에 실패했습니다. 다시 시도해 주세요.");
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchRestaurantsByGps = useCallback(
    async (
      lat: number,
      lng: number,
      dist: DistanceOption,
      ribbon: RibbonFilter,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          latitude: String(lat),
          longitude: String(lng),
          distance: String(dist),
          ...(ribbon !== "ALL" && { ribbonType: ribbon }),
        });
        const res = await fetch(`/api/restaurants?${params}`);
        if (!res.ok) throw new Error("검색에 실패했습니다");
        const data = await res.json();
        setRestaurants(data.items ?? []);
        setSearchCenter({ lat, lng });
        setSearched(true);
        setCurrentPage(1);
      } catch {
        setError("레스토랑 검색에 실패했습니다. 다시 시도해 주세요.");
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setShowZoneList(false);
    setSearchMode("zone");

    try {
      const res = await fetch(
        `/api/zones?query=${encodeURIComponent(query.trim())}`,
      );
      if (!res.ok) throw new Error("존 검색에 실패했습니다");
      const data: Zone[] = await res.json();

      if (data.length === 0) {
        setError("검색 결과가 없습니다. 다른 지역명을 입력해 주세요.");
        setRestaurants([]);
        setLoading(false);
        setSearched(true);
        return;
      }

      if (data.length === 1) {
        setLastZone(data[0]);
        await fetchRestaurantsByZone(data[0], distance, ribbonFilter);
      } else {
        setZones(data);
        setShowZoneList(true);
        setLoading(false);
      }
    } catch {
      setError("검색에 실패했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  const handleZoneSelect = async (zone: Zone) => {
    setShowZoneList(false);
    setLastZone(zone);
    setQuery(zone.zone2);
    await fetchRestaurantsByZone(zone, distance, ribbonFilter);
  };

  const handleGps = async () => {
    if (!navigator.geolocation) {
      setError("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    setGpsLoading(true);
    setError(null);
    setSearchMode("gps");
    setShowZoneList(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGpsCoords(coords);
        setGpsLoading(false);
        setQuery("");
        await fetchRestaurantsByGps(
          coords.lat,
          coords.lng,
          distance,
          ribbonFilter,
        );
      },
      () => {
        setError("위치 정보를 가져올 수 없습니다. 위치 접근을 허용해 주세요.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleDistanceChange = async (newDist: DistanceOption) => {
    setDistance(newDist);
    if (searchMode === "zone" && lastZone) {
      await fetchRestaurantsByZone(lastZone, newDist, ribbonFilter);
    } else if (searchMode === "gps" && gpsCoords) {
      await fetchRestaurantsByGps(
        gpsCoords.lat,
        gpsCoords.lng,
        newDist,
        ribbonFilter,
      );
    }
  };

  const handleRibbonChange = async (newRibbon: RibbonFilter) => {
    setRibbonFilter(newRibbon);
    if (searchMode === "zone" && lastZone) {
      await fetchRestaurantsByZone(lastZone, distance, newRibbon);
    } else if (searchMode === "gps" && gpsCoords) {
      await fetchRestaurantsByGps(
        gpsCoords.lat,
        gpsCoords.lng,
        distance,
        newRibbon,
      );
    }
  };

  const filteredRestaurants = restaurants.filter(
    (r) => r.ribbonType !== "NEW",
  );

  const sortedRestaurants = searchCenter
    ? [...filteredRestaurants].sort((a, b) => {
        const da = haversineDistance(
          searchCenter.lat,
          searchCenter.lng,
          a.latitude,
          a.longitude,
        );
        const db = haversineDistance(
          searchCenter.lat,
          searchCenter.lng,
          b.latitude,
          b.longitude,
        );
        return da - db;
      })
    : filteredRestaurants;

  const totalPages = Math.ceil(sortedRestaurants.length / PAGE_SIZE);
  const pagedRestaurants = sortedRestaurants.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const getPageItems = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta;
    const items: (number | "...")[] = [];

    items.push(1);
    if (left > 2) items.push("...");
    for (let i = Math.max(2, left); i <= Math.min(totalPages - 1, right); i++) {
      items.push(i);
    }
    if (right < totalPages - 1) items.push("...");
    items.push(totalPages);

    return items;
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="지역명으로 검색 (예: 강남역, 광화문)"
              className="w-full rounded-xl border border-zinc-300 bg-white py-3.5 pl-11 pr-4 text-base outline-none transition-colors placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="shrink-0 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
          >
            검색
          </button>
        </div>
      </form>

      {/* GPS Button */}
      <button
        onClick={handleGps}
        disabled={gpsLoading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      >
        {gpsLoading ? (
          <svg
            className="h-5 w-5 animate-spin text-primary"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-75"
            />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        )}
        {gpsLoading ? "위치 확인 중..." : "현재 위치로 찾기"}
      </button>

      {/* Zone Selection List */}
      {showZoneList && zones.length > 0 && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white shadow-sm">
          <p className="border-b border-zinc-100 px-4 py-3 text-sm font-medium text-zinc-600">
            검색 결과가 여러 곳입니다. 지역을 선택해 주세요.
          </p>
          <div className="max-h-60 overflow-y-auto">
            {zones.map((zone) => (
              <button
                key={`${zone.zone1}-${zone.zone2}`}
                onClick={() => handleZoneSelect(zone)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-50"
              >
                <span className="text-zinc-400">{zone.zone1}</span>
                <span className="font-medium text-zinc-800">{zone.zone2}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {searched && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Ribbon Filter */}
          <div className="flex gap-1.5">
            {RIBBON_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleRibbonChange(opt.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  ribbonFilter === opt.value
                    ? "bg-primary text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Distance Filter */}
          <div className="flex gap-1.5">
            {DISTANCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleDistanceChange(opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  distance === opt.value
                    ? "bg-primary text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-6">
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5"
              >
                <div className="h-5 w-2/3 rounded bg-zinc-200" />
                <div className="mt-3 h-4 w-1/3 rounded bg-zinc-100" />
                <div className="mt-3 h-4 w-full rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && searched && sortedRestaurants.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
            <p className="text-zinc-500">검색 결과가 없습니다</p>
            <p className="mt-1 text-sm text-zinc-400">
              검색 범위를 넓히거나 다른 지역을 검색해 보세요
            </p>
          </div>
        )}

        {!loading && !error && sortedRestaurants.length > 0 && (
          <>
            <p className="mb-4 text-sm font-medium text-zinc-600">
              근처 맛집{" "}
              <span className="text-primary">{sortedRestaurants.length}</span>곳
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {pagedRestaurants.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  distance={
                    searchCenter
                      ? haversineDistance(
                          searchCenter.lat,
                          searchCenter.lng,
                          r.latitude,
                          r.longitude,
                        )
                      : undefined
                  }
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  이전
                </button>
                {getPageItems().map((item, i) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-1 py-2 text-sm text-zinc-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                        item === currentPage
                          ? "bg-primary text-white"
                          : "border border-zinc-300 bg-white text-zinc-700 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
