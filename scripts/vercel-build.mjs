/**
 * Готовит public/ для Vercel Output Directory.
 * API остаётся в /api у корня репо (serverless).
 */
import { cpSync, mkdirSync, rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public");

if (existsSync(out)) rmSync(out, { recursive: true });
mkdirSync(out);

for (const item of ["index.html", "favicon.svg", "css", "js"]) {
    const from = join(root, item);
    if (!existsSync(from)) continue;
    cpSync(from, join(out, item), { recursive: true });
}

console.log("Prepared public/ for Vercel");
