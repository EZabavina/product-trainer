/**
 * Только снимает старые generic-хвосты. Больше НЕ добивает неверные
 * шаблонными фразами (раньше это создавало массовые повторы).
 */
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(__dirname, "../data/questions-source.txt");

const GENERIC_TAIL =
    /(?:\.\s*(?:Используется в дашбордах[^.]*\.|Часто применяют при сравнении когорт[^.]*\.|Такой расчёт удобен[^.]*\.|Подходит для операционного мониторинга[^.]*\.|Встречается в шаблонах финмоделей[^.]*\.|Применяется в продуктовой аналитике[^.]*\.|Используется в отчётности команды[^.]*\.|Учитывается при планировании экспериментов[^.]*\.|Такой подход часто встречается[^.]*\.|Показатель помогает сравнивать когорт[^.]*\.|Термин встречается в дашбордах[^.]*\.|Так интерпретируют данные многие команды[^.]*\.|Это распространённое заблуждение[^.]*\.|Формулировка звучит убедительно[^.]*\.|На первый взгляд логично[^.]*\.|Так можно интерпретировать данные[^.]*\.|Метрика считается иначе или на другой базе пользователей\.|Так путают похожие показатели из продуктовой аналитики\.|Определение близко к правильному, но неверно по сути расчёта\.|Формула смешивает базу расчёта: платящие vs все привлечённые\.|Так считают без когортного разреза и без gross margin\.|Показатель выглядит правдоподобно, но путает числитель и знаменатель\.|Это путают отчёт о прибылях с движением денежных средств\.|Так трактуют метрику без разделения OpEx и COGS\.|Формулировка смешивает начисления и фактические поступления денег\.|Так путают JTBD с user story или персоной пользователя\.|Подход фокусируется на демографии, а не на контексте выполнения работы\.|Это описывает продукт, а не работу, которую нанимают выполнить\.|Важно отличать этап рекрутинга от самого интервью\.|На практике это путают с подготовкой к полевому исследованию\.|Так формулируют задачу до начала customer discovery\.|Поэтому next step по «[^»]*» выбирают слишком рано\.|В когортах «[^»]*» обычно не подтверждается\.|На weekly «[^»]*» выглядит прогрессом[^.]*\.|Ломает Mom Test:[^.]*\.))+$/i;

function stripGenericTails(text) {
    let result = text.trim();
    if (!result || result === ".") return result;
    let prev;
    do {
        prev = result;
        result = result.replace(GENERIC_TAIL, "").trim();
        result = result.replace(/\s*;\s*применяют при планировании[^.]*\.?$/i, "");
        result = result.replace(/\s*— разные разрезы базы пользователей и транзакций\.?$/i, "");
        result = result.replace(/\s*\(при другой базе расчёта и периоде\)\.?$/i, "");
        result = result.replace(/\s*\(альтернативная трактовка периода и базы расчёта\)\.?$/i, "");
        result = result.replace(/\s*— расчёт на другой базе пользователей\.?$/i, "");
        result = result.replace(/\s*без учёта маржинальности и когортного разреза\.?$/i, "");
        result = result.replace(/\s*при упрощённой методике без сегментации по каналам\.?$/i, "");
    } while (result !== prev);
    if (!/[.!?]$/.test(result)) result += ".";
    return result.replace(/\s+/g, " ").replace(/\.\s*\./g, ".").trim();
}

let source = readFileSync(sourcePath, "utf8");
let stripped = 0;
source = source.replace(/^([A-D])\)\s*(.+)$/gm, (line, letter, text) => {
    const cleaned = stripGenericTails(text);
    if (cleaned !== text.trim()) stripped++;
    return `${letter}) ${cleaned}`;
});
writeFileSync(sourcePath, source);
console.log(`Stripped generic tails from ${stripped} options (no re-padding)`);
execSync("node scripts/parse-questions.mjs", { cwd: join(__dirname, ".."), stdio: "inherit" });
