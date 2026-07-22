const API_URL = "/api/interview";

let interviewActive = false;
let currentScenario = null;
let chatMessages = [];
let isWaiting = false;

const interviewScreen = document.getElementById("interview-screen");
const interviewDebriefScreen = document.getElementById("interview-debrief-screen");
const interviewBadge = document.getElementById("interview-badge");
const interviewScenarioTitle = document.getElementById("interview-scenario-title");
const interviewScenarioDesc = document.getElementById("interview-scenario-desc");
const interviewChat = document.getElementById("interview-chat");
const interviewInput = document.getElementById("interview-input");
const interviewSend = document.getElementById("interview-send");
const interviewEnd = document.getElementById("interview-end");
const interviewBack = document.getElementById("interview-back");
const interviewStatus = document.getElementById("interview-status");
const interviewDebriefContent = document.getElementById("interview-debrief-content");
const interviewDebriefBack = document.getElementById("interview-debrief-back");
const interviewDebriefHome = document.getElementById("interview-debrief-home");
const interviewDebriefKnowledge = document.getElementById("interview-debrief-knowledge");
const interviewDebriefReplayHint = document.getElementById("interview-debrief-replay-hint");
const interviewDebriefTranscript = document.getElementById("interview-debrief-transcript");

let replayingInterviewId = null;

function isInterviewActive() {
    return interviewActive;
}

function getInterviewScenarioCount() {
    return typeof INTERVIEW_SCENARIOS !== "undefined" ? INTERVIEW_SCENARIOS.length : 0;
}

function getInterviewScenario(id) {
    return INTERVIEW_SCENARIOS.find((s) => s.id === id);
}

async function apiCall(body) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const detail = data.detail ? ` (${data.detail})` : "";
        throw new Error((data.error || `Ошибка ${res.status}`) + detail);
    }
    return data;
}

function renderChat() {
    interviewChat.innerHTML = chatMessages
        .map((m) => {
            const isUser = m.role === "user";
            return `
            <div class="chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}">
                <div class="chat-bubble-label">${isUser ? "Вы" : escapeHtml(currentScenario?.respondentName || "Респондент")}</div>
                <div class="chat-bubble-text">${escapeHtml(m.content)}</div>
            </div>
        `;
        })
        .join("");
    interviewChat.scrollTop = interviewChat.scrollHeight;
}

function setInterviewLoading(loading, text = "") {
    isWaiting = loading;
    interviewSend.disabled = loading;
    interviewInput.disabled = loading;
    interviewEnd.disabled = loading;
    interviewStatus.textContent = text;
}

async function startInterview(scenarioId) {
    const scenario = getInterviewScenario(scenarioId);
    if (!scenario) return;

    currentScenario = scenario;
    chatMessages = [];
    interviewActive = true;

    document.getElementById("train-view").classList.add("hidden");
    document.getElementById("quiz-screen").classList.add("hidden");
    document.getElementById("results-screen").classList.add("hidden");
    interviewDebriefScreen.classList.add("hidden");
    interviewScreen.classList.remove("hidden");
    document.querySelector(".nav-tabs").classList.add("hidden");

    const cfg = getTopicConfig("CustDev");
    interviewBadge.textContent = `${cfg.icon} CustDev · Симулятор`;
    interviewBadge.style.borderColor = cfg.color + "44";
    interviewScenarioTitle.textContent = scenario.title;
    interviewScenarioDesc.textContent = `${scenario.description} · ${scenario.respondentPreview}`;

    interviewInput.value = "";
    setInterviewLoading(true, "Респондент подключается…");

    try {
        const data = await apiCall({ phase: "opening", scenarioId, messages: [] });
        chatMessages.push({ role: "assistant", content: data.content });
        renderChat();
        setInterviewLoading(false);
        interviewInput.focus();
    } catch (err) {
        setInterviewLoading(false);
        interviewStatus.textContent = err.message;
    }
}

async function sendInterviewMessage() {
    const text = interviewInput.value.trim();
    if (!text || isWaiting || !currentScenario) return;

    chatMessages.push({ role: "user", content: text });
    interviewInput.value = "";
    renderChat();
    setInterviewLoading(true, "Респондент думает…");

    try {
        const data = await apiCall({
            phase: "chat",
            scenarioId: currentScenario.id,
            messages: chatMessages
        });
        chatMessages.push({ role: "assistant", content: data.content });
        renderChat();
        setInterviewLoading(false);
        interviewInput.focus();
    } catch (err) {
        setInterviewLoading(false);
        interviewStatus.textContent = err.message;
    }
}

