import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "data/unit-calc-scenarios.json"), "utf8");
const scenarios = JSON.parse(raw);

const out = `/** Generated from data/unit-calc-scenarios.json — node scripts/build-unit-calc.mjs */
const UNIT_CALC_SCENARIOS = ${JSON.stringify(scenarios, null, 4)};
`;

writeFileSync(join(root, "js/unit-calc-scenarios.js"), out);
console.log(`Built ${scenarios.length} unit-calc scenarios`);
