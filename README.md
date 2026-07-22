# Тренажёр Продакта

Веб-тренажёр для продакт-менеджеров: **265 вопросов** по 5 темам, база знаний, статистика и банк ошибок в `localStorage`.

## Темы

| Тема | Вопросов |
|------|----------|
| Метрики | 65 (определения + кейсы) |
| Финансовая модель | 50 |
| Юнит-экономика | 50 |
| JTBD | 50 |
| CustDev | 50 |

## Возможности

- **Длина раунда** при старте: быстрый (5), стандарт (15) или марафон (все из пула)
- **Метрики** — два формата: определения и кейсы
- **CustDev** — квиз + **симулятор интервью** с AI-респондентом (OpenRouter)
- **Работа над ошибками** — банк вопросов, на которых ошибались; верный ответ убирает вопрос из банка
- **Статистика** — прохождения, серия дней, таблица скилов, **сложные вопросы** по истории ответов
- **Журнал ответов** — каждый ответ пишется в `localStorage` и уходит на `/api/events` → Google Sheets (через Apps Script)
- **Яндекс.Метрика** — счётчик + цели `quiz_start`, `quiz_answer`, `quiz_complete`, `view_stats`

## Запуск

**С квизом (статика):**

```bash
python3 -m http.server 8080
# или npx serve .
```

**С CustDev-симулятором (нужен API):**

```bash
cp .env.example .env   # вставьте OPENROUTER_API_KEY
npm run dev            # http://localhost:8080 + /api/interview
```

Деплой: [Vercel](https://vercel.com) — репозиторий `EZabavina/product-trainer`, Framework Preset: **Other**, env:

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| `OPENROUTER_API_KEY` | для CustDev | ключ OpenRouter |
| `EVENTS_WEBHOOK_URL` | для Sheets | URL веб-приложения Apps Script |

GitHub Pages — только квиз без AI (без `/api`).

### Google Sheets (сбор ответов)

1. Создайте таблицу Google Sheets, лист `events`.
2. **Расширения → Apps Script** — вставьте код из [`scripts/sheets-webhook.gs`](scripts/sheets-webhook.gs).
3. **Развернуть → Новое развёртывание → Веб-приложение**: выполнять от вас, доступ «Все».
4. Скопируйте URL (`…/macros/s/…/exec`) в Vercel → `EVENTS_WEBHOOK_URL`.
5. Redeploy. Каждый ответ и итог сессии появятся строкой в таблице.

Локально: тот же URL в `.env`, затем `npm run dev`.

Перейдите на `http://localhost:8080`.

## Сборка данных

После правок в `data/questions-source.txt` или `data/topics.json`:

```bash
# Полная пересборка: config.js + questions.js + валидация
node scripts/build.mjs

# Или по шагам:
node scripts/build-config.mjs
node scripts/parse-questions.mjs   # парсит и автоматически запускает validate
node scripts/validate-questions.mjs  # только проверка, без записи файлов
```

`validate-questions.mjs` завершится с кодом **1**, если:

- у вопроса не 4 варианта или нет объяснения
- дублируются `id` или текст вопроса
- у «Метрик» нет `mode` (`определение` / `кейс`)
- тема из `topics.json` не имеет ни одного вопроса

Опционально — выровнять длину **неверных** ответов:

```bash
node scripts/clean-distractors.mjs
node scripts/validate-questions.mjs
```

## Структура проекта

```
index.html
css/style.css
js/
  app.js            — UI и логика квиза
  config.js         — темы (генерируется)
  knowledge.js      — база знаний и ссылки
  questions.js      — вопросы (генерируется)
  stats.js          — статистика localStorage
  mistakes.js       — банк ошибок localStorage
  utils.js          — escapeHtml, подписи длины раунда
data/
  topics.json       — конфиг тем (источник правды)
  questions-source.txt — исходник вопросов
scripts/
  build.mjs             — build-config + parse + validate
  build-config.mjs      — topics.json → config.js
  question-parser.mjs   — общий парсер и валидатор
  parse-questions.mjs   — source → questions.js + validate
  validate-questions.mjs
  clean-distractors.mjs
```

## Формат вопроса в source

```
**1. Текст вопроса**
A) вариант
B) вариант
C) вариант
D) вариант
*Верно:* B. *Объяснение:* ... *Пример:* ... (опционально)
```

Для вопросов вне нумерации темы (например, кейсы 251+ в блоке «Метрики»):

```
*Тема:* Метрики
*Формат:* кейс
```

## Как добавить или изменить тему

1. Отредактируйте `data/topics.json` — `id`, `name`, `icon`, `color`, `description`, `maxQuestion`, опционально `modes`.
2. `node scripts/build-config.mjs`
3. Добавьте блок в `js/knowledge.js` (опционально).
4. `node scripts/build.mjs`

## База знаний

Материалы в `js/knowledge.js`. Ссылки проверяйте в браузере.

## localStorage

| Ключ | Содержимое |
|------|------------|
| `product-trainer-stats` | история прохождений |
| `product-trainer-mistakes` | банк ошибок (по `id` вопроса) |

Сброс статистики на вкладке «Статистика» также очищает банк ошибок. Устаревшие `id` (после пересборки вопросов) удаляются автоматически при открытии «Тренировки».

## Деплой

Статический сайт: GitHub Pages, Netlify, Vercel — загрузите все файлы как есть. Перед деплоем выполните `node scripts/build.mjs`.
