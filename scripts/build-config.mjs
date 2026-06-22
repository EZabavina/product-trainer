import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const topics = JSON.parse(readFileSync(join(__dirname, "../data/topics.json"), "utf8"));

const configJs = `// Generated from data/topics.json — run: node scripts/build-config.mjs
const TOPIC_CONFIG = ${JSON.stringify(
    topics.map(({ maxQuestion, ...t }) => t),
    null,
    4
)};

function getTopicConfig(name) {
    return TOPIC_CONFIG.find((t) => t.name === name) || {
        id: name,
        name,
        icon: "📚",
        color: "#64748B",
        description: ""
    };
}

function getActiveTopics() {
    const withQuestions = new Set(QUESTIONS.map((q) => q.topic));
    return TOPIC_CONFIG.filter((t) => withQuestions.has(t.name));
}
`;

writeFileSync(join(__dirname, "../js/config.js"), configJs);
console.log(`Generated js/config.js from ${topics.length} topics`);
