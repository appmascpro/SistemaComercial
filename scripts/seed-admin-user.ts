/**
 * Cria o usuário administrador inicial no Supabase Auth + profiles.
 * Uso: npx tsx scripts/seed-admin-user.ts
 *
 * Variáveis opcionais no .env.local:
 *   SEED_ADMIN_EMAIL=admin@tcquimica.com.br
 *   SEED_ADMIN_PASSWORD=Tavares@2026
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

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

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenantId = process.env.DEFAULT_TENANT_ID!;
const email =
  process.env.SEED_ADMIN_EMAIL?.trim() ?? "admin@tcquimica.com.br";
const password =
  process.env.SEED_ADMIN_PASSWORD?.trim() ?? "Tavares@2026";

async function main() {
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    console.log(`Perfil já existe para ${email} (id: ${existingProfile.id})`);
    return;
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Administrador TC Química" },
    });

  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Falha ao criar usuário");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    tenant_id: tenantId,
    email,
    full_name: "Administrador TC Química",
    role: "admin",
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(`Falha ao criar profile: ${profileError.message}`);
  }

  console.log("Administrador criado com sucesso!");
  console.log(`  E-mail: ${email}`);
  console.log(`  Senha:  ${password}`);
  console.log(`  Tenant: ${tenantId}`);
  console.log("\nAltere a senha após o primeiro login.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
