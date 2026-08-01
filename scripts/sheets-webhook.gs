/**
 * Google Apps Script → лист "events".
 *
 * SCHEMA_VERSION = 5
 * Проверка: откройте URL /exec в браузере.
 * Должно быть: {"ok":true,"schemaVersion":5,"headers":[...,"visitorId","respondentCode",...]}
 *
 * Установка / обновление:
 * 1. Таблица → Расширения → Apps Script → замените ВЕСЬ код этим файлом.
 * 2. Сохранить.
 * 3. Выберите fixHeaders → Выполнить.
 * 4. Развернуть → Управление развёртываниями → карандаш → Новая версия → Развернуть.
 * 5. Тот же URL .../exec должен вернуть schemaVersion:5.
 *    Если сделали НОВОЕ развёртывание — обновите EVENTS_WEBHOOK_URL в Vercel.
 *
 * getRange(row, column, numRows, numColumns) — 3/4 аргументы = РАЗМЕР.
 */

var SHEET_NAME = "events";
var SCHEMA_VERSION = 5;

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
  "visitorId",
  "respondentCode",
  "cohort",
  "metrikaClientId",
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

function writeCanonicalHeaders(sheet) {
  headerRange(sheet, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
  clearExtraHeaderCells(sheet);
}

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
    if (KNOWN_TOPICS[g] && !KNOWN_TOPICS[j]) {
      misaligned++;
    }
  }
  return answers >= 1 && misaligned >= 1;
}

/**
 * Гарантирует колонки identity сразу после percent.
 * Чинит и v4 (percent→source), и «шапка v5 без insert».
 */
function ensureVisitorIdentityColumns(sheet, existing) {
  var percentIdx = headerIndex(existing, "percent");
  if (percentIdx < 0) return false;

  var next = normalizeHeader(existing[percentIdx + 1]);
  if (next === "visitorId") return false;

  // v4: percent | source | schemaVersion
  if (next === "source" || next === "schemaVersion") {
    sheet.insertColumns(percentIdx + 2, 4);
    writeCanonicalHeaders(sheet);
    return true;
  }

  // visitorId нет в шапке — вставляем после percent
  if (headerIndex(existing, "visitorId") < 0) {
    sheet.insertColumns(percentIdx + 2, 4);
    writeCanonicalHeaders(sheet);
    return true;
  }

  // visitorId есть, но не сразу после percent — переписываем шапку каноном
  writeCanonicalHeaders(sheet);
  return true;
}

function ensureEventHeaders(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    writeCanonicalHeaders(sheet);
    return { repaired: true, reason: "init" };
  }

  var existing = readHeaderRow(sheet);
  var textIdx = headerIndex(existing, "questionText");
  var topicIdx = headerIndex(existing, "topic");
  var selectedIdx = headerIndex(existing, "selectedIndex");
  var migratedIdentity = false;

  if (ensureVisitorIdentityColumns(sheet, existing)) {
    migratedIdentity = true;
    existing = readHeaderRow(sheet);
  }

  if (headersMatch(existing, EVENT_HEADERS) && looksLikeTopicInQuestionTextColumn(sheet)) {
    sheet.insertColumns(7, 3);
    writeCanonicalHeaders(sheet);
    return { repaired: true, reason: "shift-misaligned-data" };
  }

  if (headersMatch(existing, EVENT_HEADERS)) {
    return { repaired: migratedIdentity, reason: migratedIdentity ? "add-visitor-identity" : "ok" };
  }

  if (textIdx < 0 && (topicIdx === 6 || normalizeHeader(existing[6]) === "topic")) {
    var insertAt = selectedIdx >= 0 ? selectedIdx + 2 : 7;
    sheet.insertColumns(insertAt, 3);
  } else if (textIdx < 0) {
    var at = selectedIdx >= 0 ? selectedIdx + 2 : 7;
    sheet.insertColumns(at, 3);
  }

  existing = readHeaderRow(sheet);
  if (ensureVisitorIdentityColumns(sheet, existing)) {
    migratedIdentity = true;
    existing = readHeaderRow(sheet);
  }

  writeCanonicalHeaders(sheet);
  return {
    repaired: true,
    reason: migratedIdentity ? "normalize-headers+visitor-identity" : "normalize-headers"
  };
}

function pickIdentity(event, camel, snake, alt) {
  if (event[camel] != null && String(event[camel]).trim() !== "") return String(event[camel]).trim();
  if (snake && event[snake] != null && String(event[snake]).trim() !== "") {
    return String(event[snake]).trim();
  }
  if (alt && event[alt] != null && String(event[alt]).trim() !== "") {
    return String(event[alt]).trim();
  }
  return "";
}

function normalizeEventIdentity(event) {
  event.visitorId = pickIdentity(event, "visitorId", "visitor_id", null);
  event.respondentCode = pickIdentity(event, "respondentCode", "respondent_code", "uid");
  event.cohort = pickIdentity(event, "cohort", "cohort", null);
  event.metrikaClientId = pickIdentity(event, "metrikaClientId", "metrika_client_id", null);
  return event;
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
    event.visitorId || "",
    event.respondentCode || "",
    event.cohort || "",
    event.metrikaClientId || "",
    source || "product-trainer",
    SCHEMA_VERSION
  ];
}

function appendEventRow(sheet, event, source) {
  var repair = ensureEventHeaders(sheet);
  writeCanonicalHeaders(sheet);

  var row = buildEventRow(event, source);
  var nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, 1, EVENT_HEADERS.length).setValues([row]);
  return repair;
}

function fixHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Open Apps Script from the Sheet (Extensions → Apps Script).");
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  var result = ensureEventHeaders(sheet);
  writeCanonicalHeaders(sheet);
  result.schemaVersion = SCHEMA_VERSION;
  result.headers = EVENT_HEADERS;
  Logger.log(JSON.stringify(result));
  return result;
}

function diagnoseSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return { ok: false, error: "no data", schemaVersion: SCHEMA_VERSION, headers: EVENT_HEADERS };
  }
  var headers = readHeaderRow(sheet);
  var last = sheet.getLastRow();
  var start = Math.max(2, last - 4);
  var width = Math.max(sheet.getLastColumn(), EVENT_HEADERS.length);
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
    normalizeEventIdentity(event);

    var repair = appendEventRow(sheet, event, body.source || "product-trainer");

    return jsonOut({
      ok: true,
      schemaVersion: SCHEMA_VERSION,
      wroteQuestionText: Boolean(event.questionText),
      type: event.type,
      visitorId: event.visitorId || "",
      respondentCode: event.respondentCode || "",
      cohort: event.cohort || "",
      metrikaClientId: event.metrikaClientId || "",
      headers: EVENT_HEADERS,
      repair: repair
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
