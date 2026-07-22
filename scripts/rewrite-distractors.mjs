/**
 * Убирает повторяющиеся шаблонные хвосты у неверных вариантов.
 * Верные ответы не меняет. Короткие осмысленные формулировки оставляет как есть;
 * только совсем голые ярлыки/формулы слегка разворачивает уникальной фразой с самим ярлыком внутри.
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const questionsPath = join(root, "js/questions.js");
const sourcePath = join(root, "data/questions-source.txt");

/** Точные хвосты, которые раньше массово дописывал clean-distractors */
const EXACT_TAILS = [
    "Метрика считается иначе или на другой базе пользователей.",
    "Так путают похожие показатели из продуктовой аналитики.",
    "Определение близко к правильному, но неверно по сути расчёта.",
    "Это описывает продукт, а не работу, которую нанимают выполнить.",
    "Так путают JTBD с user story или персоной пользователя.",
    "Подход фокусируется на демографии, а не на контексте выполнения работы.",
    "Формула смешивает базу расчёта: платящие vs все привлечённые.",
    "Так считают без когортного разреза и без gross margin.",
    "Показатель выглядит правдоподобно, но путает числитель и знаменатель.",
    "Это путают отчёт о прибылях с движением денежных средств.",
    "Так трактуют метрику без разделения OpEx и COGS.",
    "Формулировка смешивает начисления и фактические поступления денег.",
    "Важно отличать этап рекрутинга от самого интервью.",
    "На практике это путают с подготовкой к полевому исследованию.",
    "Так формулируют задачу до начала customer discovery.",
    "Помогает структурировать контакт с пользователем до основной части исследования.",
    "Применяется в начале цикла discovery для фильтрации и фокусировки выборки.",
    "Используется на этапе подготовки к полевому исследованию и рекрутинга участников."
];

const SUFFIX_TAILS = [
    " — расчёт на другой базе пользователей.",
    " без учёта маржинальности и когортного разреза.",
    " при упрощённой методике без сегментации по каналам."
];

function finalize(text) {
    let r = String(text || "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\s+([.,!?])/g, "$1")
        .replace(/\.\s*\./g, ".");
    if (r && !/[.!?]$/.test(r)) r += ".";
    return r;
}

function stripExactTail(text) {
    let result = text.trim();
    let changed = true;
    while (changed) {
        changed = false;
        for (const tail of EXACT_TAILS) {
            if (result.endsWith(tail)) {
                result = result.slice(0, -tail.length).trim();
                changed = true;
            } else if (result.endsWith(" " + tail)) {
                result = result.slice(0, -(tail.length + 1)).trim();
                changed = true;
            }
            // хвост после точки-разделителя
            const sep = ". " + tail;
            if (result.endsWith(sep)) {
                result = result.slice(0, -sep.length).trim();
                if (result && !/[.!?]$/.test(result)) result += ".";
                changed = true;
            }
        }
        for (const suf of SUFFIX_TAILS) {
            if (result.endsWith(suf) || result.endsWith(suf.replace(/\.$/, ""))) {
                result = result.slice(0, -suf.length).trim();
                changed = true;
            }
        }
    }
    return finalize(result);
}

function isBareLabel(text) {
    const t = text.replace(/[.!?]$/, "").trim();
    if (t.length < 10) return true;
    // Только «голые» латинские формулы/ярлыки вроде MAU / DAU, LTV / 3
    if (t.length <= 45 && /^[A-Za-z0-9 /+\-×÷=%()]+$/.test(t)) return true;
    // Очень короткий обрубок без контекста
    if (t.length <= 18 && !/\s/.test(t)) return true;
    return false;
}

function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
}

