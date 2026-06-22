import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const questionsPath = join(__dirname, "../js/questions.js");
const sourcePath = join(__dirname, "../data/questions-source.txt");

const PADDING_PHRASES = [
    "Используется в дашбордах и еженедельных отчётах перед стейкхолдерами.",
    "Часто применяют при сравнении когорт и оценке эффективности каналов.",
    "Такой расчёт удобен для быстрой оценки, но требует уточнения методики.",
    "Подходит для операционного мониторинга на коротком горизонте планирования.",
    "Встречается в шаблонах финмоделей и презентациях для инвесторов."
];

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

function expandShowsClause(tail) {
    const t = tail.replace(/\.$/, "").trim();
    const variants = [
        `Показывает ${t} — показатель, который команда отслеживает в регулярной отчётности.`,
        `Показывает ${t}; на основе этого сравнивают когорты и каналы привлечения.`,
        `Показывает ${t} и используется при оценке эффективности продукта на горизонте периода.`
    ];
    return variants[hashStr(t) % variants.length];
}

function makeSecondSentence(firstClause, hint, correctSecond) {
    const first = firstClause.replace(/\.$/, "").trim();

    if (/показывает\s+/i.test(first)) {
        const tail = first.replace(/^.*показывает\s+/i, "");
        return expandShowsClause(tail);
    }

    if (/^нормально для/i.test(first)) {
        return `${first.charAt(0).toUpperCase() + first.slice(1)} — допустимый сценарий в отдельных продуктах и форматах лендингов.`;
    }

    if (/=/.test(first) && correctSecond) {
        return correctSecond.replace(/\.$/, "") + " (при другой базе расчёта и периоде).";
    }

    if (/интервью|респондент|скринер|custdev|mvp|гипотез/i.test(first)) {
        const variants = [
            "Используется на этапе подготовки к полевому исследованию и рекрутинга участников.",
            "Помогает структурировать контакт с пользователем до основной части исследования.",
            "Применяется в начале цикла discovery для фильтрации и фокусировки выборки."
        ];
        return variants[hashStr(first) % variants.length];
    }

    const generic = [
        "Применяется в продуктовой аналитике при оценке гипотез и приоритизации бэклога.",
        "Используется в отчётности команды для сравнения периодов и сегментов пользователей.",
        "Учитывается при планировании экспериментов и разборе воронки привлечения."
    ];
    return generic[hashStr(first + hint) % generic.length];
}

function topicHint(question, topic) {
    const q = question.toLowerCase();
    if (/custdev|интервью|mom test|mvp|респондент/i.test(q)) return "CustDev";
    if (/jtbd|job|работ/i.test(q)) return "JTBD";
    if (/ltv|cac|arpu|юнит|unit|марж|payback/i.test(q)) return "юнит-экономике";
    if (/fin|p&l|cash|burn|runway|mrr|arr|romi|roi/i.test(q)) return "финансовой модели";
    return topic || "продуктовой аналитике";
}

function isListAnswer(text) {
    return /,\s*[A-ZА-Я][a-zа-я]+,/.test(text) && text.split(",").length >= 3 && text.length < 90;
}

function hasDualDefinition(text) {
    const parts = splitSentences(text);
    if (parts.length >= 2 && parts.every((p) => /=/.test(p) || /—/.test(p))) return true;
    return /,\s*\w+.*(считает|равен|=)/i.test(text);
}

function expandWrongClause(clause, topicHint) {
    return makeSecondSentence(clause, topicHint, "");
}

function expandDualDefinition(wrong, correct) {
    const correctParts = splitSentences(correct);
    let wrongParts = splitSentences(wrong);

    if (/,\s*\w+/i.test(wrong) && wrongParts.length === 1) {
        const [left, right] = wrong.split(/,\s*/);
        if (right) {
            return `${left.trim().replace(/\.$/, "")}. ${right.trim().replace(/\.$/, "")} — разные разрезы базы пользователей и транзакций.`;
        }
    }

    if (wrongParts.length === 1 && correctParts.length >= 2) {
        const first = wrongParts[0].replace(/\.$/, "");
        if (/=/.test(first)) {
            const swapped = correctParts[1]
                .replace("Все пользователи", "Платящие пользователи")
                .replace("Только платящие", "Все привлечённые пользователи")
                .replace("Платящие", "Все пользователи");
            return `${first}. ${swapped.replace(/\.$/, "")}.`;
        }
        const second = makeSecondSentence(first, "метрик", correctParts[1]);
        return `${first}. ${second}`;
    }

    if (wrongParts.length >= 2 && wrongParts[1].length < correctParts[1].length * 0.75) {
        wrongParts[1] = makeSecondSentence(wrongParts[0], "метрик", correctParts[1]);
        return wrongParts.join(" ");
    }

    return wrong;
}

function expandListAnswer(text, correct) {
    const base = text.trim().replace(/\.$/, "");
    const suffixes = [
        " — воронка роста, но с другим порядком и названиями этапов.",
        " (модель AAARR), где этапы сгруппированы иначе, чем в классике Dave McClure.",
        " — набор метрик воронки, который путают с канонической пиратской моделью."
    ];
    let result = base + suffixes[hashStr(base) % suffixes.length];
    if (result.length < correct.length * 0.85) {
        result = result.replace(/\.$/, "") + " Используют для отчётности по привлечению и монетизации.";
    }
    return result;
}

