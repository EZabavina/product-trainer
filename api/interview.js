import { readFileSync } from "fs";
import { join } from "path";
import {
    buildRespondentPrompt,
    DEBRIEF_PROMPT,
    OPENING_MESSAGE
} from "../lib/interview-prompts.mjs";

const MODELS = [
    { id: "google/gemma-4-26b-a4b-it:free", maxTokens: { chat: 500, debrief: 1500 } },
    { id: "openai/gpt-oss-20b:free", maxTokens: { chat: 500, debrief: 1500 } },
    { id: "tencent/hy3:free", maxTokens: { chat: 1500, debrief: 2500 } },
    { id: "meta-llama/llama-3.3-70b-instruct:free", maxTokens: { chat: 500, debrief: 1500 } }
];

let scenariosCache = null;

function loadScenarios() {
    if (!scenariosCache) {
        const path = join(process.cwd(), "data", "interview-scenarios.json");
        scenariosCache = JSON.parse(readFileSync(path, "utf8"));
    }
    return scenariosCache;
}

function getScenario(id) {
    return loadScenarios().find((s) => s.id === id);
}

function extractContent(message) {
    const content = message?.content?.trim();
    if (content) return content;
    return "";
}

function shouldTryNextModel(err) {
    if (!err.status) return true;
    return err.status === 429 || err.status >= 500;
}

async function callOpenRouter(messages, model, maxTokens = 400) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/EZabavina/product-trainer",
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
        const status = err.status === 429 ? 429 : 500;
        return res.status(status).json({
            error: status === 429 ? "Лимит запросов. Подождите минуту." : "Ошибка AI-сервиса"
        });
    }
}
