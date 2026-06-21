/**
 * Aplica migrations RLS no Supabase (requer SUPABASE_DB_URL no .env.local).
 * Formato: postgresql://postgres.[ref]:[SENHA]@aws-0-[regiao].pooler.supabase.com:6543/postgres
 *
 * Uso: npx tsx scripts/apply-rls-migration.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

async function main() {
  loadEnvLocal();
  const dbUrl = process.env.SUPABASE_DB_URL?.trim();
  if (!dbUrl) {
    console.error(
      "Defina SUPABASE_DB_URL no .env.local (Connection string do Supabase → Database → URI)."
    );
    process.exit(1);
  }

  const { Client } = await import("pg");
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const files = [
    "supabase/migrations/003_profiles_rls.sql",
    "supabase/migrations/004_tenant_rls.sql",
  ];

  for (const file of files) {
    const sql = readFileSync(resolve(process.cwd(), file), "utf8");
    console.log(`Aplicando ${file}...`);
    await client.query(sql);
    console.log(`OK: ${file}`);
  }

  await client.end();
  console.log("RLS aplicado com sucesso.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
