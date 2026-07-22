import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function run(script) {
    const result = spawnSync(process.execPath, [join(__dirname, script)], {
        stdio: "inherit"
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

run("build-config.mjs");
run("parse-questions.mjs");
run("build-interview.mjs");
