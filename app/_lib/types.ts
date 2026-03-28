export interface Zone {
  zone1: string;
  zone2: string;
  zone2Lat: number;
  zone2Lng: number;
}

export interface Restaurant {
  id: number;
  name: string;
  ribbonType: "RIBBON_THREE" | "RIBBON_TWO" | "RIBBON_ONE" | "NEW";
  ribbonCount: number;
  bookYear: string | null;
  latitude: number;
  longitude: number;
  redRibbon: boolean;
  address: string;
  foodTypes: string[];
  foodDetailTypes: string[];
  distance?: number;
}

export interface RestaurantResponse {
  items: Restaurant[];
  total: number;
  capped: boolean;
}

export interface RestaurantDetail {
  id: number;
  name: string;
  category: string | null;
  ribbonLabel: string | null;
  address: string | null;
  phone: string | null;
  hours: string | null;
  priceRange: string | null;
  parking: string | null;
  description: string | null;
  website: string | null;
  instagram: string | null;
  imageUrl: string | null;
  features: string[];
}

export type RibbonFilter = "ALL" | "RIBBON_THREE" | "RIBBON_TWO" | "RIBBON_ONE";
export type DistanceOption = 500 | 1000 | 2000 | 5000;
