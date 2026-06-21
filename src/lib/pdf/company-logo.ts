import fs from "fs";
import path from "path";

let cachedLogoDataUri: string | null = null;

function imageMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

export function getCompanyLogoDataUri(): string {
  if (cachedLogoDataUri) return cachedLogoDataUri;

  const logoPath = path.join(process.cwd(), "public", "logo-tc.jpg");
  const buffer = fs.readFileSync(logoPath);
  cachedLogoDataUri = `data:${imageMimeType(logoPath)};base64,${buffer.toString("base64")}`;
  return cachedLogoDataUri;
}
