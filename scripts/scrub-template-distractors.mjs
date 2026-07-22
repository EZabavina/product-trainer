/**
 * Снимает повторяющиеся шаблоны expandBare / fix-distractors с неверных ответов.
 * Восстанавливает смысловое ядро; для пустых/мета-вариантов подставляет уникальный текст.
 */
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const questionsPath = join(root, "js/questions.js");
const sourcePath = join(root, "data/questions-source.txt");

const STRIPPERS = [
    [/^Считать\s+(.+?)\s+ответом на вопрос\s*[—-]\s*значит выбрать неверный финансовый срез\.?$/i, "$1"],
    [/^(.+?)\s*[—-]\s*другой тип отчёта\/статьи: путают P&L, cash flow или баланс\.?$/i, "$1"],
    [/^(.+?):\s*в модели так часто подписывают блок, хотя смысл и состав строк другие\.?$/i, "$1"],
    [/^(.+?)\s+смешивает начисления и живые деньги либо OpEx и COGS\.?$/i, "$1"],
    [/^(.+?)\s*[—-]\s*соседний KPI, но формула и управленческий смысл другие\.?$/i, "$1"],
    [/^(.+?):\s*похожий индикатор из продуктовой аналитики, однако считает не то поведение\.?$/i, "$1"],
    [/^Берут\s+(.+?)\s+вместо нужной метрики и оптимизируют охват или vanity-рост\.?$/i, "$1"],
    [/^(.+?)\s+выглядит убедительно на дашборде, но не отвечает на вопрос этого определения\.?$/i, "$1"],
    [/^(.+?)\s+не является юнит-метрикой: нет связки выручки, затрат и одного клиента\.?$/i, "$1"],
    [/^(.+?)\s*[—-]\s*соседний расчёт, но без LTV\/CAC\/маржи на юнит экономика не сходится\.?$/i, "$1"],
    [/^Если ответить «(.+?)», путают юнит с оперметрикой или рыночным анализом\.?$/i, "$1"],
    [/^(.+?)\s+не показывает прибыльность одного клиента с учётом привлечения и удержания\.?$/i, "$1"],
    [/^(.+?)\s*[—-]\s*не Jobs-to-be-Done: фокус не на работе, которую «нанимают» продукт выполнить\.?$/i, "$1"],
    [/^(.+?)\s+ближе к процессу разработки\/дизайна, чем к Job Statement и switch\.?$/i, "$1"],
    [/^Свести JTBD к «(.+?)»\s*[—-]\s*потерять Forces of Progress и контекст работы\.?$/i, "$1"],
    [/^(.+?)\s+не объясняет, какую работу пользователь пытается сделать в ситуации прогресса\.?$/i, "$1"],
    [/^(.+?)\s*[—-]\s*не Customer Development: нет цикла гипотеза\s*[→>-]\s*интервью\s*[→>-]\s*обучение\.?$/i, "$1"],
    [/^(.+?)\s+может быть инструментом рядом, но автором и сутью CustDev не является\.?$/i, "$1"],
    [/^Свести CustDev к «(.+?)»\s*[—-]\s*подменить проверку гипотез узкой активностью\.?$/i, "$1"],
    [/^(.+?)\s+не описывает методологию Бланка по валидации продукта с клиентами\.?$/i, "$1"],
    [/^В финмодели «(.+?)»\s*[—-]\s*другой термин или другой блок отчёта\.?$/i, "$1"],
    [/^Не «(.+?)»:\s*другая формула и другая интерпретация\.?$/i, "$1"],
    [/^«(.+?)»\s+подменяет нужный юнит-показатель\.?$/i, "$1"],
    [/^Вариант «(.+?)»\s+смешивает CAC\/LTV\/ARPU с другим срезом\.?$/i, "$1"],
    [/^Считать как «(.+?)» здесь нельзя\.?$/i, "$1"],
    [/\s+На практике такой ответ путают с правильным из[‑-]за похожей(?: терминологии)?\.?$/i, ""],
    [/\s+Для команды это ведёт к другому next step в приоритезации\.?$/i, ""],
    [/\s+В отличие от верного определения, здесь нет того же критерия успеха\.?$/i, ""],
    [/\s*\(«[^»]{1,40}»\)\.?$/i, ""],
    [/\s*[—-]\s*и усилить канал\/решение, считая разовый эффект системным ростом\.?$/i, ""],
    [/\s+и не разбирать альтернативные объяснения метрики\.?$/i, ""],
    [/^Сделать ставку на «(.+?)»(?: и не разбирать альтернативные объяснения метрики)?\.?$/i, "$1"],
    [/\s+Часто рисуют «на глаз», забывая, что часть LTV уйдёт в COGS и операционку\.?$/i, ""],
    [/\s+При таком ориентире легко принять убыточный сегмент за здоровый unit\.?$/i, ""],
    [/\s+Выглядит красиво на слайде, но не рабочий ориентир окупаемости канала\.?$/i, ""],
    [/\s*[—-]\s*распространённая, но неверная трактовка в теме «[^»]+»\.?$/i, ""],
    [/\s+Автор:\s*.+\(неверная атрибуция для этого метода\)\.?$/i, ""]
];