async function endInterview() {
    if (!currentScenario || chatMessages.length < 2) {
        if (!confirm("Мало сообщений для разбора. Завершить без разбора?")) return;
        closeInterview();
        if (typeof showMainView === "function") showMainView("train");
        return;
    }

    setInterviewLoading(true, "Готовим разбор по Mom Test…");

    try {
        const data = await apiCall({
            phase: "debrief",
            scenarioId: currentScenario.id,
            messages: chatMessages
        });

        interviewScreen.classList.add("hidden");
        interviewDebriefScreen.classList.remove("hidden");
        interviewDebriefContent.innerHTML = formatDebrief(data.content);
        setInterviewLoading(false);

        const userTurns = chatMessages.filter((m) => m.role === "user").length;
        let savedOk = true;
        let saveError = "";

        try {
            if (typeof saveInterviewRecord === "function") {
                saveInterviewRecord({
                    scenarioId: currentScenario.id,
                    scenarioTitle: currentScenario.title,
                    respondentName: currentScenario.respondentName,
                    messages: chatMessages.slice(),
                    debrief: data.content,
                    userTurns
                });
            }
            if (typeof recordSession === "function") {
                recordSession("CustDev", 0, userTurns, null, {
                    quizType: "interview"
                });
            }
        } catch (saveErr) {
            savedOk = false;
            saveError = String(saveErr && saveErr.message ? saveErr.message : saveErr);
            console.warn("Interview save failed:", saveErr);
        }

        if (interviewDebriefReplayHint) {
            interviewDebriefReplayHint.textContent = savedOk
                ? "Разбор сохранён — его можно открыть снова в Статистике."
                : `Разбор получен, но не сохранился локально${saveError ? `: ${saveError}` : ""}.`;
            interviewDebriefReplayHint.classList.remove("hidden");
            if (!savedOk) interviewDebriefReplayHint.classList.add("is-error");
            else interviewDebriefReplayHint.classList.remove("is-error");
        }
    } catch (err) {
        setInterviewLoading(false);
        interviewStatus.textContent = err.message;
    }
}

function formatDebrief(markdown) {
    return markdown
        .split("\n")
        .map((line) => {
            if (line.startsWith("## ")) {
                return `<h3 class="debrief-heading">${escapeHtml(line.slice(3))}</h3>`;
            }
            if (line.startsWith("- ")) {
                return `<li class="debrief-item">${escapeHtml(line.slice(2))}</li>`;
            }
            if (line.trim() === "") return "";
            return `<p class="debrief-p">${escapeHtml(line)}</p>`;
        })
        .join("")
        .replace(/(<li class="debrief-item">[\s\S]*?<\/li>)+/g, (m) => `<ul class="debrief-list">${m}</ul>`);
}

function closeInterview() {
    interviewActive = false;
    currentScenario = null;
    chatMessages = [];
    replayingInterviewId = null;
    interviewScreen.classList.add("hidden");
    interviewDebriefScreen.classList.add("hidden");
    if (interviewDebriefTranscript) {
        interviewDebriefTranscript.innerHTML = "";
        interviewDebriefTranscript.classList.add("hidden");
    }
    if (interviewDebriefReplayHint) {
        interviewDebriefReplayHint.classList.add("hidden");
        interviewDebriefReplayHint.classList.remove("is-error");
        interviewDebriefReplayHint.textContent = "";
    }
}

function replayInterviewRecord(id) {
    const record = typeof getInterviewRecord === "function" ? getInterviewRecord(id) : null;
    if (!record) return;

    replayingInterviewId = id;
    interviewActive = false;
    currentScenario = getInterviewScenario(record.scenarioId) || {
        id: record.scenarioId,
        title: record.scenarioTitle,
        respondentName: record.respondentName
    };
    chatMessages = record.messages || [];

    document.getElementById("train-view")?.classList.add("hidden");
    document.getElementById("stats-view")?.classList.add("hidden");
    document.getElementById("quiz-screen")?.classList.add("hidden");
    document.getElementById("results-screen")?.classList.add("hidden");
    interviewScreen.classList.add("hidden");
    interviewDebriefScreen.classList.remove("hidden");
    document.querySelector(".nav-tabs")?.classList.add("hidden");

    interviewDebriefContent.innerHTML = formatDebrief(record.debrief || "");
    if (interviewDebriefReplayHint) {
        interviewDebriefReplayHint.textContent = `Повтор разбора · ${record.scenarioTitle || record.scenarioId}`;
        interviewDebriefReplayHint.classList.remove("hidden");
    }
    if (interviewDebriefTranscript) {
        const name = record.respondentName || currentScenario?.respondentName || "Респондент";
        interviewDebriefTranscript.classList.remove("hidden");
        interviewDebriefTranscript.innerHTML = `
            <h3 class="debrief-heading">Диалог</h3>
            ${(record.messages || [])
                .map((m) => {
                    const isUser = m.role === "user";
                    return `<div class="chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}">
                        <div class="chat-bubble-label">${isUser ? "Вы" : escapeHtml(name)}</div>
                        <div class="chat-bubble-text">${escapeHtml(m.content)}</div>
                    </div>`;
                })
                .join("")}
        `;
    }
}

function confirmLeaveInterview() {
    if (!interviewActive) return true;
    return confirm("Выйти из интервью? Текущий диалог не сохранится, пока не завершите разбор.");
}

interviewSend.addEventListener("click", sendInterviewMessage);
interviewInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendInterviewMessage();
    }
});
interviewEnd.addEventListener("click", endInterview);
interviewBack.addEventListener("click", () => {
    if (!confirmLeaveInterview()) return;
    closeInterview();
    showMainView("train");
});
interviewDebriefBack.addEventListener("click", () => {
    closeInterview();
    openQuizSetupForTopic("CustDev");
});
interviewDebriefHome.addEventListener("click", () => {
    closeInterview();
    showMainView("train");
});
interviewDebriefKnowledge.addEventListener("click", () => {
    closeInterview();
    openKnowledge("CustDev");
});
