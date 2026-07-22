/** Яндекс.Метрика — счётчик 110947031 */
const METRIKA_ID = 110947031;

function trackMetrika(goal, params) {
    try {
        if (typeof ym !== "function") return;
        if (params && typeof params === "object") {
            ym(METRIKA_ID, "reachGoal", goal, params);
        } else {
            ym(METRIKA_ID, "reachGoal", goal);
        }
    } catch {
        /* ignore */
    }
}

function trackMetrikaHit(url) {
    try {
        if (typeof ym !== "function") return;
        ym(METRIKA_ID, "hit", url || location.href);
    } catch {
        /* ignore */
    }
}
