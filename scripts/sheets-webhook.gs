/**
 * Google Apps Script для записи ответов в Google Sheets.
 *
 * ВАЖНО: скрипт должен быть привязан к таблице
 * (в нужной Sheets: Расширения → Apps Script), не отдельный проект.
 *
 * Установка:
 * 1. Откройте таблицу → Расширения → Apps Script → вставьте этот код.
 * 2. Развернуть → Новое развёртывание → Веб-приложение:
 *    - Выполнять от: меня
 *    - Доступ: Все
 * 3. Скопируйте URL (.../exec) в Vercel: EVENTS_WEBHOOK_URL
 * 4. После правок кода — новое развёртывание (новая версия) или
 *    «Управлять развёртываниями» → карандаш → Новая версия.
 *
 * Если колонки/данные съехали:
 *   выберите fixHeaders → Выполнить (один раз),
 *   затем Новую версию развёртывания.
 *
 * Sheet.getRange(row, column, numRows, numColumns) — 3-й/4-й аргументы
 * это РАЗМЕР диапазона, не конечная ячейка.
 */

var SHEET_NAME = "events";

var EVENT_HEADERS = [
  "receivedAt",
  "date",
  "type",
  "questionId",
  "correct",
  "selectedIndex",
  "questionText",
  "selectedText",
  "correctText",
  "topic",
  "mode",
  "quizType",
  "sessionId",
  "sessionLength",
  "score",
  "total",
  "percent",
  "source"
];

var KNOWN_TOPICS = {
  "Метрики": true,
  "Финансовая модель": true,
  "Юнит-экономика": true,
  JTBD: true,
  CustDev: true
};

function normalizeHeader(value) {
  return String(value || "").trim();
}

/** Диапазон 1×N начиная с колонки startCol (1-based). */
function headerRange(sheet, startCol, numCols) {
  return sheet.getRange(1, startCol, 1, numCols);
}

function readHeaderRow(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    return [];
  }
  var width = Math.max(sheet.getLastColumn(), EVENT_HEADERS.length);
  return headerRange(sheet, 1, width).getValues()[0].map(normalizeHeader);
}

function headersMatch(existing, expected) {
  if (existing.length < expected.length) {
    return false;
  }
  for (var i = 0; i < expected.length; i++) {
    if (normalizeHeader(existing[i]) !== expected[i]) {
      return false;
    }
  }
  return true;
}

function headerIndex(existing, name) {
  for (var i = 0; i < existing.length; i++) {
    if (normalizeHeader(existing[i]) === name) {
      return i;
    }
  }
  return -1;
}

/**
 * Бывает после «починки» только заголовков: в колонке questionText лежит topic.
 * Тогда вставляем 3 пустые колонки после selectedIndex и выравниваем шапку.
 */
function looksLikeTopicInQuestionTextColumn(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return false;
  }

  var sampleSize = Math.min(40, lastRow - 1);
  var startRow = lastRow - sampleSize + 1;
  // SIZE form: (row, column, numRows, numColumns)
  var types = sheet.getRange(startRow, 3, sampleSize, 1).getValues();
  var questionTexts = sheet.getRange(startRow, 7, sampleSize, 1).getValues();
  var topics = sheet.getRange(startRow, 10, sampleSize, 1).getValues();

  var answers = 0;
  var misaligned = 0;

  for (var i = 0; i < sampleSize; i++) {
    if (String(types[i][0] || "") !== "answer") {
      continue;
    }
    answers++;
    var qText = String(questionTexts[i][0] || "").trim();
    var topic = String(topics[i][0] || "").trim();
    if (KNOWN_TOPICS[qText] && (!topic || topic.length < 2)) {
      misaligned++;
    }
  }

  return answers >= 2 && misaligned >= Math.max(2, Math.ceil(answers * 0.4));
}

function clearExtraHeaderCells(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol > EVENT_HEADERS.length) {
    headerRange(sheet, EVENT_HEADERS.length + 1, lastCol - EVENT_HEADERS.length).clearContent();
  }
}

/**
 * Приводит лист к схеме EVENT_HEADERS и чинит съехавшие данные.
 */
