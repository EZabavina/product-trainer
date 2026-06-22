// Generated from data/topics.json — run: node scripts/build-config.mjs
const TOPIC_CONFIG = [
    {
        "id": "metrics",
        "name": "Метрики",
        "icon": "📊",
        "color": "#6366F1",
        "description": "AARRR, retention, LTV, когорты",
        "modes": [
            {
                "id": "определение",
                "label": "Определения",
                "icon": "📖",
                "description": "Термины, формулы, различия понятий"
            },
            {
                "id": "кейс",
                "label": "Кейсы",
                "icon": "🧩",
                "description": "Ситуации и диагностика по метрикам"
            }
        ]
    },
    {
        "id": "finance",
        "name": "Финансовая модель",
        "icon": "💰",
        "color": "#10B981",
        "description": "P&L, runway, unit economics в финмодели"
    },
    {
        "id": "unit-economics",
        "name": "Юнит-экономика",
        "icon": "⚖️",
        "color": "#8B5CF6",
        "description": "CAC, LTV, маржинальность, payback"
    },
    {
        "id": "jtbd",
        "name": "JTBD",
        "icon": "🎯",
        "color": "#F59E0B",
        "description": "Jobs, forces, switching interviews"
    },
    {
        "id": "custdev",
        "name": "CustDev",
        "icon": "🗣️",
        "color": "#EC4899",
        "description": "Интервью, Mom Test, валидация"
    }
];

function getTopicConfig(name) {
    return TOPIC_CONFIG.find((t) => t.name === name) || {
        id: name,
        name,
        icon: "📚",
        color: "#64748B",
        description: ""
    };
}

function getActiveTopics() {
    const withQuestions = new Set(QUESTIONS.map((q) => q.topic));
    return TOPIC_CONFIG.filter((t) => withQuestions.has(t.name));
}
