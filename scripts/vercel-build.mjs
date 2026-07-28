/**
 * Готовит public/ для Vercel Output Directory.
 * API остаётся в /api у корня репо (serverless).
 *
 * Для SPA-маршрутов (/knowledge, /stats, /train/...) кладём копии index.html,
 * чтобы прямой заход и возврат с мобилы не упирались в 404, даже если rewrite не сработает.
 */
import { cpSync, mkdirSync, rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public");

/** Должно совпадать с ROUTE_FORMATS в js/app.js */
const TRAIN_ROUTE_SEGMENTS = [
    ["quiz", "fin"],
    ["quiz", "jtbd"],
    ["quiz", "unit"],
    ["quiz", "custdev"],
    ["definitions", "metrics"],
    ["cases", "metrics"],
    ["calc", "unit"],
    ["lab", "unit"],
    ["interview", "custdev"]
];

const SPA_VIEW_ROUTES = ["knowledge", "stats"];

function writeSpaFallback(routeSegments) {
    const indexHtml = join(out, "index.html");
    if (!existsSync(indexHtml)) return;

    const parts = Array.isArray(routeSegments) ? routeSegments : [routeSegments];
    const dest = join(out, ...parts, "index.html");
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(indexHtml, dest);
}

if (existsSync(out)) rmSync(out, { recursive: true });
mkdirSync(out);

for (const item of ["index.html", "favicon.svg", "css", "js"]) {
    const from = join(root, item);
    if (!existsSync(from)) continue;
    cpSync(from, join(out, item), { recursive: true });
}

for (const route of SPA_VIEW_ROUTES) {
    writeSpaFallback(route);
}

for (const segments of TRAIN_ROUTE_SEGMENTS) {
    writeSpaFallback(["train", ...segments]);
}

console.log(
    `Prepared public/ for Vercel (${SPA_VIEW_ROUTES.length} views + ${TRAIN_ROUTE_SEGMENTS.length} train routes)`
);
