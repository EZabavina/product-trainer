/**
 * Выравнивает длину неверных ответов под верный, без общих шаблонных хвостов.
 * Каждый justification используется максимум 1 раз на весь банк.
 */
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const questionsPath = join(root, "js/questions.js");
const sourcePath = join(root, "data/questions-source.txt");

const MIN_RATIO = 0.55;
const MAX_RATIO = 1.45;

const STRIP = [
    /^Так ошибочно помечают статью:\s*/i,
    /\s*[—-]\s*значит выбрать неверный финансовый срез\.?$/i,
    /\s*[—-]\s*другой тип отчёта\/статьи:.*$/i,
    /:\s*в модели так часто подписывают блок.*$/i,
    /\s+смешивает начисления и живые деньги.*$/i,
    /\s*[—-]\s*так иногда называют соседний KPI.*$/i,
    /:\s*похожий индикатор из продуктовой аналитики.*$/i,
    /\s+выглядит убедительно на дашборде.*$/i,
    /\s+не является юнит-метрикой:.*$/i,
    /\s*[—-]\s*соседний расчёт, но без LTV.*$/i,
    /\s+не показывает прибыльность одного клиента.*$/i,
    /\s*[—-]\s*не Jobs-to-be-Done:.*$/i,
    /\s+ближе к процессу разработки\/дизайна.*$/i,
    /\s+не объясняет, какую работу пользователь.*$/i,
    /\s*[—-]\s*не Customer Development:.*$/i,
    /\s+может быть инструментом рядом, но автором.*$/i,
    /\s+не описывает методологию Бланка.*$/i,
    /\s+На практике такой ответ путают с правильным.*$/i,
    /\s+Для команды это ведёт к другому next step.*$/i,
    /\s+В отличие от верного определения.*$/i,
    /\s*[—-]\s*и усилить канал\/решение.*$/i,
    /\s+и не разбирать альтернативные объяснения метрики\.?$/i,
    /\s+Часто рисуют «на глаз».*$/i,
    /\s*[—-]\s*распространённая, но неверная трактовка.*$/i,
    /\s+Формулировка смешивает начисления и фактические поступления денег\.?$/i,
    /\s+Так трактуют метрику без разделения OpEx и COGS\.?$/i,
    /\s+Это путают отчёт о прибылях с движением денежных средств\.?$/i,
    /\s+Метрика считается иначе или на другой базе пользователей\.?$/i,
    /\s+Так путают похожие показатели из продуктовой аналитики\.?$/i,
    /\s+Определение близко к правильному, но неверно по сути расчёта\.?$/i,
    /\s+Формула смешивает базу расчёта: платящие vs все привлечённые\.?$/i,
    /\s+Так считают без когортного разреза и без gross margin\.?$/i,
    /\s+Показатель выглядит правдоподобно, но путает числитель и знаменатель\.?$/i,
    /\s+Так путают JTBD с user story или персоной пользователя\.?$/i,
    /\s+Подход фокусируется на демографии, а не на контексте выполнения работы\.?$/i,
    /\s+Это описывает продукт, а не работу, которую нанимают выполнить\.?$/i,
    /\s+Важно отличать этап рекрутинга от самого интервью\.?$/i,
    /\s+На практике это путают с подготовкой к полевому исследованию\.?$/i,
    /\s+Так формулируют задачу до начала customer discovery\.?$/i,
    /\s+Помогает структурировать контакт с пользователем до основной части исследования\.?$/i,
    /\s+Применяется в начале цикла discovery для фильтрации и фокусировки выборки\.?$/i,
    /\s+Используется на этапе подготовки к полевому исследованию и рекрутинга участников\.?$/i,
    /\s*[—-]\s*расчёт на другой базе пользователей\.?$/i,
    /\s+без учёта маржинальности и когортного разреза\.?$/i,
    /\s+при упрощённой методике без сегментации по каналам\.?$/i
];

const TOPIC_LOCATIVE = {
    Метрики: "в продуктовых метриках",
    "Финансовая модель": "в финансовой модели",
    "Юнит-экономика": "в юнит-экономике",
    JTBD: "в JTBD",
    CustDev: "в CustDev"
};

