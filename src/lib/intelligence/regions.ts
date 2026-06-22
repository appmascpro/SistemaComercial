import {
  getMicroRegionBySlug,
  getMicroRegionForCity,
} from "@/lib/service-cities/micro-regions";

export interface ResolvedRegion {
  slug: string;
  name: string;
  expansionPriority: number | null;
}

export function buildServiceCityRegionMap(
  rows: { city: string; region: string | null }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.region) {
      map.set(row.city, row.region);
    }
  }
  return map;
}

export function resolveCustomerRegion(
  city: string | null,
  serviceCityMap: Map<string, string>
): ResolvedRegion {
  if (!city) {
    return {
      slug: "nao-informada",
      name: "Não informada",
      expansionPriority: null,
    };
  }

  const fromService = serviceCityMap.get(city);
  if (fromService) {
    const micro = getMicroRegionBySlug(fromService);
    return {
      slug: fromService,
      name: micro?.name ?? fromService,
      expansionPriority: micro?.expansionPriority ?? null,
    };
  }

  const micro = getMicroRegionForCity(city);
  if (micro) {
    return {
      slug: micro.slug,
      name: micro.name,
      expansionPriority: micro.expansionPriority,
    };
  }

  return {
    slug: "outros",
    name: "Outras regiões",
    expansionPriority: null,
  };
}
