/**
 * Google Apps Script → лист "events".
 *
 * SCHEMA_VERSION = 4
 * Проверка, что стоит НОВЫЙ код: откройте URL /exec в браузере.
 * Должно быть: {"ok":true,"service":"product-trainer-sheets","schemaVersion":4}
 * Если schemaVersion нет — вы смотрите СТАРОЕ развёртывание. Сделайте Новую версию.
 *
 * Установка / обновление:
 * 1. Таблица → Расширения → Apps Script → замените ВЕСЬ код этим файлом.
 * 2. Сохранить.
 * 3. Выберите fixHeaders → Выполнить.
 * 4. Развернуть → Управление развёртываниями → карандаш → Новая версия → Развернуть.
 *    (просто «Сохранить» в редакторе НЕ обновляет /exec!)
 * 5. URL .../exec → Vercel env EVENTS_WEBHOOK_URL → Redeploy.
 *
 * Sheet.getRange(row, column, numRows, numColumns) — 3/4 аргументы = РАЗМЕР.
 */

var SHEET_NAME = "events";
var SCHEMA_VERSION = 4;

/**
 * Канонический порядок колонок.
 * questionText / selectedText / correctText — ТЕКСТЫ, не topic/mode/quizType.
 */
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
  "source",
  "schemaVersion"
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
  if (existing.length < expected.length) return false;
  for (var i = 0; i < expected.length; i++) {
    if (normalizeHeader(existing[i]) !== expected[i]) return false;
  }
  return true;
}

function headerIndex(existing, name) {
  for (var i = 0; i < existing.length; i++) {
    if (normalizeHeader(existing[i]) === name) return i;
  }
  return -1;
}

function clearExtraHeaderCells(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol > EVENT_HEADERS.length) {
    headerRange(sheet, EVENT_HEADERS.length + 1, lastCol - EVENT_HEADERS.length).clearContent();
  }
}

/**
 * Признаки старого appendRow: в колонке G (7) лежит название темы.
 */
function looksLikeTopicInQuestionTextColumn(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  var sampleSize = Math.min(50, lastRow - 1);
  var startRow = lastRow - sampleSize + 1;
  var types = sheet.getRange(startRow, 3, sampleSize, 1).getValues();
  var col7 = sheet.getRange(startRow, 7, sampleSize, 1).getValues();
  var col10 = sheet.getRange(startRow, 10, sampleSize, 1).getValues();

  var answers = 0;
  var misaligned = 0;
  for (var i = 0; i < sampleSize; i++) {
    if (String(types[i][0] || "") !== "answer") continue;
    answers++;
    var g = String(col7[i][0] || "").trim();
    var j = String(col10[i][0] || "").trim();
    // G = topic name, J пусто или не topic → старый порядок полей
    if (KNOWN_TOPICS[g] && !KNOWN_TOPICS[j]) {
      misaligned++;
    }
  }
  return answers >= 1 && misaligned >= 1;
}

function ensureEventHeaders(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
    return { repaired: true, reason: "init" };
  }

  var existing = readHeaderRow(sheet);
  var textIdx = headerIndex(existing, "questionText");
  var topicIdx = headerIndex(existing, "topic");
  var selectedIdx = headerIndex(existing, "selectedIndex");

  // Заголовки «как надо», но данные старого формата → сдвиг
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

  // topic сразу после selectedIndex (классическая старая схема)
  if (textIdx < 0 && (topicIdx === 6 || normalizeHeader(existing[6]) === "topic")) {
    var insertAt = selectedIdx >= 0 ? selectedIdx + 2 : 7;
    sheet.insertColumns(insertAt, 3);
  } else if (textIdx < 0) {
    var at = selectedIdx >= 0 ? selectedIdx + 2 : 7;
    sheet.insertColumns(at, 3);
  }

  headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
  clearExtraHeaderCells(sheet);
  return { repaired: true, reason: "normalize-headers" };
}

function buildEventRow(event, source) {
  return [
    event.receivedAt || new Date().toISOString(),
    event.date || "",
    event.type || "",
    event.questionId != null ? event.questionId : "",
    event.correct === true ? "TRUE" : event.correct === false ? "FALSE" : "",
    event.selectedIndex != null ? event.selectedIndex : "",
    event.questionText != null ? String(event.questionText) : "",
    event.selectedText != null ? String(event.selectedText) : "",
    event.correctText != null ? String(event.correctText) : "",
    event.topic || "",
    event.mode || "",
    event.quizType || "",
    event.sessionId || "",
    event.sessionLength || "",
    event.score != null ? event.score : "",
    event.total != null ? event.total : "",
    event.percent != null ? event.percent : "",
    source || "product-trainer",
    SCHEMA_VERSION
  ];
}

function appendEventRow(sheet, event, source) {
  ensureEventHeaders(sheet);
  // Всегда перезаписываем шапку каноном — защита от ручных правок
  headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);

  var row = buildEventRow(event, source);
  var nextRow = sheet.getLastRow() + 1;
  // SIZE form: 1 строка, N колонок начиная с A
  sheet.getRange(nextRow, 1, 1, EVENT_HEADERS.length).setValues([row]);
}

function fixHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Open Apps Script from the Sheet (Extensions → Apps Script).");
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  var result = ensureEventHeaders(sheet);
  headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
  clearExtraHeaderCells(sheet);
  result.schemaVersion = SCHEMA_VERSION;
  Logger.log(JSON.stringify(result));
  return result;
}

/**
 * Диагностика: последние answer-строки по именам колонок.
 * Выполнить в редакторе: diagnoseSheet
 */
function diagnoseSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return { ok: false, error: "no data" };
  }
  var headers = readHeaderRow(sheet);
  var last = sheet.getLastRow();
  var start = Math.max(2, last - 4);
  var width = Math.min(sheet.getLastColumn(), EVENT_HEADERS.length);
  var values = sheet.getRange(start, 1, last - start + 1, width).getValues();
  var rows = values.map(function (r) {
    var obj = {};
    for (var i = 0; i < EVENT_HEADERS.length; i++) {
      obj[EVENT_HEADERS[i]] = r[i];
    }
    return obj;
  });
  return {
    ok: true,
    schemaVersion: SCHEMA_VERSION,
    headers: headers.slice(0, EVENT_HEADERS.length),
    sample: rows
  };
}

function doPost(e) {
  try {
    var body = {};
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : "";
    if (raw) body = JSON.parse(raw);

    var event = body.event || body;
    if (!event || !event.type) {
      return jsonOut({ ok: false, error: "event.type required", schemaVersion: SCHEMA_VERSION });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return jsonOut({
        ok: false,
        error: "No active spreadsheet. Open Apps Script from the Sheet.",
        schemaVersion: SCHEMA_VERSION
      });
    }

    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    event.questionText = event.questionText == null ? "" : String(event.questionText);
    event.selectedText = event.selectedText == null ? "" : String(event.selectedText);
    event.correctText = event.correctText == null ? "" : String(event.correctText);

    appendEventRow(sheet, event, body.source || "product-trainer");

    return jsonOut({
      ok: true,
      schemaVersion: SCHEMA_VERSION,
      wroteQuestionText: Boolean(event.questionText),
      type: event.type
    });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err), schemaVersion: SCHEMA_VERSION });
  }
}

function doGet() {
  return jsonOut({
    ok: true,
    service: "product-trainer-sheets",
    schemaVersion: SCHEMA_VERSION,
    headers: EVENT_HEADERS
  });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
