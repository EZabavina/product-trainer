/**
 * Строит js/question-skills.js: questionId → skillId[].
 * Скилы = пункты TOPIC_COMPETENCIES с id вида metrics.middle.know.0
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Подгружаем TOPIC_COMPETENCIES через временный eval содержимого levels.js — только константу.
const levelsSrc = readFileSync(join(root, "js/levels.js"), "utf8");
const match = levelsSrc.match(/const TOPIC_COMPETENCIES = (\{[\s\S]*?\n\});/);
if (!match) throw new Error("TOPIC_COMPETENCIES not found");
const TOPIC_COMPETENCIES = eval(`(${match[1]})`);

const TOPIC_SLUG = {
    Метрики: "metrics",
    "Финансовая модель": "finmodel",
    "Юнит-экономика": "unit",
    JTBD: "jtbd",
    CustDev: "custdev"
};

function skillId(topic, level, kind, index) {
    return `${TOPIC_SLUG[topic]}.${level}.${kind}.${index}`;
}

function allSkills() {
    const out = [];
    for (const [topic, block] of Object.entries(TOPIC_COMPETENCIES)) {
        for (const level of ["middle", "senior"]) {
            for (const kind of ["know", "can"]) {
                (block[level][kind] || []).forEach((text, index) => {
                    out.push({
                        id: skillId(topic, level, kind, index),
                        topic,
                        level,
                        kind,
                        index,
                        text
                    });
                });
            }
        }
    }
    return out;
}

/** Ключевые слова → skill index hints (по теме). Порядок: более специфичные раньше. */
const RULES = {
    Метрики: [
        { skill: "metrics.middle.know.3", re: /north star|nsm|omtm|one metric/i },
        { skill: "metrics.middle.know.0", re: /aarrr|пиратск|activation|активац|воронк/i },
        { skill: "metrics.middle.know.1", re: /\bdau\b|\bwau\b|\bmau\b|sticky|retention|удержан|rolling|classic retention|n-day/i },
        { skill: "metrics.middle.know.2", re: /\bcac\b|churn|ltv|vanity|actionable/i },
        { skill: "metrics.senior.know.0", re: /когорт|сегмент|leading|lagging/i },
        { skill: "metrics.senior.know.1", re: /\bnrr\b|\bgrr\b|expansion|unit economics/i },
        { skill: "metrics.senior.know.2", re: /искаж|сезон|канал.*(метр|событ)|определени.*событ/i },
        { skill: "metrics.senior.know.3", re: /дерев.*метр|эксперимент|nsм.*→|связк.*nsм/i },
        { skill: "metrics.middle.can.0", re: /дашборд|проседает|где.*(падает|проседа)/i },
        { skill: "metrics.middle.can.1", re: /сравн.*когорт|две когорты/i },
        { skill: "metrics.middle.can.2", re: /активац.*удержан|удержан.*активац/i },
        { skill: "metrics.middle.can.3", re: /гипотез.*рост|гипотез.*метр/i },
        { skill: "metrics.senior.can.0", re: /систем.*метр|стейкхолдер/i },
        { skill: "metrics.senior.can.1", re: /метр.*вырос.*бизнес|бизнес.*нет/i },
        { skill: "metrics.senior.can.2", re: /критери.*успех|эксперимент.*риск/i },
        { skill: "metrics.senior.can.3", re: /маркетинг|финанс.*спор|данным с/i }
    ],
    "Финансовая модель": [
        { skill: "finmodel.middle.know.0", re: /p&l|pnl|profit and loss|cash flow|начислен|живые деньги/i },
        { skill: "finmodel.middle.know.1", re: /revenue driver|выручк.*конверс|пользовател.*arpu|arpu/i },
        { skill: "finmodel.middle.know.2", re: /gross margin|burn|runway|break-even|безубыт/i },
        { skill: "finmodel.middle.know.3", re: /найм|прогноз.*рост|финмодел.*рост/i },
        { skill: "finmodel.senior.know.0", re: /base|optimistic|pessimistic|сценар/i },
        { skill: "finmodel.senior.know.1", re: /rule of 40|magic number|payback/i },
        { skill: "finmodel.senior.know.2", re: /чувствительн|delay|churn.*cac/i },
        { skill: "finmodel.senior.know.3", re: /квартал|roadmap.*p&l|продуктов.*решени.*p&l/i },
        { skill: "finmodel.middle.can.0", re: /рычаг|прочитать.*финмодел/i },
        { skill: "finmodel.middle.can.1", re: /6–12|runway|хватит ли/i },
        { skill: "finmodel.middle.can.2", re: /зависит.*выручк|драйвер.*выруч/i },
        { skill: "finmodel.middle.can.3", re: /вопрос.*cfo|ceo.*финмодел/i },
        { skill: "finmodel.senior.can.0", re: /аудит|собрать.*финмодел/i },
        { skill: "finmodel.senior.can.1", re: /roadmap.*выруч|impact.*марж/i },
        { skill: "finmodel.senior.can.2", re: /бюджет|kill decision|защитить/i },
        { skill: "finmodel.senior.can.3", re: /okr|финансов.*цел/i }
    ],
    "Юнит-экономика": [
        { skill: "unit.middle.know.0", re: /ltv\s*\/\s*cac|ltv\/cac|payback|ltv,?\s*cac/i },
        { skill: "unit.middle.know.1", re: /arpu|arppu|lifetime|conversion|конверс/i },
        { skill: "unit.middle.know.2", re: /cogs|contribution|маржинал.*юнит/i },
        { skill: "unit.middle.know.3", re: /blended|channel-specific|смеш.*канал/i },
        { skill: "unit.senior.know.0", re: /когортн.*юнит|канальн.*юнит/i },
        { skill: "unit.senior.know.1", re: /marketplace|take rate|двусторон|ликвидн/i },
        { skill: "unit.senior.know.2", re: /nrr|expansion.*ltv/i },
        { skill: "unit.senior.know.3", re: /cash|окупаем.*убив|хороший.*ltv\/cac/i },
        { skill: "unit.middle.can.0", re: /салфетк|посчитать.*юнит/i },
        { skill: "unit.middle.can.1", re: /сходит|экономик.*сход/i },
        { skill: "unit.middle.can.2", re: /плечо|главн.*(cac|retention|arpu)/i },
        { skill: "unit.middle.can.3", re: /freemium|платящ.*всех|arppu.*arpu/i },
        { skill: "unit.senior.can.0", re: /цен.*пакет|пересобрать.*экономик/i },
        { skill: "unit.senior.can.1", re: /фич.*ltv|влиян.*фич/i },
        { skill: "unit.senior.can.2", re: /масштабирован|останов.*канал|сегмент.*для/i },
        { skill: "unit.senior.can.3", re: /cac ceiling|потол.*cac/i }
    ],
    JTBD: [
        { skill: "jtbd.middle.know.0", re: /job statement|когда.*хочу.*чтобы|сформулир.*job/i },
        { skill: "jtbd.middle.know.1", re: /functional|emotional|social job|эмоцион|социальн.*job/i },
        { skill: "jtbd.middle.know.2", re: /forces of progress|push|pull|anxiety|habit|сил.*прогресс/i },
        { skill: "jtbd.middle.know.3", re: /persona|feature request|отлича.*job|чем job/i },
        { skill: "jtbd.senior.know.0", re: /job map|outcome-driven|приоритиз/i },
        { skill: "jtbd.senior.know.1", re: /конкурент.*job|non-consumption|непотреблен/i },
        { skill: "jtbd.senior.know.2", re: /job.*метр|ценност.*метр|успех.*job/i },
        { skill: "jtbd.senior.know.3", re: /ограничен.*jtbd|когда.*не помогает/i },
        { skill: "jtbd.middle.can.0", re: /кандидат.*job|2–3.*job|сформулировать 2/i },
        { skill: "jtbd.middle.can.1", re: /хотелк|отличить job/i },
        { skill: "jtbd.middle.can.2", re: /switch interview|таймлайн/i },
        { skill: "jtbd.middle.can.3", re: /сегмент.*работ|не только.*демограф/i },
        { skill: "jtbd.senior.can.0", re: /opportunity|ставк.*job/i },
        { skill: "jtbd.senior.can.1", re: /feature shopping|перевест.*job.*решен/i },
        { skill: "jtbd.senior.can.2", re: /discovery.*команд|синхрон.*job/i },
        { skill: "jtbd.senior.can.3", re: /инвестор|ceo.*работ|нанимают/i }
    ],
    CustDev: [
        { skill: "custdev.middle.know.0", re: /problem.*solution|problem vs|solution interview|этап/i },
        { skill: "custdev.middle.know.1", re: /mom test|прошлое|поведени.*гипотез/i },
        { skill: "custdev.middle.know.2", re: /скринер|saturation|bias|смещен/i },
        { skill: "custdev.middle.know.3", re: /fake door|concierge|спрос/i },
        { skill: "custdev.senior.know.0", re: /discovery.*validation|mvp|петл.*мнен/i },
        { skill: "custdev.senior.know.1", re: /continuous discovery/i },
        { skill: "custdev.senior.know.2", re: /масштабир.*интервью|синтез/i },
        { skill: "custdev.senior.know.3", re: /growth experiment|когда custdev.*не нужен/i },
        { skill: "custdev.middle.can.0", re: /гайд|5–8|problem-интервью|провести.*интервью/i },
        { skill: "custdev.middle.can.1", re: /leading|наводящ/i },
        { skill: "custdev.middle.can.2", re: /комплимент|готовност.*плат/i },
        { skill: "custdev.middle.can.3", re: /learnings|next experiment|после серии/i },
        { skill: "custdev.senior.can.0", re: /программ.*discovery|риск гипотез/i },
        { skill: "custdev.senior.can.1", re: /научить.*команд|транскрипт|ревью/i },
        { skill: "custdev.senior.can.2", re: /go \/ pivot|pivot \/ kill|go\/pivot/i },
        { skill: "custdev.senior.can.3", re: /ритуал|разовый проект|встроить custdev/i }
    ]
};