const TOPIC_LEADS = {
    Метрики: [
        "Путают с соседним KPI",
        "Принимают за vanity-метрику",
        "Часто подменяют другим этапом воронки",
        "Ошибочно читают как средний без когорт",
        "Сводят ответ к разовому всплеску",
        "Смешивают с операционным шумом",
        "Считают охват вместо ценного действия",
        "Путают retention с вовлечённостью",
        "Выбирают удобный, но неверный срез",
        "Опираются на мнение вместо факта"
    ],
    "Финансовая модель": [
        "Берут статью из соседнего отчёта",
        "Смешивают начисления и живые деньги",
        "Склеивают OpEx и COGS",
        "Игнорируют timing денежных поступлений",
        "Подставляют прокси без экономики",
        "Выбирают удобный, но неверный срез",
        "Путают с соседним KPI",
        "Сводят ответ к разовому всплеску",
        "Ошибочно читают как средний без когорт",
        "Опираются на мнение вместо факта"
    ],
    "Юнит-экономика": [
        "Ломают связку LTV–CAC–маржа",
        "Считают на всех привлечённых вместо платящих",
        "Забывают gross margin в оценке LTV",
        "Смешивают каналы с разным payback",
        "Подставляют прокси без экономики",
        "Принимают за vanity-метрику",
        "Склеивают OpEx и COGS",
        "Выбирают удобный, но неверный срез",
        "Сводят ответ к разовому всплеску",
        "Путают с соседним KPI"
    ],
    JTBD: [
        "Сводят Job к персоне или user story",
        "Теряют Forces of Progress и контекст switch",
        "Описывают фичу вместо работы пользователя",
        "Фокусируются на демографии, а не на прогрессе",
        "Опираются на мнение вместо факта",
        "Выбирают удобный, но неверный срез",
        "Подставляют прокси без экономики",
        "Сводят ответ к разовому всплеску",
        "Путают с соседним KPI",
        "Часто подменяют другим этапом воронки"
    ],
    CustDev: [
        "Подменяют интервью опросом или демо",
        "Ломают Mom Test вопросами про будущее",
        "Путают рекрутинг с проверкой гипотезы",
        "Ищут комплименты вместо фактов поведения",
        "Опираются на мнение вместо факта",
        "Выбирают удобный, но неверный срез",
        "Сводят ответ к разовому всплеску",
        "Подставляют прокси без экономики",
        "Ошибочно читают как средний без когорт",
        "Путают с соседним KPI"
    ]
};

const SHARED_TAILS = [
    "управленческий вывод тогда получается другой",
    "next step выбирают слишком рано",
    "payback по сегментам не сходится",
    "гипотезу закрывают на шуме",
    "масштабируют убыточный канал",
    "теряют сигнал качества аудитории",
    "в отчёте выглядит сильнее, чем есть на деле",
    "команда принимает шум за устойчивый рост",
    "альтернативные объяснения отбрасывают слишком рано",
    "сравнивают несопоставимые базы пользователей",
    "критерий успеха размывается",
    "проверку гипотезы подменяют активностью"
];

const EXTRAS_BY_TOPIC = {
    Метрики: [
        "Числитель и знаменатель взяты из разных этапов воронки.",
        "Похоже на верный термин, но считает другое поведение пользователя.",
        "Сигнал похож на прогресс, но без когортного разреза это шум.",
        "На практике так называют другой показатель из той же дашборд-группы."
    ],
    "Финансовая модель": [
        "Выглядит убедительно в отчёте, но не отвечает на поставленный вопрос.",
        "Убедительно для презентации, слабо для решения по финмодели.",
        "Кажется достаточным ориентиром, если забыть операционку и запас прибыли.",
        "На слайде выглядит здорово, а в окупаемости по каналам — дыра."
    ],
    "Юнит-экономика": [
        "База расчёта смешана: платящие и все привлечённые в одной куче.",
        "Формула знакома, однако без gross margin вывод о прибыли врёт.",
        "Так удобно объяснить рост, хотя экономика юнита при этом ломается.",
        "Такой ответ смешивает числитель и знаменатель привычной формулы."
    ],
    JTBD: [
        "Это язык фич и персон, а не работы, которую «нанимают» выполнить.",
        "Конкурентов тогда ищут только среди прямых аналогов продукта.",
        "Формулировка звучит уверенно, но критерий успеха здесь другой.",
        "Команда ускоряет решение, не проверив медиану и устойчивость эффекта."
    ],
    CustDev: [
        "Интервью уходит в оценку идеи вместо прошлого опыта респондента.",
        "Рекрутинг или демо подменяют собой проверку фактов поведения.",
        "Социальное одобрение принимают за discovery-инсайт — это ловушка.",
        "Удобно на созвоне, но нет сигнала готовности платить действием."
    ]
};

