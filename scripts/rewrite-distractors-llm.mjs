/**
 * Пакетная переписка неверных вариантов через OpenRouter.
 * Верный ответ не меняется. Checkpoint: data/distractor-rewrite-checkpoint.json
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const questionsPath = join(root, "js/questions.js");
const sourcePath = join(root, "data/questions-source.txt");
const checkpointPath = join(root, "data/distractor-rewrite-checkpoint.json");
const BATCH = 3;

for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const MODELS = [
    "google/gemma-4-26b-a4b-it:free",
    "openai/gpt-oss-20b:free",
    "tencent/hy3:free"
];

const BANNED = [
    /не совпадает с определением/i,
    /соседний показатель/i,
    /Неверно: берут/i,
    /у показателя другой смысл/i,
    /ломает смысл/i,
    /неверная база/i,
    /подменяет нужн/i,
    /Здесь не «/i,
    /Метрика считается иначе/i,
    /Так путают похожие/i,
    /Определение близко к правильному/i,
    /Формула смешивает базу/i,
    /Так считают без когортного/i,
    /Так путают JTBD/i,
    /Важно отличать этап рекрутинга/i,
    /На практике это путают с подготовкой/i,
    /Так формулируют задачу до начала/i,
    /Это описывает продукт, а не работу/i,
    /Подход фокусируется на демографии/i,
    /Это путают отчёт о прибылях/i,
    /Так трактуют метрику без разделения/i,
    /Формулировка смешивает начисления/i,
    /Показатель выглядит правдоподобно/i,
    /слабый или вредный приём/i,
    /В юнит-расчёте/i,
    /В финмодели «/i,
    /В JTBD «/i,
    /В CustDev «/i
];

const QUESTIONS = JSON.parse(
    readFileSync(questionsPath, "utf8").replace(/^const QUESTIONS = /, "").replace(/;\s*$/, "")
);

function loadCheckpoint() {
    if (!existsSync(checkpointPath)) return {};
    return JSON.parse(readFileSync(checkpointPath, "utf8"));
}

function saveCheckpoint(data) {
    writeFileSync(checkpointPath, JSON.stringify(data, null, 2));
}

function needsRewrite(q) {
    const correct = q.options[q.correct];
    return q.options.some((o, i) => {
        if (i === q.correct) return false;
        if (BANNED.some((re) => re.test(o))) return true;
        if (o.length < correct.length * 0.55) return true;
        if (o.length > correct.length * 1.35) return true;
        return false;
    });
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

async function callModel(messages, model, maxTokens) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/EZabavina/product-trainer",
            "X-Title": "Product Trainer Distractor Rewrite"
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.65 })
    });
    if (!res.ok) {
        const t = await res.text();
        const err = new Error(`OpenRouter ${res.status}: ${t.slice(0, 160)}`);
        err.status = res.status;
        throw err;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error(`Empty from ${model}`);
    return content;
}

async function chat(messages, maxTokens = 3500) {
    let last;
    for (const model of MODELS) {
        const tokens = model.includes("hy3") ? Math.max(maxTokens, 4000) : maxTokens;
        for (let retry = 0; retry < 3; retry++) {
            try {
                return await callModel(messages, model, tokens);
            } catch (err) {
                last = err;
                console.warn(`  ${model}: ${err.message}`);
                if (err.status === 429) {
                    await sleep(8000 * (retry + 1));
                    continue;
                }
                if (err.status >= 500) {
                    await sleep(2000);
                    continue;
                }
                break;
            }
        }
    }
    throw last || new Error("all models failed");
}

function parseJson(text) {
    let t = text.trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) t = fence[1].trim();
    const start = t.indexOf("{") !== -1 && t.indexOf("{") < (t.indexOf("[") === -1 ? 9999 : t.indexOf("["))
        ? t.indexOf("{")
        : t.indexOf("[");
    if (start === -1) throw new Error("no JSON");
    if (t[start] === "{") {
        const end = t.lastIndexOf("}");
        return JSON.parse(t.slice(start, end + 1));
    }
    const end = t.lastIndexOf("]");
    return JSON.parse(t.slice(start, end + 1));
}

function validateDistractors(wrong, correct) {
    const cLen = correct.length;
    const issues = [];
    const seen = new Set();
    for (const w of wrong) {
        if (!w || w.length < 12) issues.push("too short");
        if (w === correct) issues.push("equals correct");
        if (seen.has(w)) issues.push("dup");
        seen.add(w);
        if (w.length < cLen * 0.45 || w.length > cLen * 1.5) issues.push(`len ${w.length}/${cLen}`);
        for (const re of BANNED) if (re.test(w)) issues.push("banned");
        if (/неверн(ый|ое|ая) ответ|это неправильн|на самом деле не/i.test(w)) issues.push("meta");
    }
    return issues;
}

function buildBatchPrompt(batch) {
    const items = batch
        .map((q, idx) => {
            const correct = q.options[q.correct];
            const cores = q.options.filter((_, i) => i !== q.correct).map((o) => o.slice(0, 100));
            return `### ITEM ${idx + 1}
id: ${q.id}
topic: ${q.topic}
question: ${q.question}
correct: ${correct}
old_wrong_ideas:
- ${cores[0] || "—"}
- ${cores[1] || "—"}
- ${cores[2] || "—"}`;
        })
        .join("\n\n");

    return `Ты редактор банка вопросов для продакт-менеджеров (русский).

Для каждого ITEM напиши ровно 3 неверных варианта ответа.

Правила для КАЖДОГО неверного варианта:
1. Максимально похож на correct по длине (±25%), структуре, тону и формату.
2. Правдоподобная ошибка, но фактически НЕВЕРНЫЙ.
3. Без мета-фраз («не совпадает с определением», «соседний показатель», «неверный ответ», «путают»).
4. Не копируй correct и не делай его слегка перефразированным правильным.
5. Варианты внутри одного вопроса должны отличаться по сути.

Верни ТОЛЬКО JSON-объект вида:
{"items":[{"id":1,"wrong":["...","...","..."]},{"id":4,"wrong":["...","...","..."]}]}

ITEMS:

${items}`;
}

function applyWrongs(q, wrongs) {
    const next = [...q.options];
    let wi = 0;
    for (let i = 0; i < 4; i++) {
        if (i === q.correct) continue;
        next[i] = wrongs[wi++];
    }
    return next;
}

function syncSource(questions) {
    let qIndex = 0;
    let source = readFileSync(sourcePath, "utf8");
    source = source.replace(
        /\*\*(\d+)\.\s*(.+?)\*\*\s*\n([\s\S]*?)(?=\n\*\*\d+\.|$)/g,
        (block, num, title, body) => {
            const q = questions[qIndex++];
            if (!q) return block;
            const lines = body.split("\n");
            const newLines = [];
            let optIdx = 0;
            for (const line of lines) {
                const m = line.match(/^([A-D])\)\s*(.+)/);
                if (m && optIdx < 4) newLines.push(`${m[1]}) ${q.options[optIdx++]}`);
                else newLines.push(line);
            }
            return `**${num}. ${title.trim()}**\n${newLines.join("\n")}`;
        }
    );
    writeFileSync(sourcePath, source);
}

function persistAll(checkpoint) {
    for (const q of QUESTIONS) {
        const w = checkpoint[String(q.id)];
        if (!w) continue;
        q.options = applyWrongs(q, w);
    }
    writeFileSync(questionsPath, `const QUESTIONS = ${JSON.stringify(QUESTIONS, null, 4)};\n`);
    syncSource(QUESTIONS);
}

async function rewriteBatch(batch) {
    const raw = await chat([{ role: "user", content: buildBatchPrompt(batch) }], 4500);
    const parsed = parseJson(raw);
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(items)) throw new Error("bad shape");

    const byId = new Map();
    for (const item of items) {
        const id = String(item.id);
        const wrong = (item.wrong || item.wrongs || item.options || []).map((s) =>
            String(s).replace(/\s+/g, " ").trim()
        );
        if (wrong.length !== 3) throw new Error(`id ${id}: need 3 wrongs`);
        const q = batch.find((x) => String(x.id) === id);
        if (!q) throw new Error(`unknown id ${id}`);
        const issues = validateDistractors(wrong, q.options[q.correct]);
        if (issues.length) throw new Error(`id ${id}: ${issues.join(", ")}`);
        byId.set(id, wrong);
    }
    for (const q of batch) {
        if (!byId.has(String(q.id))) throw new Error(`missing id ${q.id}`);
    }
    return byId;
}

async function main() {
    console.error(`
rewrite-distractors-llm.mjs: используйте только осознанно.
Предпочтительный безопасный путь: node scripts/fix-distractors.mjs
`);
    if (!process.env.OPENROUTER_API_KEY) {
        console.error("OPENROUTER_API_KEY missing");
        process.exit(1);
    }

    const checkpoint = loadCheckpoint();
    const todo = QUESTIONS.filter((q) => needsRewrite(q) && !checkpoint[String(q.id)]);
    console.log(`Need rewrite: ${todo.length}; checkpoint: ${Object.keys(checkpoint).length}`);

    let done = 0;
    for (let i = 0; i < todo.length; i += BATCH) {
        const batch = todo.slice(i, i + BATCH);
        const ids = batch.map((q) => q.id).join(",");
        process.stdout.write(`batch [${ids}]… `);
        let ok = false;
        for (let attempt = 0; attempt < 3 && !ok; attempt++) {
            try {
                const map = await rewriteBatch(batch);
                for (const [id, wrong] of map) checkpoint[id] = wrong;
                saveCheckpoint(checkpoint);
                done += batch.length;
                ok = true;
                console.log("ok");
            } catch (err) {
                console.warn(`\n  attempt ${attempt + 1}: ${err.message}`);
                await sleep(5000 * (attempt + 1));
            }
        }
        if (!ok) {
            console.log("FAIL — skip batch, will retry next run");
            saveCheckpoint(checkpoint);
        }
        // persist intermittently
        if (done > 0 && done % 15 < BATCH) persistAll(checkpoint);
        await sleep(2500);
    }

    persistAll(checkpoint);
    console.log(`Done. Checkpoint size: ${Object.keys(checkpoint).length}. Applied to questions.js`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
