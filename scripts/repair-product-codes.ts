/**
 * Atribui códigos TAV-001, TAV-002… na ordem da planilha e grava descrição.
 * Uso: npx tsx scripts/repair-product-codes.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { sheetToMatrix } from "../src/lib/products/import/spreadsheet-reader";
import { parseTavaresLayout } from "../src/lib/products/import/parse-tavares-layout";
import { tavaresProfile } from "../src/lib/products/import/profiles";
import {
  formatSequentialCode,
  normalizeProductName,
} from "../src/lib/products/internal-code";

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

function readCsvWorkbook(path: string) {
  const buffer = readFileSync(path);
  const asUtf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const text = asUtf8.includes("\uFFFD")
    ? new TextDecoder("latin1").decode(buffer)
    : asUtf8;
  return XLSX.read(text, { type: "string", raw: false, FS: ";" });
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenantId = process.env.DEFAULT_TENANT_ID!;

async function main() {
  const admin = createClient(supabaseUrl, serviceKey);
  const wb = readCsvWorkbook("data/planilha-tavares.csv");
  const parsed = parseTavaresLayout(
    "planilha-tavares.csv",
    sheetToMatrix(wb),
    tavaresProfile
  );

  const { data: products, error } = await admin
    .from("products")
    .select("id, internal_code, commercial_name")
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);

  const byName = new Map(
    (products ?? []).map((product) => [
      normalizeProductName(product.commercial_name),
      product,
    ])
  );

  console.log(`Planilha: ${parsed.rows.length} produtos`);

  // Fase 1: códigos temporários para evitar conflito de unique
  for (const product of products ?? []) {
    await admin
      .from("products")
      .update({ internal_code: `TMP-${product.id.slice(0, 8)}` })
      .eq("id", product.id);
  }

  // Fase 2: códigos finais TAV-001… e descrição
  let updated = 0;
  let missing = 0;

  for (let index = 0; index < parsed.rows.length; index++) {
    const row = parsed.rows[index];
    if (!row.commercial_name) continue;

    const product = byName.get(normalizeProductName(row.commercial_name));
    if (!product) {
      missing++;
      continue;
    }

    const code = formatSequentialCode("TAV", index + 1);
    const payload: Record<string, unknown> = {
      internal_code: code,
      description: row.description,
    };

    const { error: updateError } = await admin
      .from("products")
      .update(payload)
      .eq("id", product.id);

    if (updateError) {
      if (updateError.message.includes("description")) {
        const { error: retryError } = await admin
          .from("products")
          .update({ internal_code: code })
          .eq("id", product.id);
        if (retryError) {
          console.error(`${row.commercial_name}:`, retryError.message);
          continue;
        }
      } else {
        console.error(`${row.commercial_name}:`, updateError.message);
        continue;
      }
    }

    updated++;
  }

  console.log(`Códigos atualizados: ${updated}, não encontrados: ${missing}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
