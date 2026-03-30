import type { CategoryFilter, DistanceOption, RibbonFilter } from "./types";

export const BLUERIBBON_BASE_URL = "https://www.bluer.co.kr";

export const BLUERIBBON_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/html, */*",
  Referer: "https://www.bluer.co.kr/search",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
};

export const DISTANCE_OPTIONS: { value: DistanceOption; label: string }[] = [
  { value: 500, label: "500m" },
  { value: 1000, label: "1km" },
  { value: 2000, label: "2km" },
  { value: 5000, label: "5km" },
];

export const RIBBON_OPTIONS: { value: RibbonFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "RIBBON_THREE", label: "3리본" },
  { value: "RIBBON_TWO", label: "2리본" },
  { value: "RIBBON_ONE", label: "1리본" },
];

export const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "한식", label: "한식" },
  { value: "일식", label: "일식" },
  { value: "중식", label: "중식" },
  { value: "양식", label: "양식" },
  { value: "아시안", label: "아시안" },
  { value: "카페/디저트", label: "카페/디저트" },
  { value: "기타", label: "기타" },
];