function expandBareLabel(label, topic, seed) {
    const c = label.replace(/[.!?]$/, "").trim();
    // Каждый вариант включает сам ярлык → полные строки почти не дублируются
    const byTopic = {
        Метрики: [
            `Неверно: берут «${c}» вместо нужной метрики.`,
            `«${c}» — соседний показатель, не ответ на этот вопрос.`,
            `Так ошибочно записывают формулу/смысл: ${c}.`,
            `Вариант «${c}» путает эту метрику с похожей.`,
            `Ответ «${c}» не совпадает с определением из вопроса.`,
            `Здесь не «${c}»: у показателя другой смысл и база.`
        ],
        "Юнит-экономика": [
            `В юнит-расчёте «${c}» — неверная база или формула.`,
            `«${c}» подменяет нужный юнит-показатель.`,
            `Считать как «${c}» здесь нельзя.`,
            `Вариант «${c}» смешивает CAC/LTV/ARPU с другим срезом.`,
            `Ответ «${c}» ломает смысл юнит-экономики в вопросе.`,
            `Не «${c}»: другая формула и другая интерпретация.`
        ],
        "Финансовая модель": [
            `В финмодели «${c}» — другой термин или другой блок отчёта.`,
            `«${c}» путает P&L, cash или операционные статьи.`,
            `Вариант «${c}» неверно читает отчётность.`,
            `Ответ «${c}» подменяет нужную финансовую категорию.`,
            `Не «${c}»: смысл в модели другой.`,
            `Так ошибочно помечают статью: ${c}.`
        ],
        JTBD: [
            `В JTBD «${c}» ближе к продукту/персоне, чем к Job.`,
            `«${c}» — не Job Statement для этого вопроса.`,
            `Вариант «${c}» уводит от работы к решению или демографии.`,
            `Ответ «${c}» не про работу, которую «нанимают».`,
            `Не «${c}»: в JTBD критерий другой.`,
            `Так подменяют Job: ${c}.`
        ],
        CustDev: [
            `В CustDev «${c}» — слабый или вредный приём для этого случая.`,
            `«${c}» больше про гипотезы/продажу, чем про прошлый опыт.`,
            `Вариант «${c}» не соответствует Mom Test в контексте вопроса.`,
            `Ответ «${c}» путает подготовку и само интервью.`,
            `Не «${c}»: для discovery нужен другой ход.`,
            `Так обычно получают комплименты вместо фактов: ${c}.`
        ]
    };
    const pool = byTopic[topic] || byTopic["Метрики"];
    return finalize(pool[seed % pool.length]);
}

const QUESTIONS = JSON.parse(
    readFileSync(questionsPath, "utf8").replace(/^const QUESTIONS = /, "").replace(/;\s*$/, "")
);

let stripped = 0;
let expanded = 0;
const wrongCount = new Map();

for (let qi = 0; qi < QUESTIONS.length; qi++) {
    const q = QUESTIONS[qi];
    q.options = q.options.map((opt, i) => {
        if (i === q.correct) return opt;
        let next = stripExactTail(opt);
        if (next !== opt) stripped++;
        if (isBareLabel(next)) {
            next = expandBareLabel(next, q.topic, hashStr(`${qi}|${i}|${next}|${q.id}`));
            expanded++;
        }
        wrongCount.set(next, (wrongCount.get(next) || 0) + 1);
        return next;
    });
}

writeFileSync(questionsPath, `const QUESTIONS = ${JSON.stringify(QUESTIONS, null, 4)};\n`);

let qIndex = 0;
let source = readFileSync(sourcePath, "utf8");
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

const leftovers = EXACT_TAILS.map((t) => {
    const n = (readFileSync(questionsPath, "utf8").match(
        new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    ) || []).length;
    return [t, n];
}).filter(([, n]) => n > 0);

const dups = [...wrongCount.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);

console.log(`Stripped tails from ${stripped} wrong options; expanded ${expanded} bare labels`);
console.log("Exact boilerplate leftovers:", leftovers.length ? leftovers : "none");
console.log("Duplicate wrong options:", dups.length ? dups.slice(0, 8) : "none");

execSync("node scripts/validate-questions.mjs", { cwd: root, stdio: "inherit" });
