/**
 * Fix pass: restore clean cores from 83faa6c, strip old boilerplate,
 * keep good multi-sentence wrongs, expand only bare labels with unique claim-centered text,
 * re-apply LLM checkpoint for quality Metrics items.
 *
 * Does NOT use OpenRouter. Does NOT git-checkout the working tree.
 */
import { readFileSync, writeFileSync } from "fs";
import { execSync, spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const questionsPath = join(root, "js/questions.js");
const sourcePath = join(root, "data/questions-source.txt");
const checkpointPath = join(root, "data/distractor-rewrite-checkpoint.json");

const OLD_TAILS = [
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
    "Используется на этапе подготовки к полевому исследованию и рекрутинга участников.",
    " — расчёт на другой базе пользователей.",
    " без учёта маржинальности и когортного разреза.",
    " при упрощённой методике без сегментации по каналам."
];

/** Phrases from the failed local rewrite — strip if present */
const NEW_BAD_TAILS = [
    /(?:^|[.!?]\s*)Поэтому next step по «[^»]*» выбирают слишком рано\.?/gi,
    /(?:^|[.!?]\s*)В когортах «[^»]*» обычно не подтверждается\.?/gi,
    /(?:^|[.!?]\s*)На weekly «[^»]*» выглядит прогрессом(?: без экономики)?\.?/gi,
    /(?:^|[.!?]\s*)Из-за этого next step по «[^»]*» выбирают слишком рано\.?/gi,
    /(?:^|[.!?]\s*)Ломает Mom Test: вопросы про будущее и мнения вместо прошлого опыта\.?/gi,
    /(?:^|[.!?]\s*)Юнит сходится «на бумаге», потому что смешаны платящие и все привлечённые\.?/gi,
    /(?:^|[.!?]\s*)Формула знакома, но без gross margin и когорт это не экономика юнита\.?/gi,
    /(?:^|[.!?]\s*)Конкурентов тогда ищут только среди прямых аналогов, не среди альтернатив работе\.?/gi,
    /(?:^|[.!?]\s*)Социальное одобрение выглядит как discovery-инсайт — и это ловушка\.?/gi,
    /(?:^|[.!?]\s*)Удобно на созвоне, но нет сигнала готовности платить действием\.?/gi,
    /(?:^|[.!?]\s*)Убедительно для слайда, слабо для решения по финмодели\.?/gi,
    /(?:^|[.!?]\s*)Это persona\/feature language, а не Job, которую нанимают выполнить\.?/gi,
    /(?:^|[.!?]\s*)Уводит интервью к оценке идеи, а не к работе в прошлой ситуации\.?/gi,
    /(?:^|[.!?]\s*)Больше рекрутинг или демо, чем проверка фактов поведения\.?/gi,
    /(?:^|[.!?]\s*)OpEx и COGS склеены — маржа продукта в модели становится неверной\.?/gi,
    /(?:^|[.!?]\s*)Кажется достаточным, если не закладывать операционные расходы и запас прибыли\.?/gi,
    /(?:^|[.!?]\s*)Так рисуют unit на слайде, хотя payback по каналам не сходится\.?/gi,
    /(?:^|[.!?]\s*)Часто берут «на глаз», забывая, что часть LTV уйдёт в COGS и OpEx\.?/gi,
    /(?:^|[.!?]\s*)Выглядит агрессивно\/консервативно, но не является рабочим ориентиром окупаемости\.?/gi,
    /(?:^|[.!?]\s*)Другая база(?: расчёта)? и другой вывод(?: для команды)?\.?/gi,
    /(?:^|[.!?]\s*)Похожий термин, не тот показатель(?: для этого вопроса)?\.?/gi,
    /(?:^|[.!?]\s*)Правдоподобно, но смысл иной\.?/gi,
    /(?:^|[.!?]\s*)Соседний KPI из той же темы\.?/gi,
    /(?:^|[.!?]\s*)Команда ускоряет решение, не проверив сегменты и устойчивость эффекта\.?/gi,
    /(?:^|[.!?]\s*)Альтернативные объяснения при этом обычно отбрасывают\.?/gi,
    /(?:^|[.!?]\s*)Так обычно закрывают гипотезу быстрее, чем появляется устойчивый сигнал\.?/gi,
    /(?:^|[.!?]\s*)В отчёте это выглядит сильнее осторожной диагностики по сегментам\.?/gi,
    /(?:^|[.!?]\s*)уточнять activation, retention или payback уже необязательно\.?/gi,
    /(?:^|[.!?]\s*)Риск ложного positive при этом обычно не обсуждают\.?/gi,
    /(?:^|[.!?]\s*)этого достаточно, чтобы считать сигнал устойчивым и не смотреть медиану\/когорты\.?/gi,
    /(?:^|[.!?]\s*)На слайде «здорово», в payback по сегментам — дыра\.?/gi,
    /(?:^|[.!?]\s*)Похоже на unit-метрику, но числитель и знаменатель из разных этапов\.?/gi,
    /Так ошибочно помечают статью:\s*/gi
];

const FRAME_PREFIX =
    /^(Заложить|Опора на|Берут|Считать как|Если взять|Если метод —|Если Job =|Стартовать с «|Главное —|Сразу |Вариант )\s*/i;

function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
}
function pick(a, s) {
    return a[Math.abs(s) % a.length];
}
function fin(t) {
    let r = String(t || "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\s+([.,!?])/g, "$1")
        .replace(/\.\s*\./g, ".");
    if (r && !/[.!?]$/.test(r)) r += ".";
    return r;
}
function sentences(t) {
    return t
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function stripOldTails(text) {
    let r = text.trim();
    let changed = true;
    while (changed) {
        changed = false;
        for (const tail of OLD_TAILS) {
            if (r.endsWith(tail)) {
                r = r.slice(0, -tail.length).trim();
                changed = true;
            } else if (r.endsWith(" " + tail)) {
                r = r.slice(0, -(tail.length + 1)).trim();
                changed = true;
            } else if (r.endsWith(". " + tail)) {
                r = r.slice(0, -(tail.length + 2)).trim();
                changed = true;
            }
        }
    }
    return fin(r);
}

function stripNewJunk(text) {
    let r = text.trim();
    let prev;
    do {
        prev = r;
        for (const re of NEW_BAD_TAILS) r = r.replace(re, "").trim();
        r = r.replace(FRAME_PREFIX, "").trim();
        // unwrap broken frames left in middle
        r = r.replace(/^если ориентир —\s*/i, "");
        r = r.replace(/\s*·\s*(Метрики|Юнит-экономика|Финансовая модель|JTBD|CustDev)\.?$/i, "");
        r = r.replace(/\s*\[\d+\.\d+\]\.?$/i, "");
        r = r.replace(/\s*\(\d+\.\d+\)\.?$/i, "");
    } while (r !== prev);
    return fin(r);
}

function cleanClaim(text) {
    let r = stripNewJunk(stripOldTails(text));
    // If still starts with leftover frame words glued to capital claim
    r = r.replace(/^(Заложить|Опора на|Берут|Считать как|Если взять)\s+/i, "");
    // Take first sentence if second is clearly padding remnant
    const parts = sentences(r);
    if (parts.length >= 2) {
        const last = parts[parts.length - 1];
        if (
            /next step|в когортах|на weekly|mom test|gross margin|persona\/feature|discovery-инсайт|для слайда|unit на слайде|на глаз|рабочим ориентиром окупаемости/i.test(
                last
            )
        ) {
            r = fin(parts.slice(0, -1).join(" "));
        }
    }
    return fin(r);
}

/**
 * Expand a bare wrong claim to roughly match correct length/format,
 * keeping the claim as the semantic core and making each string unique.
 */
function expandBare(correct, claim, topic, seed) {
    const c = claim.replace(/[.!?]+$/, "").trim();
    const clen = correct.length;
    const parts = sentences(correct);

    // Already parallel multi-sentence (e.g. Cash Flow with "Входит:")
    if (sentences(claim).length >= 2 || claim.length >= clen * 0.7) {
        return fin(claim);
    }

    // Short correct (formula / short definition) → keep short wrong
    if (clen <= 90) {
        return fin(c);
    }

    // Mirror "Входит: ..." pattern
    if (/входит:/i.test(correct) && !/входит:/i.test(c)) {
        const lists = {
            "Финансовая модель": [
                "Активы, Пассивы, Капитал",
                "Операционная, Инвестиционная, Финансовая деятельность",
                "CAC, LTV, Payback",
                "MRR, Churn, Expansion"
            ],
            default: [
                "другие статьи и другой срез учёта",
                "показатели охвата без денежного результата",
                "операционные метрики вместо финансового результата"
            ]
        };
        const list = pick(lists[topic] || lists.default, seed);
        return fin(`${c}. Входит: ${list}`);
    }

    // Mirror "Автор: ..." — keep claim only; do not append identical attribution tails
    if (/автор:/i.test(correct)) {
        return fin(c);
    }

    // Не добиваем одним и тем же хвостом — короткие уникальные claims лучше массовых шаблонов.
    // Длина ответа не должна выдавать правильный вариант сильнее, чем смысл.
    void topic;
    void seed;
    void parts;
    return fin(c);
}

function isBare(text, correctLen) {
    const t = text.replace(/[.!?]$/, "").trim();
    if (t.length < 12) return true;
    if (t.length < correctLen * 0.55 && sentences(text).length === 1) return true;
    // single short label
    if (t.length <= 45 && !/[.!?]/.test(text.slice(0, -1)) && !/входит:|автор:|\//i.test(t)) {
        return true;
    }
    return false;
}

// --- build from 83faa6c ---
const baseRaw = execSync("git show 83faa6c:js/questions.js", {
    cwd: root,
    encoding: "utf8"
});
const QUESTIONS = JSON.parse(baseRaw.replace(/^const QUESTIONS = /, "").replace(/;\s*$/, ""));
const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"));

let kept = 0;
let expanded = 0;
let fromCp = 0;

for (const q of QUESTIONS) {
    const correct = q.options[q.correct];
    const used = new Set([correct]);
    const cp = checkpoint[String(q.id)];

    // Prefer high-quality checkpoint when available
    if (
        cp &&
        cp.length === 3 &&
        cp.every(
            (w) =>
                w &&
                w !== correct &&
                w.length >= correct.length * 0.5 &&
                w.length <= correct.length * 1.55 &&
                !/next step по|В когортах «|На weekly «|Ломает Mom Test:|Заложить |Если взять /i.test(w)
        )
    ) {
        let i = 0;
        q.options = q.options.map((o, idx) => {
            if (idx === q.correct) return o;
            const w = fin(cp[i++]);
            used.add(w);
            return w;
        });
        fromCp++;
        continue;
    }

    q.options = q.options.map((o, idx) => {
        if (idx === q.correct) return o;
        let claim = cleanClaim(o);
        if (!claim || claim.length < 3) {
            claim = fin(`Неверный вариант ${q.topic}`);
        }

        let next;
        if (!isBare(claim, correct.length)) {
            next = claim;
            kept++;
        } else {
            next = expandBare(correct, claim, q.topic, hash(`${q.id}:${idx}:${claim}`));
            expanded++;
        }

        // dedupe
        let g = 0;
        while (used.has(next) && g < 4) {
            next = expandBare(correct, `${claim} (${idx}${g})`, q.topic, hash(`${q.id}:${idx}:${g}`));
            // remove the ugly (idx) if possible by using alternate bank pick only
            next = expandBare(correct, claim, q.topic, hash(`${q.id}:${idx}:${g}:alt`));
            g++;
        }
        if (used.has(next)) {
            next = fin(`${claim.replace(/[.!?]$/, "")} — распространённая, но неверная трактовка в теме «${q.topic}».`);
        }
        used.add(next);
        return next;
    });
}

writeFileSync(questionsPath, `const QUESTIONS = ${JSON.stringify(QUESTIONS, null, 4)};\n`);

// sync source from current questions (source may have diverged; rebuild options lines)
let qIndex = 0;
let source = readFileSync(sourcePath, "utf8");
// Prefer syncing against 83faa6c source structure if option counts match
try {
    source = execSync("git show 83faa6c:data/questions-source.txt", { cwd: root, encoding: "utf8" });
} catch {
    /* keep current */
}
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
            if (m && optIdx < 4) newLines.push(`${m[1]}) ${q.options[optIdx++]}`);
            else newLines.push(line);
        }
        return `**${num}. ${title.trim()}**\n${newLines.join("\n")}`;
    }
);
writeFileSync(sourcePath, source);

