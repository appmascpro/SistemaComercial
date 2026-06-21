import fs from "fs";
import path from "path";
import {
  getAllServiceCityEntries,
  getMicroRegionsOrdered,
} from "../src/lib/service-cities/micro-regions";

const root = path.resolve(".");
const entries = getAllServiceCityEntries();

const jsonPath = path.join(root, "src/lib/service-cities/cities-sp.json");
fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify(entries, null, 2) + "\n");

const esc = (s: string) => s.replace(/'/g, "''");
const values = entries
  .map(
    (entry) =>
      `  ((SELECT id FROM public.tenants WHERE slug = 'empresa-principal' LIMIT 1), '${esc(entry.city)}', '${entry.state}', '${esc(entry.region)}')`
  )
  .join(",\n");

const sql = `-- Cidades de atuação comercial (SP) por micro-região — execute no Supabase SQL Editor
INSERT INTO public.service_cities (tenant_id, city, state, region)
VALUES
${values}
ON CONFLICT (tenant_id, city, state) DO UPDATE SET
  region = EXCLUDED.region,
  updated_at = now();
`;

fs.writeFileSync(
  path.join(root, "supabase/seed_service_cities.sql"),
  sql,
  "utf8"
);

const backfill = `-- Atualiza micro-região das cidades já cadastradas
${entries
  .map(
    (entry) =>
      `UPDATE public.service_cities SET region = '${esc(entry.region)}', updated_at = now() WHERE city = '${esc(entry.city)}' AND state = '${entry.state}';`
  )
  .join("\n")}
`;

fs.writeFileSync(
  path.join(root, "supabase/backfill_service_city_regions.sql"),
  backfill,
  "utf8"
);

console.log(`Generated ${entries.length} cities in ${getMicroRegionsOrdered().length} micro-regions`);