const DEFAULT_BY_TOPIC = {
    Метрики: ["metrics.middle.know.0", "metrics.middle.can.0"],
    "Финансовая модель": ["finmodel.middle.know.0", "finmodel.middle.can.0"],
    "Юнит-экономика": ["unit.middle.know.0", "unit.middle.can.1"],
    JTBD: ["jtbd.middle.know.0", "jtbd.middle.know.3"],
    CustDev: ["custdev.middle.know.0", "custdev.middle.know.1"]
};

const qRaw = readFileSync(join(root, "js/questions.js"), "utf8");
const QUESTIONS = JSON.parse(qRaw.slice(qRaw.indexOf("["), qRaw.lastIndexOf("]") + 1));

const map = {};
let matched = 0;
let fallback = 0;

for (const q of QUESTIONS) {
    const text = `${q.question} ${q.explanation || ""}`;
    const rules = RULES[q.topic] || [];
    const hits = [];
    for (const rule of rules) {
        if (rule.re.test(text)) hits.push(rule.skill);
        if (hits.length >= 2) break;
    }
    if (hits.length) {
        map[q.id] = [...new Set(hits)];
        matched++;
    } else {
        map[q.id] = DEFAULT_BY_TOPIC[q.topic] || [];
        fallback++;
    }
}

const catalog = allSkills();
const out = `/** Автогенерация: node scripts/build-question-skills.mjs */
const QUESTION_SKILLS = ${JSON.stringify(map, null, 4)};

const SKILL_CATALOG = ${JSON.stringify(catalog, null, 4)};

function getSkillsForQuestion(questionId) {
    return QUESTION_SKILLS[questionId] || QUESTION_SKILLS[String(questionId)] || [];
}

function getSkillById(skillId) {
    return SKILL_CATALOG.find((s) => s.id === skillId) || null;
}

function getQuestionsForSkill(skillId) {
    return Object.entries(QUESTION_SKILLS)
        .filter(([, ids]) => ids.includes(skillId))
        .map(([qid]) => Number(qid));
}
`;

writeFileSync(join(root, "js/question-skills.js"), out);
console.log({ questions: QUESTIONS.length, matched, fallback, skills: catalog.length });