function buildTopicPools() {
    const pools = {};
    for (const [topic, leads] of Object.entries(TOPIC_LEADS)) {
        const out = [];
        for (const lead of leads) {
            for (const tail of SHARED_TAILS) out.push(`${lead} — ${tail}`);
        }
        out.push(...(EXTRAS_BY_TOPIC[topic] || []));
        pools[topic] = out;
    }
    return pools;
}

function fin(t) {
    let r = String(t || "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\s+([.,!?])/g, "$1")
        .replace(/\.\s*\./g, ".");
    const qm = r.match(/^«(.+)»\.?$/);
    if (qm) r = qm[1].trim();
    if (r && !/[.!?]$/.test(r)) r += ".";
    return r;
}

function stripClaim(text) {
    let r = text.trim();

    const captureRules = [
        [/^Так ошибочно помечают статью:\s*(.+)$/i, 1],
        [/^Считать\s+(.+?)\s+ответом на вопрос.*/i, 1],
        [/^Берут\s+(.+?)\s+вместо нужной метрики.*/i, 1],
        [/^Если ответить «(.+?)».*/i, 1],
        [/^Свести JTBD к «(.+?)».*/i, 1],
        [/^Свести CustDev к «(.+?)».*/i, 1],
        [/^В финмодели «(.+?)».*/i, 1],
        [/^Не «(.+?)».*/i, 1],
        [/^«(.+?)»\s+подменяет.*/i, 1],
        [/^Считать как «(.+?)».*/i, 1],
        [/^Сделать ставку на «(.+?)».*/i, 1],
        [/^Вариант «(.+?)».*/i, 1]
    ];
    for (const [re, g] of captureRules) {
        const m = r.match(re);
        if (m) {
            r = m[g].trim();
            break;
        }
    }

    let prev;
    do {
        prev = r;
        for (const rule of STRIP) {
            r = r.replace(rule, "").trim();
        }
    } while (r !== prev);

    return fin(r);
}

function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function sentences(t) {
    return t
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function needsBalance(wrong, correctLen) {
    if (correctLen <= 90) return false; // short correct → short wrongs ok
    return wrong.length < correctLen * MIN_RATIO;
}

function composeWrong(claim, justification, maxLen) {
    const core = fin(`${claim.replace(/[.!?]$/, "")}. ${justification}`);
    if (core.length <= maxLen) return core;

    const parts = sentences(core);
    // Prefer keeping first (claim) + last (usually claim-tagged unique closer)
    if (parts.length >= 3) {
        const short = fin(`${parts[0]} ${parts[parts.length - 1]}`);
        if (short.length <= maxLen && short.length >= claim.length + 15) return short;
    }
    // Else keep claim + first justification sentence only
    if (parts.length >= 2) {
        const short = fin(`${parts[0]} ${parts[1]}`);
        if (short.length <= maxLen) return short;
    }
    return fin(claim);
}

const MANUAL = {
    116: { 3: "Налоги — их разносят на каждый юнит как переменные, хотя они не связаны напрямую с объёмом." },
    126: { 1: "LTV / CAC без нормализации на вложенный CAC.", 2: "LTV - CAC как абсолютная разница без процента возврата." },
    131: { 0: "20$.", 2: "100$.", 3: "10$." },
    133: { 0: "2000$.", 2: "100$.", 3: "500$." },
    136: { 0: "Да, CAC окупится за первую покупку при текущей марже." }
};

const raw = readFileSync(questionsPath, "utf8");
const QUESTIONS = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));

const topicPools = buildTopicPools();
for (const list of Object.values(topicPools)) list.sort((a, b) => hash(a) - hash(b));
const poolCursor = Object.fromEntries(Object.keys(topicPools).map((t) => [t, 0]));
const usedJust = new Set();
const usedFull = new Set();

function nextJustification(topic, claim, seed) {
    const loc = TOPIC_LOCATIVE[topic] || "в этой теме";
    const claimShort = claim.replace(/[.!?]$/, "").slice(0, 42);
    const pool = topicPools[topic] || topicPools["Метрики"];
    let cursor = poolCursor[topic] || 0;

    while (cursor < pool.length) {
        const base = pool[cursor++];
        poolCursor[topic] = cursor;
        if (usedJust.has(base)) continue;
        usedJust.add(base);

        const leadTail = base.endsWith(".") ? base.slice(0, -1) : base;
        // Claim всегда в конце — окончания уникальны; каркас фразы ротируем
        const forms = [
            `${leadTail}. Отсюда ложный ответ «${claimShort}».`,
            `${leadTail}. Поэтому не стоит выбирать «${claimShort}».`,
            `${leadTail}. В итоге ошибочно берут «${claimShort}».`,
            `Частая ошибка: ${leadTail[0].toLowerCase()}${leadTail.slice(1)}. Итог — «${claimShort}».`,
            `Так появляется ошибка вокруг «${claimShort}»: ${leadTail[0].toLowerCase()}${leadTail.slice(1)}. Не выбирайте «${claimShort}».`
        ];
        return fin(forms[seed % forms.length]);
    }

    const j = `Ответ «${claimShort}» ${loc} не совпадает с нужным критерием (seed ${seed}).`;
    usedJust.add(j);
    return j;
}

