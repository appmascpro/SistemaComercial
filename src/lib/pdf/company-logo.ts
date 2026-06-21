import fs from "fs";
import path from "path";

let cachedLogoDataUri: string | null = null;

export function getCompanyLogoDataUri(): string {
  if (cachedLogoDataUri) return cachedLogoDataUri;

  const logoPath = path.join(process.cwd(), "public", "logo-tcquimica.png");
  const buffer = fs.readFileSync(logoPath);
  cachedLogoDataUri = `data:image/png;base64,${buffer.toString("base64")}`;
  return cachedLogoDataUri;
}