function expandNumericAnswer(text) {
    const n = text.trim().replace(/\.$/, "");
    return `${n} респондентов — распространённый ориентир, но он не учитывает точку насыщения инсайтов в конкретном исследовании.`;
}

function balanceWrongOption(wrong, correct, question, topic, index) {
    const hint = topicHint(question, topic);
    const targetMin = Math.floor(correct.length * 0.78);
    const targetMax = Math.ceil(correct.length * 1.12);

    if (wrong.length >= targetMin && wrong.length <= targetMax) {
        return wrong;
    }

    let result = wrong.trim();
    const correctParts = splitSentences(correct);

    if (isListAnswer(result) || (correctParts.length === 1 && isListAnswer(correct))) {
        result = expandListAnswer(result, correct);
    }

    if (hasDualDefinition(correct)) {
        result = expandDualDefinition(result, correct);
    }

    if (/^\d+\.?$/.test(result.trim()) && result.length < 15) {
        result = expandNumericAnswer(result);
    }

    let parts = splitSentences(result);

    if (parts.length === 1 && correctParts.length >= 2) {
        const second = makeSecondSentence(parts[0], hint, correctParts[1]);
        result = `${parts[0].replace(/\.$/, "")}. ${second}`;
        parts = splitSentences(result);
    }

    if (parts.length === 1 && correctParts.length === 1 && /=/.test(parts[0])) {
        const suffixes = [
            " (формула для оценки на горизонте одного расчётного периода).",
            " — упрощённый расчёт без учёта маржинальности и когорт.",
            " при расчёте на уровне всей пользовательской базы за месяц."
        ];
        result = parts[0].replace(/\.$/, "") + suffixes[hashStr(parts[0]) % suffixes.length];
        parts = splitSentences(result);
    }

    if (parts.length >= 2) {
        const lastIdx = parts.length - 1;
        const correctLast = correctParts[correctParts.length - 1] || "";
        if (parts[lastIdx].length < Math.min(correctLast.length, targetMin) * 0.65) {
            parts[lastIdx] = makeSecondSentence(parts[0], hint, correctLast).replace(/\.$/, "");
            result = parts.join(" ");
        }
    }

    if (result.length < targetMin && !/custdev|интервью|screener|респондент|кейс:/i.test(question)) {
        const pad = PADDING_PHRASES[(hashStr(result) + index) % PADDING_PHRASES.length];
        if (!result.includes(pad)) {
            result = result.replace(/\.$/, "") + ". " + pad;
        }
    }

    if (result.length > targetMax + 50) {
        result = result.slice(0, targetMax + 20).replace(/[^.!?]*$/, "").trim();
        if (!/[.!?]$/.test(result)) result += ".";
    }

    return result.replace(/\s+/g, " ").trim();
}

// Parse from clean source
execSync("node scripts/parse-questions.mjs", { cwd: join(__dirname, ".."), stdio: "inherit" });

const questionsJs = readFileSync(questionsPath, "utf8");
const QUESTIONS = JSON.parse(
    questionsJs.replace(/^const QUESTIONS = /, "").replace(/;\s*$/, "")
);

let changed = 0;
for (const q of QUESTIONS) {
    const correctText = q.options[q.correct];
    q.options = q.options.map((opt, i) => {
        if (i === q.correct) return opt;
        const balanced = balanceWrongOption(opt, correctText, q.question, q.topic, i);
        if (balanced !== opt) changed++;
        return balanced;
    });
}

writeFileSync(questionsPath, `const QUESTIONS = ${JSON.stringify(QUESTIONS, null, 4)};\n`);

let sourceOut = readFileSync(sourcePath, "utf8");
let qIndex = 0;
sourceOut = sourceOut.replace(
    /\*\*(\d+)\.\s*(.+?)\*\*\s*\n([\s\S]*?)(?=\n\*\*\d+\.|$)/g,
    (block, num, title, body) => {
        const q = QUESTIONS[qIndex++];
        if (!q) return block;

        const lines = body.split("\n");
        const newLines = [];
        let optIdx = 0;

        for (const line of lines) {
            const optMatch = line.match(/^([A-D])\)\s*(.+)/);
            if (optMatch && optIdx < 4) {
                newLines.push(`${optMatch[1]}) ${q.options[optIdx]}`);
                optIdx++;
            } else {
                newLines.push(line);
            }
        }

        return `**${num}. ${title.trim()}**\n${newLines.join("\n")}`;
    }
);

writeFileSync(sourcePath, sourceOut);

console.log(`Balanced ${changed} wrong options across ${QUESTIONS.length} questions`);

let skewed = 0;
let copied = 0;
for (const q of QUESTIONS) {
    const correct = q.options[q.correct];
    const wrong = q.options.filter((_, i) => i !== q.correct);
    const wMax = Math.max(...wrong.map((w) => w.length));
    if (correct.length > wMax * 1.3 && correct.length - wMax > 25) skewed++;
    for (const w of wrong) {
        const cp = splitSentences(correct);
        const wp = splitSentences(w);
        if (wp.length >= 2 && cp.length >= 2 && wp[wp.length - 1] === cp[cp.length - 1]) copied++;
    }
}
console.log(`Remaining skewed: ${skewed}, copied clauses: ${copied}`);