function ensureEventHeaders(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
    return { repaired: false, reason: "init" };
  }

  var existing = readHeaderRow(sheet);
  var textIdx = headerIndex(existing, "questionText");
  var topicIdx = headerIndex(existing, "topic");
  var selectedIdx = headerIndex(existing, "selectedIndex");

  // Канонические заголовки, но данные не сдвигали (topic в колонке questionText)
  if (headersMatch(existing, EVENT_HEADERS) && looksLikeTopicInQuestionTextColumn(sheet)) {
    sheet.insertColumns(7, 3);
    headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
    clearExtraHeaderCells(sheet);
    return { repaired: true, reason: "shift-misaligned-data" };
  }

  if (headersMatch(existing, EVENT_HEADERS)) {
    clearExtraHeaderCells(sheet);
    return { repaired: false, reason: "ok" };
  }

  // Старая схема: topic сразу после selectedIndex — вставляем 3 колонки под тексты
  if (textIdx < 0 && (topicIdx === 6 || normalizeHeader(existing[6]) === "topic")) {
    var insertAt = selectedIdx >= 0 ? selectedIdx + 2 : 7;
    sheet.insertColumns(insertAt, 3);
    headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
    clearExtraHeaderCells(sheet);
    return { repaired: true, reason: "insert-text-columns" };
  }

  // Нет текстовых колонок в другом порядке — вставляем после selectedIndex
  if (textIdx < 0) {
    var at = selectedIdx >= 0 ? selectedIdx + 2 : 7;
    sheet.insertColumns(at, 3);
  }

  headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
  clearExtraHeaderCells(sheet);
  return { repaired: true, reason: "normalize-headers" };
}

/**
 * Строка строго по именам заголовков — не зависит от порядка колонок.
 */
function buildEventRow(headers, event, source) {
  var values = {
    receivedAt: event.receivedAt || new Date().toISOString(),
    date: event.date || "",
    type: event.type || "",
    questionId: event.questionId != null ? event.questionId : "",
    correct: event.correct === true ? "TRUE" : event.correct === false ? "FALSE" : "",
    selectedIndex: event.selectedIndex != null ? event.selectedIndex : "",
    questionText: event.questionText != null ? String(event.questionText) : "",
    selectedText: event.selectedText != null ? String(event.selectedText) : "",
    correctText: event.correctText != null ? String(event.correctText) : "",
    topic: event.topic || "",
    mode: event.mode || "",
    quizType: event.quizType || "",
    sessionId: event.sessionId || "",
    sessionLength: event.sessionLength || "",
    score: event.score != null ? event.score : "",
    total: event.total != null ? event.total : "",
    percent: event.percent != null ? event.percent : "",
    source: source || "product-trainer"
  };

  return headers.map(function (name) {
    var key = normalizeHeader(name);
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : "";
  });
}

/**
 * Ручной запуск из редактора Apps Script:
 * выбрать fixHeaders → Выполнить.
 */
function fixHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Open Apps Script from the Sheet (Extensions → Apps Script).");
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  var result = ensureEventHeaders(sheet);
  Logger.log(JSON.stringify(result));
  return result;
}

function doPost(e) {
  try {
    var body = {};
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : "";
    if (raw) {
      body = JSON.parse(raw);
    }

    var event = body.event || body;
    if (!event || !event.type) {
      return jsonOut({ ok: false, error: "event.type required" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return jsonOut({
        ok: false,
        error: "No active spreadsheet. Open Apps Script from the Sheet (Extensions → Apps Script)."
      });
    }

    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    ensureEventHeaders(sheet);
    var headers = readHeaderRow(sheet);
    if (!headersMatch(headers, EVENT_HEADERS)) {
      headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
      headers = EVENT_HEADERS.slice();
    } else {
      headers = EVENT_HEADERS.slice();
    }

    // Нормализуем тексты: null/undefined → ""
    event.questionText = event.questionText == null ? "" : String(event.questionText);
    event.selectedText = event.selectedText == null ? "" : String(event.selectedText);
    event.correctText = event.correctText == null ? "" : String(event.correctText);

    if (event.type === "answer" && !event.questionText) {
      Logger.log("answer without questionText, questionId=" + event.questionId);
    }

    sheet.appendRow(buildEventRow(headers, event, body.source || "product-trainer"));

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonOut({ ok: true, service: "product-trainer-sheets" });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
