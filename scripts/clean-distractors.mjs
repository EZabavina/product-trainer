import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(__dirname, "../data/questions-source.txt");
const questionsPath = join(__dirname, "../js/questions.js");

const GENERIC_TAIL =
    /(?:\.\s*(?:Используется в дашбордах[^.]*\.|Часто применяют при сравнении когорт[^.]*\.|Такой расчёт удобен[^.]*\.|Подходит для операционного мониторинга[^.]*\.|Встречается в шаблонах финмоделей[^.]*\.|Применяется в продуктовой аналитике[^.]*\.|Используется в отчётности команды[^.]*\.|Учитывается при планировании экспериментов[^.]*\.|Такой подход часто встречается[^.]*\.|Показатель помогает сравнивать когорт[^.]*\.|Термин встречается в дашбордах[^.]*\.|Так интерпретируют данные многие команды[^.]*\.|Это распространённое заблуждение[^.]*\.|Формулировка звучит убедительно[^.]*\.|На первый взгляд логично[^.]*\.|Так можно интерпретировать данные[^.]*\.))+$/i;

function stripGenericTails(text) {
    let result = text.trim();
    if (!result || result === ".") return result;
    let prev;
    do {
        prev = result;
        result = result.replace(GENERIC_TAIL, "").trim();
        result = result.replace(
            /\s*;\s*применяют при планировании[^.]*\.?$/i,
            ""
        );
        result = result.replace(
            /\s*— разные разрезы базы пользователей и транзакций\.?$/i,
            ""
        );
        result = result.replace(
            /\s*\(при другой базе расчёта и периоде\)\.?$/i,
            ""
        );
        result = result.replace(
            /\s*\(альтернативная трактовка периода и базы расчёта\)\.?$/i,
            ""
        );
    } while (result !== prev);
    if (!/[.!?]$/.test(result)) result += ".";
    return result.replace(/\s+/g, " ").replace(/\.\s*\./g, ".").trim();
}

function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
}

function splitSentences(text) {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function topicContext(topic, question) {
    const q = question.toLowerCase();
    if (topic === "CustDev" || /интервью|респондент|скринер|mvp/i.test(q)) {
        return {
            tails: [
                "Важно отличать этап рекрутинга от самого интервью.",
                "На практике это путают с подготовкой к полевому исследованию.",
                "Так формулируют задачу до начала customer discovery."
            ]
        };
    }
    if (topic === "JTBD" || /jtbd|job|работ/i.test(q)) {
        return {
            tails: [
                "Это описывает продукт, а не работу, которую нанимают выполнить.",
                "Так путают JTBD с user story или персоной пользователя.",
                "Подход фокусируется на демографии, а не на контексте выполнения работы."
            ]
        };
    }
    if (topic === "Юнит-экономика" || /ltv|cac|arpu|юнит/i.test(q)) {
        return {
            tails: [
                "Формула смешивает базу расчёта: платящие vs все привлечённые.",
                "Так считают без когортного разреза и без gross margin.",
                "Показатель выглядит правдоподобно, но путает числитель и знаменатель."
            ]
        };
    }
    if (topic === "Финансовая модель" || /p&l|cash|burn|runway|mrr/i.test(q)) {
        return {
            tails: [
                "Это путают отчёт о прибылях с движением денежных средств.",
                "Так трактуют метрику без разделения OpEx и COGS.",
                "Формулировка смешивает начисления и фактические поступления денег."
            ]
        };
    }
    return {
        tails: [
            "Метрика считается иначе или на другой базе пользователей.",
            "Так путают похожие показатели из продуктовой аналитики.",
            "Определение близко к правильному, но неверно по сути расчёта."
        ]
    };
}

function expandWrong(wrong, correct, topic, question) {
    const targetMin = Math.floor(correct.length * 0.78);
    const targetMax = Math.ceil(correct.length * 1.05);
    let result = stripGenericTails(wrong);

    if (result.length >= targetMin && result.length <= targetMax) {
        return result;
    }

    const parts = splitSentences(result);
    const correctParts = splitSentences(correct);
    const ctx = topicContext(topic, question);

    if (parts.length === 1 && correctParts.length >= 2) {
        const tail = ctx.tails[hashStr(result) % ctx.tails.length];
        result = `${parts[0].replace(/\.$/, "")}. ${tail}`;
    } else if (parts.length >= 2) {
        const last = parts[parts.length - 1];
        if (last.length < 35) {
            parts[parts.length - 1] = ctx.tails[hashStr(last) % ctx.tails.length];
            result = parts.join(" ");
        }
    } else if (/=/.test(result) && result.length < targetMin) {
        const suffixes = [
            " — расчёт на другой базе пользователей.",
            " без учёта маржинальности и когортного разреза.",
            " при упрощённой методике без сегментации по каналам."
        ];
        result = result.replace(/\.$/, "") + suffixes[hashStr(result) % suffixes.length];
    } else if (result.length < targetMin) {
        const tail = ctx.tails[hashStr(result + topic) % ctx.tails.length];
        result = `${result.replace(/\.$/, "")}. ${tail}`;
    }

    if (result.length > targetMax + 30) {
        result = result.slice(0, targetMax + 10).replace(/[^.!?]*$/, "").trim();
        if (!/[.!?]$/.test(result)) result += ".";
    }

    return result.replace(/\s+/g, " ").trim();
}

// Strip padding from source options
let source = readFileSync(sourcePath, "utf8");
let stripped = 0;
source = source.replace(/^([A-D])\)\s*(.+)$/gm, (line, letter, text) => {
    const cleaned = stripGenericTails(text);
    if (cleaned !== text.trim()) stripped++;
    return `${letter}) ${cleaned}`;
});
writeFileSync(sourcePath, source);
console.log(`Stripped generic tails from ${stripped} options in source`);

execSync("node scripts/parse-questions.mjs", { cwd: join(__dirname, ".."), stdio: "inherit" });

const QUESTIONS = JSON.parse(
    readFileSync(questionsPath, "utf8").replace(/^const QUESTIONS = /, "").replace(/;\s*$/, "")
);

let changed = 0;
for (const q of QUESTIONS) {
    const correct = q.options[q.correct];
    q.options = q.options.map((opt, i) => {
        if (i === q.correct) return opt;
        const next = expandWrong(opt, correct, q.topic, q.question);
        if (next !== opt) changed++;
        return next;
    });
}

writeFileSync(questionsPath, `const QUESTIONS = ${JSON.stringify(QUESTIONS, null, 4)};\n`);

// Sync source from questions
let qIndex = 0;
source = readFileSync(sourcePath, "utf8");
source = source.replace(
    /\*\*(\d+)\.\s*(.+?)\*\*\s*\n([\s\S]*?)(?=\n\*\*\d+\.|$)/g,
    (block, num, title, body) => {
        const q = QUESTIONS[qIndex++];
        if (!q) return block;
        const lines = body.split("\n");
        const newLines = [];
        let optIdx = 0;
        for (const line of lines) {
            const m = line.match(/^([A-D])\)\s*(.+)/);
            if (m && optIdx < 4) {
                newLines.push(`${m[1]}) ${q.options[optIdx++]}`);
            } else {
                newLines.push(line);
            }
        }
        return `**${num}. ${title.trim()}**\n${newLines.join("\n")}`;
    }
);
writeFileSync(sourcePath, source);

console.log(`Rebalanced ${changed} wrong options`);
