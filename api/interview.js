import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
    buildRespondentPrompt,
    DEBRIEF_PROMPT,
    OPENING_MESSAGE
} from "../lib/interview-prompts.mjs";

const MODELS = [
    { id: "openrouter/free", maxTokens: { chat: 600, debrief: 1600 } },
    { id: "google/gemma-4-26b-a4b-it:free", maxTokens: { chat: 600, debrief: 1600 } },
    { id: "google/gemma-4-31b-it:free", maxTokens: { chat: 600, debrief: 1600 } },
    { id: "openai/gpt-oss-20b:free", maxTokens: { chat: 600, debrief: 1600 } },
    { id: "meta-llama/llama-3.3-70b-instruct:free", maxTokens: { chat: 600, debrief: 1600 } }
];

const SITE_URL =
    process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "https://product-trainer-psi.vercel.app";

let scenariosCache = null;

function loadScenarios() {
    if (!scenariosCache) {
        const candidates = [
            join(dirname(fileURLToPath(import.meta.url)), "..", "data", "interview-scenarios.json"),
            join(process.cwd(), "data", "interview-scenarios.json")
        ];
        let lastErr;
        for (const path of candidates) {
            try {
                scenariosCache = JSON.parse(readFileSync(path, "utf8"));
                return scenariosCache;
            } catch (err) {
                lastErr = err;
            }
        }
        throw lastErr || new Error("interview-scenarios.json not found");
    }
    return scenariosCache;
}

function getScenario(id) {
    return loadScenarios().find((s) => s.id === id);
}

function extractContent(message) {
    if (!message) return "";
    const content = message.content;
    if (typeof content === "string" && content.trim()) return content.trim();
    if (Array.isArray(content)) {
        const text = content
            .map((part) => (typeof part === "string" ? part : part?.text || ""))
            .join("")
            .trim();
        if (text) return text;
    }
    const reasoning = message.reasoning || message.reasoning_content;
    if (typeof reasoning === "string" && reasoning.trim()) return reasoning.trim();
    return "";
}

function publicErrorDetail(err) {
    const raw = String(err?.message || err || "unknown");
    return raw.replace(/sk-or-v1-[a-zA-Z0-9]+/g, "[key]").slice(0, 240);
}

function shouldTryNextModel(err) {
    if (!err.status) return true;
    // Retry on rate limits, upstream errors, and auth/model-not-found so fallbacks can recover
    return err.status === 401 || err.status === 402 || err.status === 403 || err.status === 404 || err.status === 429 || err.status >= 500;
}

async function callOpenRouter(messages, model, maxTokens = 400) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": SITE_URL,
            "X-Title": "Product Trainer CustDev"
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.75
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        const error = new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`);
        error.status = res.status;
        error.model = model;
        throw error;
    }

    const data = await res.json();
    const content = extractContent(data.choices?.[0]?.message);
    if (!content) {
        const error = new Error(`Empty response from model ${model}`);
        error.model = model;
        throw error;
    }
    return content;
}

async function chatWithFallback(messages, phase = "chat") {
    let lastError;
    for (const { id, maxTokens } of MODELS) {
        const tokens = maxTokens[phase] || maxTokens.chat;
        try {
            const content = await callOpenRouter(messages, id, tokens);
            return { content, model: id };
        } catch (err) {
            lastError = err;
            console.warn(`Model ${id} failed:`, err.message);
            if (shouldTryNextModel(err)) continue;
            throw err;
        }
    }
    throw lastError || new Error("All models failed");
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: "OPENROUTER_API_KEY not configured" });
    }

    try {
        const { phase, scenarioId, messages } = req.body || {};

        if (!scenarioId || !Array.isArray(messages)) {
            return res.status(400).json({ error: "scenarioId and messages required" });
        }

        const scenario = getScenario(scenarioId);
        if (!scenario) {
            return res.status(404).json({ error: "Scenario not found" });
        }

        if (phase === "opening") {
            return res.status(200).json({
                content: OPENING_MESSAGE.content,
                model: "preset"
            });
        }

        if (phase === "debrief") {
            const transcript = messages
                .map((m) => `${m.role === "user" ? "Продакт" : "Респондент"}: ${m.content}`)
                .join("\n\n");

            const debriefMessages = [
                { role: "system", content: DEBRIEF_PROMPT },
                {
                    role: "user",
                    content: `Сценарий: ${scenario.title} (${scenario.interviewType})\n\nТранскрипт:\n\n${transcript}`
                }
            ];

            const { content, model } = await chatWithFallback(debriefMessages, "debrief");
            return res.status(200).json({ content, model });
        }

        const systemPrompt = buildRespondentPrompt(scenario);
        const apiMessages = [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content
            }))
        ];

        const { content, model } = await chatWithFallback(apiMessages);
        return res.status(200).json({ content, model });
    } catch (err) {
        console.error("Interview API error:", err);
        const status = err.status === 429 ? 429 : err.status === 402 ? 402 : 500;
        const error =
            status === 429
                ? "Лимит запросов. Подождите минуту."
                : status === 402
                  ? "Нужны кредиты OpenRouter (free-лимит исчерпан)."
                  : "Ошибка AI-сервиса";
        return res.status(status).json({
            error,
            detail: publicErrorDetail(err)
        });
    }
}
