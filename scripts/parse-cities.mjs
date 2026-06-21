/**
 * @deprecated Use `npx tsx scripts/generate-cities.ts` (fonte: micro-regions.ts)
 */
import { execSync } from "child_process";
import path from "path";

const script = path.join("scripts", "generate-cities.ts");
execSync(`npx tsx ${script}`, { stdio: "inherit", cwd: path.resolve(".") });
