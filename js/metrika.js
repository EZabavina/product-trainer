/** Яндекс.Метрика — счётчик 110947031 */
const METRIKA_ID = 110947031;

function trackMetrika(goal, params) {
    try {
        if (typeof ym !== "function") return;
        // Третий аргумент — точный идентификатор цели в Метрике (JS-событие)
        if (params && typeof params === "object") {
            ym(METRIKA_ID, "reachGoal", goal, params);
        } else {
            ym(METRIKA_ID, "reachGoal", goal);
        }
    } catch (err) {
        console.warn("Metrika reachGoal failed:", goal, err);
    }
}

function trackMetrikaHit(url) {
    try {
        if (typeof ym !== "function") return;
        ym(METRIKA_ID, "hit", url || location.href, { title: document.title });
    } catch (err) {
        console.warn("Metrika hit failed:", err);
    }
}
