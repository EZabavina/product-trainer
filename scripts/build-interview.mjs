import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scenarios = JSON.parse(
    readFileSync(join(__dirname, "../data/interview-scenarios.json"), "utf8")
);

    const publicScenarios = scenarios.map(
        ({ id, title, description, interviewType, respondentPreview, dossier }) => ({
            id,
            title,
            description,
            interviewType,
            respondentPreview,
            respondentName: dossier?.name || ""
        })
    );

const out = `// Generated from data/interview-scenarios.json — run: node scripts/build-interview.mjs
const INTERVIEW_SCENARIOS = ${JSON.stringify(publicScenarios, null, 4)};
`;
writeFileSync(join(__dirname, "../js/interview-scenarios.js"), out);
console.log(`Generated js/interview-scenarios.js (${publicScenarios.length} scenarios)`);