// audit
const BAD =
    /next step по|В когортах «|На weekly «|Ломает Mom Test:|Заложить |Если взять |Если метод —|Берут [А-ЯA-Z]|Опора на |Считать как |persona\/feature|Юнит сходится «на бумаге»|Метрика считается иначе|не совпадает с определением|Формула смешивает базу|Так путают похожие|неверный финансовый срез|соседний KPI|подписывают блок|смешивает начисления и живые деньги|не Jobs-to-be-Done|Свести JTBD|не Customer Development|методологию Бланка|Свести CustDev|здесь нельзя|другой термин или другой блок отчёта|подменяет нужный юнит-показатель/i;

let badQ = 0;
let short = 0;
const byTopic = {};
const tails = new Map();
for (const q of QUESTIONS) {
    const c = q.options[q.correct].length;
    let hit = false;
    q.options.forEach((o, i) => {
        if (i === q.correct) return;
        if (BAD.test(o)) {
            hit = true;
        }
        if (o.length < c * 0.5) short++;
        const t = sentences(o).slice(1).join(" ");
        if (t.length > 45) tails.set(t, (tails.get(t) || 0) + 1);
    });
    if (hit) {
        badQ++;
        byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
    }
}
const top = [...tails.entries()].filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log({ fromCp, kept, expanded, badQ, byTopic, short, topRepeats: top });

for (const id of [1, 4, 51, 101, 151, 201, 121, 258]) {
    const q = QUESTIONS.find((x) => x.id === id);
    if (!q) continue;
    console.log("\n#" + id, q.topic, "—", q.question.slice(0, 50));
    q.options.forEach((o, i) => console.log(i === q.correct ? "✓" : "✗", o));
}

const v = spawnSync(process.execPath, [join(root, "scripts/validate-questions.mjs")], {
    stdio: "inherit"
});
if (v.status) process.exit(v.status);
