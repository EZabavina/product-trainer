/** Generated from data/unit-calc-scenarios.json — node scripts/build-unit-calc.mjs */
const UNIT_CALC_SCENARIOS = [
    {
        "id": "uc1",
        "title": "Число платящих",
        "brief": "Food delivery. Из потока пользователей нужно найти число платящих.",
        "icon": "👥",
        "given": [
            {
                "key": "users",
                "label": "Users",
                "value": 50000,
                "unit": ""
            },
            {
                "key": "c1",
                "label": "C1",
                "value": 0.1,
                "unit": "%",
                "display": "10%"
            }
        ],
        "ask": [
            {
                "key": "buyers",
                "label": "Buyers",
                "formula": "Buyers",
                "answer": 5000,
                "hint": "50 000 × 10% = 5 000"
            }
        ],
        "sheetHint": "Поток → C1 → Buyers"
    },
    {
        "id": "uc2",
        "title": "ARPPU / LTV платящего",
        "brief": "Даны средний чек, COGS и число покупок на платящего. Найдите ARPPU.",
        "icon": "💵",
        "given": [
            {
                "key": "avPrice",
                "label": "AvPrice",
                "value": 600,
                "unit": "₽"
            },
            {
                "key": "cogsPct",
                "label": "COGS",
                "value": 0.05,
                "unit": "%",
                "display": "5%"
            },
            {
                "key": "lifetime",
                "label": "Lifetime",
                "value": 1.2,
                "unit": ""
            }
        ],
        "ask": [
            {
                "key": "arppu",
                "label": "ARPPU, ₽",
                "formula": "ARPPU",
                "answer": 684,
                "hint": "600 × 0,95 × 1,2 = 684"
            }
        ],
        "sheetHint": "Доход на 1-го платящего (ARPPU / CLTV)"
    },
    {
        "id": "uc3",
        "title": "CAC платящего",
        "brief": "Paid-канал: известны spend и число платящих. Найдите CAC.",
        "icon": "🎯",
        "given": [
            {
                "key": "spend",
                "label": "Spend",
                "value": 100000,
                "unit": "₽"
            },
            {
                "key": "buyers",
                "label": "Buyers",
                "value": 1000,
                "unit": ""
            }
        ],
        "ask": [
            {
                "key": "cac",
                "label": "CAC, ₽",
                "formula": "CAC",
                "answer": 100,
                "hint": "100 000 / 1 000 = 100"
            }
        ],
        "sheetHint": "CAC"
    },
    {
        "id": "uc4",
        "title": "ARPU с привлечённого",
        "brief": "Даны ARPPU и C1. Найдите ARPU на привлечённого пользователя.",
        "icon": "📉",
        "given": [
            {
                "key": "arppu",
                "label": "ARPPU",
                "value": 684,
                "unit": "₽"
            },
            {
                "key": "c1",
                "label": "C1",
                "value": 0.1,
                "unit": "%",
                "display": "10%"
            }
        ],
        "ask": [
            {
                "key": "arpu",
                "label": "ARPU, ₽",
                "formula": "ARPU",
                "answer": 68.4,
                "hint": "684 × 10% = 68,4"
            }
        ],
        "sheetHint": "Доход на 1-го привлечённого (ARPU)"
    },
    {
        "id": "uc5",
        "title": "Сходится ли юнит? LTV/CAC",
        "brief": "Даны AvPrice, COGS, Lifetime, Spend и Buyers. Найдите LTV платящего, CAC и LTV/CAC.",
        "icon": "⚖️",
        "given": [
            {
                "key": "avPrice",
                "label": "AvPrice",
                "value": 600,
                "unit": "₽"
            },
            {
                "key": "cogsPct",
                "label": "COGS",
                "value": 0.05,
                "unit": "%",
                "display": "5%"
            },
            {
                "key": "lifetime",
                "label": "Lifetime",
                "value": 1.2,
                "unit": ""
            },
            {
                "key": "spend",
                "label": "Spend",
                "value": 100000,
                "unit": "₽"
            },
            {
                "key": "buyers",
                "label": "Buyers",
                "value": 1000,
                "unit": ""
            }
        ],
        "ask": [
            {
                "key": "ltv",
                "label": "LTV (ARPPU), ₽",
                "formula": "LTV",
                "answer": 684,
                "hint": "600 × 0,95 × 1,2 = 684"
            },
            {
                "key": "cac",
                "label": "CAC, ₽",
                "formula": "CAC",
                "answer": 100,
                "hint": "100 000 / 1 000 = 100"
            },
            {
                "key": "ratio",
                "label": "LTV/CAC",
                "formula": "LTV/CAC",
                "answer": 6.84,
                "hint": "684 / 100 = 6,84 — юнит сходится (≥ 3)"
            }
        ],
        "sheetHint": "Ориентир здорового юнита: LTV/CAC часто ≥ 3"
    },
    {
        "id": "uc6",
        "title": "Payback в месяцах",
        "brief": "Даны CAC и месячная маржа с платящего. Найдите Payback.",
        "icon": "⏳",
        "given": [
            {
                "key": "cac",
                "label": "CAC",
                "value": 600,
                "unit": "₽"
            },
            {
                "key": "marginMonth",
                "label": "Contribution / мес.",
                "value": 150,
                "unit": "₽"
            }
        ],
        "ask": [
            {
                "key": "payback",
                "label": "Payback, мес.",
                "formula": "Payback",
                "answer": 4,
                "hint": "600 / 150 = 4 месяца"
            }
        ],
        "sheetHint": "Срок окупаемости CAC"
    },
    {
        "id": "uc7",
        "title": "Blended CAC врёт",
        "brief": "Paid и free каналы с разными Users и одним Spend на paid. Найдите CAC paid и Blended CAC на платящего.",
        "icon": "🔀",
        "given": [
            {
                "key": "paidUsers",
                "label": "Users (paid)",
                "value": 10000,
                "unit": ""
            },
            {
                "key": "freeUsers",
                "label": "Users (free)",
                "value": 40000,
                "unit": ""
            },
            {
                "key": "spend",
                "label": "Spend (paid)",
                "value": 100000,
                "unit": "₽"
            },
            {
                "key": "c1",
                "label": "C1",
                "value": 0.1,
                "unit": "%",
                "display": "10%"
            }
        ],
        "ask": [
            {
                "key": "cacPaid",
                "label": "CAC paid, ₽",
                "formula": "CAC paid",
                "answer": 100,
                "hint": "100 000 / 1 000 = 100"
            },
            {
                "key": "cacBlended",
                "label": "Blended CAC, ₽",
                "formula": "Blended CAC",
                "answer": 20,
                "hint": "100 000 / 5 000 = 20 — blended занижает дорогой канал"
            }
        ],
        "sheetHint": "Строки paid / free / все пользователи"
    },
    {
        "id": "uc8",
        "title": "Юнит на привлечённого",
        "brief": "Даны ARPU и CPA. Найдите юнит на одного привлечённого пользователя.",
        "icon": "➕",
        "given": [
            {
                "key": "arpu",
                "label": "ARPU",
                "value": 68.4,
                "unit": "₽"
            },
            {
                "key": "cpa",
                "label": "CPA",
                "value": 10,
                "unit": "₽"
            }
        ],
        "ask": [
            {
                "key": "profitPerUser",
                "label": "Unit, ₽",
                "formula": "Unit",
                "answer": 58.4,
                "hint": "68,4 − 10 = 58,4"
            }
        ],
        "sheetHint": "Юнит на привлечённого после CPA"
    },
    {
        "id": "uc9",
        "title": "ROI привлечения",
        "brief": "Даны Gross Profit с потока и Acq Costs. Найдите ROI как долю (не проценты).",
        "icon": "📈",
        "given": [
            {
                "key": "profit",
                "label": "Gross Profit",
                "value": 240000,
                "unit": "₽"
            },
            {
                "key": "spend",
                "label": "Acq Costs",
                "value": 80000,
                "unit": "₽"
            }
        ],
        "ask": [
            {
                "key": "roi",
                "label": "ROI",
                "formula": "ROI",
                "answer": 2,
                "hint": "(240 000 − 80 000) / 80 000 = 2 → 200%"
            }
        ],
        "sheetHint": "ROI привлечения"
    },
    {
        "id": "uc10",
        "title": "Какой рычаг сильнее?",
        "brief": "База: Contribution LTV платящего и CAC. Сценарий A — меняется только C1. B — новый CAC. C — новый LTV. Найдите юнит платящего в каждом сценарии.",
        "icon": "🦾",
        "given": [
            {
                "key": "ltvBase",
                "label": "LTV (база)",
                "value": 360,
                "unit": "₽"
            },
            {
                "key": "cacBase",
                "label": "CAC (база)",
                "value": 100,
                "unit": "₽"
            },
            {
                "key": "cacB",
                "label": "CAC (B)",
                "value": 50,
                "unit": "₽"
            },
            {
                "key": "ltvC",
                "label": "LTV (C)",
                "value": 540,
                "unit": "₽"
            },
            {
                "key": "noteA",
                "label": "Сценарий A",
                "value": 0,
                "unit": "",
                "display": "C1 ×3"
            }
        ],
        "ask": [
            {
                "key": "unitA",
                "label": "Unit A, ₽",
                "formula": "Unit A",
                "answer": 260,
                "hint": "C1 не меняет юнит платящего: 360 − 100 = 260"
            },
            {
                "key": "unitB",
                "label": "Unit B, ₽",
                "formula": "Unit B",
                "answer": 310,
                "hint": "360 − 50 = 310"
            },
            {
                "key": "unitC",
                "label": "Unit C, ₽",
                "formula": "Unit C",
                "answer": 440,
                "hint": "540 − 100 = 440 — сильнее остальных"
            }
        ],
        "sheetHint": "Сравнивайте Contribution LTV и CAC по сценариям"
    }
];
