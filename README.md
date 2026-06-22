# Тренажёр Продакта

Веб-тренажёр для продакт-менеджеров: **265 вопросов** по 5 темам, база знаний, статистика в localStorage.

## Темы

| Тема | Вопросов |
|------|----------|
| Метрики | 50 |
| Финансовая модель | 50 |
| Юнит-экономика | 50 |
| JTBD | 50 |
| CustDev | 50 |

За один раунд — **15 случайных вопросов** из выбранной темы.

## Запуск

Откройте `index.html` через локальный сервер (рекомендуется):

```bash
# Python
python3 -m http.server 8080

# или npx
npx serve .
```

Перейдите на `http://localhost:8080`.

## Структура проекта

```
index.html          — разметка
css/style.css       — стили
js/
  app.js            — UI и логика квиза
  config.js         — темы (генерируется)
  knowledge.js      — база знаний и ссылки
  questions.js      — вопросы (генерируется)
  stats.js          — статистика localStorage
  utils.js          — escapeHtml и утилиты
data/
  topics.json       — единый конфиг тем (источник правды)
  questions-source.txt — исходник вопросов в markdown
scripts/
  build-config.mjs  — topics.json → config.js
  parse-questions.mjs — source → questions.js
  clean-distractors.mjs — очистка и баланс неверных ответов
favicon.svg
```

## Как обновить вопросы

1. Отредактируйте `data/questions-source.txt` в формате:

```
**1. Текст вопроса**
A) вариант
B) вариант
C) вариант
D) вариант
*Верно:* B. *Объяснение:* ... *Пример:* ... (опционально)
```

2. Пересоберите файлы:

```bash
node scripts/parse-questions.mjs
```

3. Если нужно выровнять длину **неверных** ответов (правильные не трогаются):

```bash
node scripts/clean-distractors.mjs
```

## Как добавить или изменить тему

1. Отредактируйте `data/topics.json` — поля `id`, `name`, `icon`, `color`, `description`, `maxQuestion` (верхняя граница номера вопроса в source).
2. Сгенерируйте `config.js`:

```bash
node scripts/build-config.mjs
```

3. Добавьте блок в `js/knowledge.js` (опционально).
4. Пересоберите вопросы, если менялись номера.

## База знаний

Материалы в `js/knowledge.js`. После обновления ссылок проверьте их в браузере — часть сайтов блокирует автоматические HTTP-проверки.

## Статистика

Хранится в `localStorage` под ключом `product-trainer-stats`. Сброс — кнопка «Сбросить статистику» на вкладке «Статистика».

## Деплой

Статический сайт: GitHub Pages, Netlify, Vercel — загрузите все файлы как есть.