const MANUAL = {
    116: {
        3: "Налоги — их разносят на каждый юнит как переменные."
    },
    126: {
        1: "LTV / CAC.",
        2: "LTV - CAC."
    },
    131: {
        0: "20$.",
        2: "100$.",
        3: "10$."
    },
    133: {
        0: "2000$.",
        2: "100$.",
        3: "500$."
    },
    136: {
        0: "Да, CAC окупится за первую покупку."
    },
    60: {
        2: "Выручка."
    }
};

function fin(t) {
    let r = String(t || "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\s+([.,!?])/g, "$1")
        .replace(/\.\s*\./g, ".");
    // unwrap leftover quotes that became the whole answer
    const qm = r.match(/^«(.+)»\.?$/);
    if (qm) r = qm[1].trim();
    if (r && !/[.!?]$/.test(r) && r.length > 12) r += ".";
    else if (r && !/[.!?]$/.test(r) && /^\d/.test(r)) {
        /* keep short numeric answers without forced period if already has $ */
    } else if (r && !/[.!?]$/.test(r)) r += ".";
    return r;
}

function stripTemplates(text) {
    let r = text.trim();
    let prev;
    do {
        prev = r;
        for (const [re, rep] of STRIPPERS) {
            if (typeof rep === "string") r = r.replace(re, rep).trim();
            else r = r.replace(re, rep).trim();
        }
        // broken glue leftovers from truncated expandBare
        r = r.replace(/\s+определения, здесь н\S*$/i, "").trim();
        r = r.replace(/\s+определения, здесь нет того же\.?$/i, "").trim();
    } while (r !== prev);
    return fin(r);
}

const raw = readFileSync(questionsPath, "utf8");
const QUESTIONS = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));

let changed = 0;
const usedGlobal = new Map(); // text -> count for soft warn

for (const q of QUESTIONS) {
    const correct = q.options[q.correct];
    const used = new Set([correct]);

    q.options = q.options.map((o, idx) => {
        if (idx === q.correct) return o;

        let next = MANUAL[q.id]?.[idx] ?? stripTemplates(o);

        if (!next || next.length < 2 || next === ".") {
            next = fin(`Неверный вариант по теме «${q.topic}»`);
        }

        // de-dupe within question
        if (used.has(next)) {
            next = fin(`${next.replace(/[.!?]$/, "")} (другая трактовка)`);
        }
        if (used.has(next)) {
            next = fin(`${next.replace(/[.!?]$/, "")} · ${q.id}.${idx}`);
        }

        if (next !== o) changed++;
        used.add(next);
        usedGlobal.set(next, (usedGlobal.get(next) || 0) + 1);
        return next;
    });
}

writeFileSync(questionsPath, `const QUESTIONS = ${JSON.stringify(QUESTIONS, null, 4)};\n`);

// sync A-D lines in source by question id
let source = readFileSync(sourcePath, "utf8");
const byId = new Map(QUESTIONS.map((q) => [String(q.id), q]));
source = source.replace(
    /\*\*(\d+)\.\s*(.+?)\*\*\s*\n([\s\S]*?)(?=\n\*\*\d+\.|$)/g,
    (block, num, title, body) => {
        const q = byId.get(String(num));
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

const BAD =
    /неверный финансовый срез|соседний KPI|похожий индикатор из продуктовой|выглядит убедительно на дашборде|подписывают блок|смешивает начисления и живые деньги|не является юнит-метрикой|соседний расчёт, но без LTV|не Jobs-to-be-Done|Свести JTBD|не Customer Development|методологию Бланка|Свести CustDev|здесь нельзя|другой термин или другой блок отчёта|другая формула и другая интерпретация|подменяет нужный юнит-показатель|разовый эффект системным|не разбирать альтернативные объяснения/i;

let badLeft = 0;
const samples = [];
for (const q of QUESTIONS) {
    q.options.forEach((o, i) => {
        if (i === q.correct) return;
        if (BAD.test(o)) {
            badLeft++;
            if (samples.length < 8) samples.push(`#${q.id}: ${o.slice(0, 100)}`);
        }
    });
}

const exactReps = [...usedGlobal.entries()].filter(([, c]) => c >= 4).sort((a, b) => b[1] - a[1]);

console.log(`Changed options: ${changed}`);
console.log(`Bad template leftovers: ${badLeft}`);
samples.forEach((s) => console.log(" ", s));
console.log(`Exact wrong repeats (>=4): ${exactReps.length}`);
exactReps.slice(0, 10).forEach(([t, c]) => console.log(`  ${c}× ${t.slice(0, 80)}`));

execSync("node scripts/parse-questions.mjs", { cwd: root, stdio: "inherit" });
