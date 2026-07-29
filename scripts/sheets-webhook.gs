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
 * Если колонок questionText / selectedText / correctText нет:
 *   выберите функцию fixHeaders → Выполнить (один раз),
 *   затем снова сделайте Новую версию развёртывания.
 *
 * Важно: Sheet.getRange(row, column, numRows, numColumns) —
 * 3-й и 4-й аргументы это РАЗМЕР, не конечная ячейка.
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
 * Приводит лист к актуальной схеме колонок.
 * Всегда гарантирует наличие questionText / selectedText / correctText
 * сразу после selectedIndex.
 */
function ensureEventHeaders(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
    return;
  }

  var existing = readHeaderRow(sheet);
  if (headersMatch(existing, EVENT_HEADERS)) {
    return;
  }

  var textIdx = headerIndex(existing, "questionText");
  var topicIdx = headerIndex(existing, "topic");
  var selectedIdx = headerIndex(existing, "selectedIndex");

  // Ошибочная миграция: topic всё ещё на месте 7, а в хвосте дубли total/percent/source
  if (
    textIdx < 0 &&
    topicIdx === 6 &&
    existing.length >= EVENT_HEADERS.length &&
    normalizeHeader(existing[15]) === "total" &&
    normalizeHeader(existing[16]) === "percent" &&
    normalizeHeader(existing[17]) === "source"
  ) {
    headerRange(sheet, 7, 3).setValues([["questionText", "selectedText", "correctText"]]);
    if (existing.length > EVENT_HEADERS.length) {
      headerRange(sheet, EVENT_HEADERS.length + 1, existing.length - EVENT_HEADERS.length).clearContent();
    }
    headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
    return;
  }

  // Старая схема без текстовых колонок: вставляем 3 колонки после selectedIndex
  if (textIdx < 0) {
    var insertAt = selectedIdx >= 0 ? selectedIdx + 2 : 7; // 1-based column index
    sheet.insertColumns(insertAt, 3);
    headerRange(sheet, insertAt, 3).setValues([["questionText", "selectedText", "correctText"]]);
  }

  // Финально выравниваем заголовки под канонический порядок
  headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
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
  ensureEventHeaders(sheet);
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

    sheet.appendRow([
      event.receivedAt || new Date().toISOString(),
      event.date || "",
      event.type || "",
      event.questionId != null ? event.questionId : "",
      event.correct === true ? "TRUE" : event.correct === false ? "FALSE" : "",
      event.selectedIndex != null ? event.selectedIndex : "",
      event.questionText || "",
      event.selectedText || "",
      event.correctText || "",
      event.topic || "",
      event.mode || "",
      event.quizType || "",
      event.sessionId || "",
      event.sessionLength || "",
      event.score != null ? event.score : "",
      event.total != null ? event.total : "",
      event.percent != null ? event.percent : "",
      body.source || "product-trainer"
    ]);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonOut({ ok: true, service: "product-trainer-sheets" });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