let balanced = 0;
let kept = 0;
let manual = 0;

for (const q of QUESTIONS) {
    const correct = q.options[q.correct];
    const clen = correct.length;
    const used = new Set([correct]);

    q.options = q.options.map((o, idx) => {
        if (idx === q.correct) return o;

        if (MANUAL[q.id]?.[idx]) {
            manual++;
            const w = fin(MANUAL[q.id][idx]);
            used.add(w);
            usedFull.add(w);
            return w;
        }

        let claim = stripClaim(o);
        if (!claim || claim.length < 2) claim = fin(`Неверный вариант (${q.topic})`);

        let next = claim;
        const seed = hash(`${q.id}:${idx}:${claim}`);

        if (needsBalance(claim, clen)) {
            const justification = nextJustification(q.topic, claim, seed);
            const maxLen = Math.floor(clen * MAX_RATIO);
            next = composeWrong(claim, justification, maxLen);
            // If still short, append a unique claim-bound closer (no shared ending)
            if (next.length < clen * MIN_RATIO) {
                const closer = `Именно формулировка «${claim.replace(/[.!?]$/, "").slice(0, 48)}» уводит от верного критерия.`;
                next = composeWrong(claim, `${justification.replace(/[.!?]$/, "")}. ${closer}`, maxLen);
            }
            balanced++;
        } else {
            kept++;
        }

        // harden uniqueness
        let guard = 0;
        while ((used.has(next) || usedFull.has(next)) && guard < 5) {
            const justification = nextJustification(q.topic, claim, seed + guard + 1);
            next = composeWrong(claim, justification, Math.floor(clen * MAX_RATIO));
            guard++;
        }
        if (used.has(next) || usedFull.has(next)) {
            next = fin(
                `${claim.replace(/[.!?]$/, "")}. В контексте q${q.id} это соседняя, но неверная трактовка.`
            );
        }

        used.add(next);
        usedFull.add(next);
        return next;
    });
}

writeFileSync(questionsPath, `const QUESTIONS = ${JSON.stringify(QUESTIONS, null, 4)};\n`);

// sync source
const byId = new Map(QUESTIONS.map((q) => [String(q.id), q]));
let source = readFileSync(sourcePath, "utf8");
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

// audit
const BAD =
    /неверный финансовый срез|соседний KPI, но формула|подписывают блок|смешивает начисления и живые деньги либо|не Jobs-to-be-Done:|Свести JTBD к|не Customer Development:|методологию Бланка|Свести CustDev к|здесь нельзя|другой термин или другой блок отчёта|подменяет нужный юнит-показатель|Уникальный неверный акцент|это не про «/i;

let bad = 0;
let lengthCue = 0;
const ending = new Map();
const exact = new Map();

for (const q of QUESTIONS) {
    const c = q.options[q.correct];
    const wrongs = q.options.filter((_, i) => i !== q.correct);
    if (c.length > 80 && wrongs.every((w) => w.length < c.length * 0.4)) lengthCue++;
    for (const w of wrongs) {
        if (BAD.test(w)) bad++;
        exact.set(w, (exact.get(w) || 0) + 1);
        if (w.length >= 50) {
            const e = w.slice(-40);
            ending.set(e, (ending.get(e) || 0) + 1);
        }
    }
}

const exactReps = [...exact.entries()].filter(([, n]) => n >= 3);
const endReps = [...ending.entries()].filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]);

console.log({
    balanced,
    kept,
    manual,
    lengthCue,
    bad,
    exactRepsGte3: exactReps.length,
    sharedEndingsGte4: endReps.length,
    poolUsed: usedJust.size
});
if (endReps.length) {
    console.log("top endings:");
    endReps.slice(0, 8).forEach(([e, n]) => console.log(n, JSON.stringify(e)));
}

execSync("node scripts/parse-questions.mjs", { cwd: root, stdio: "inherit" });
