/**
 * Проверка persist/clear для uid/cohort (localStorage + cookie).
 * Запуск: node scripts/verify-visitor-identity.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "js/visitor.js"), "utf8");

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

function createHarness(href = "https://app.example/") {
    const store = new Map();
    const cookies = new Map();
    const cookieRaw = new Map();

    const localStorage = {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(String(key), String(value));
        },
        removeItem(key) {
            store.delete(key);
        }
    };

    const document = {
        get cookie() {
            return [...cookies.entries()]
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                .join("; ");
        },
        set cookie(raw) {
            const [pair] = String(raw).split(";");
            const eq = pair.indexOf("=");
            if (eq < 0) return;
            const name = pair.slice(0, eq).trim();
            const value = decodeURIComponent(pair.slice(eq + 1).trim());
            const lower = String(raw).toLowerCase();
            if (lower.includes("max-age=0")) {
                cookies.delete(name);
                cookieRaw.delete(name);
            } else {
                cookies.set(name, value);
                cookieRaw.set(name, String(raw));
            }
        }
    };

    const sandbox = {
        console,
        URL,
        localStorage,
        document,
        location: new URL(href),
        crypto: { randomUUID: () => "11111111-2222-4333-8444-555555555555" },
        METRIKA_ID: 1
    };

    vm.createContext(sandbox);
    vm.runInContext(
        `${source}
        ;Object.assign(this, {
            captureRespondentFromUrl,
            getStoredRespondentCode,
            getStoredCohort,
            getOrCreateVisitorId,
            clearStoredRespondentCode,
            setStoredRespondentCode,
            urlIdentityApplied
        });`,
        sandbox
    );

    return {
        sandbox,
        store,
        cookies,
        cookieRaw,
        setHref(nextHref) {
            sandbox.location = new URL(nextHref);
            sandbox.urlIdentityApplied = false;
            vm.runInContext("urlIdentityApplied = false;", sandbox);
        },
        api: {
            capture: (h) =>
                sandbox.captureRespondentFromUrl(h || sandbox.location.href, {
                    force: true
                }),
            uid: () => sandbox.getStoredRespondentCode(),
            cohort: () => sandbox.getStoredCohort(),
            visitorId: () => sandbox.getOrCreateVisitorId()
        }
    };
}

let failed = 0;
function check(name, fn) {
    try {
        fn();
        console.log("✓", name);
    } catch (err) {
        failed++;
        console.error("✗", name, "—", err.message);
    }
}

check("uid from ?uid= persists without param on next load", () => {
    const h = createHarness("https://app.example/?uid=anna");
    h.api.capture();
    assert(h.api.uid() === "anna", "uid not saved");
    assert(h.cookies.get("pt_uid") === "anna", "cookie pt_uid missing");

    h.setHref("https://app.example/");
    h.api.capture();
    assert(h.api.uid() === "anna", "uid cleared without param");
});

check("cookie survives localStorage wipe", () => {
    const h = createHarness("https://app.example/?uid=bob&cohort=pm-july");
    h.api.capture();
    h.store.clear();
    assert(h.api.uid() === "bob", "uid not restored from cookie");
    assert(h.api.cohort() === "pm-july", "cohort not restored from cookie");
    assert(h.store.get("product-trainer-respondent-code") === "bob", "ls not hydrated");
});

check("?uid=clear clears storage and cookie", () => {
    const h = createHarness("https://app.example/?uid=anna");
    h.api.capture();
    h.setHref("https://app.example/?uid=clear");
    h.api.capture();
    assert(h.api.uid() === "", "uid not cleared");
    assert(!h.cookies.has("pt_uid"), "cookie not cleared");
});

check("empty ?uid= clears", () => {
    const h = createHarness("https://app.example/?uid=anna");
    h.api.capture();
    h.setHref("https://app.example/?uid=");
    h.api.capture();
    assert(h.api.uid() === "", "empty uid should clear");
});

check("new uid overwrites previous", () => {
    const h = createHarness("https://app.example/?uid=anna");
    h.api.capture();
    h.setHref("https://app.example/?uid=katya");
    h.api.capture();
    assert(h.api.uid() === "katya", "uid not overwritten");
    assert(h.cookies.get("pt_uid") === "katya", "cookie not overwritten");
});

check("empty ?code= does not clear uid", () => {
    const h = createHarness("https://app.example/?uid=anna");
    h.api.capture();
    h.setHref("https://app.example/?code=");
    h.api.capture();
    assert(h.api.uid() === "anna", "empty code= cleared uid");
});

check("code=clear still clears", () => {
    const h = createHarness("https://app.example/?uid=anna");
    h.api.capture();
    h.setHref("https://app.example/?code=clear");
    h.api.capture();
    assert(h.api.uid() === "", "code=clear should clear uid");
});

check("new uid without cohort clears previous cohort", () => {
    const h = createHarness("https://app.example/?uid=anna&cohort=pm-july");
    h.api.capture();
    assert(h.api.cohort() === "pm-july", "cohort missing");
    h.setHref("https://app.example/?uid=katya");
    h.api.capture();
    assert(h.api.uid() === "katya", "uid not switched");
    assert(h.api.cohort() === "", "old cohort should clear");
});

check("sliding TTL rewrites cookie on capture without uid", () => {
    const h = createHarness("https://app.example/?uid=anna");
    h.api.capture();
    const before = h.cookieRaw.get("pt_uid");
    assert(before && before.includes("Max-Age="), "initial cookie missing max-age");
    h.setHref("https://app.example/");
    h.api.capture();
    const after = h.cookieRaw.get("pt_uid");
    assert(after && after.includes("Max-Age="), "cookie not refreshed");
    assert(h.api.uid() === "anna", "uid lost on refresh");
});

check("visitorId stays in localStorage only (not pt_ cookie)", () => {
    const h = createHarness("https://app.example/?uid=anna");
    h.api.capture();
    const id = h.api.visitorId();
    assert(id.length >= 8, "visitorId missing");
    assert(![...h.cookies.keys()].some((k) => k.includes("visitor")), "visitorId leaked to cookie");
});

if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
}
console.log("\nAll visitor-identity checks passed.");
