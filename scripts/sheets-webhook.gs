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
 * Лист "events" создаётся автоматически. При обновлении скрипта
 * колонки questionText / selectedText / correctText вставляются после
 * selectedIndex (а не в конец листа).
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

function readHeaderRow(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    return [];
  }
  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(normalizeHeader);
}

function headersMatch(existing, expected) {
  if (existing.length !== expected.length) {
    return false;
  }
  for (var i = 0; i < expected.length; i++) {
    if (normalizeHeader(existing[i]) !== expected[i]) {
      return false;
    }
  }
  return true;
}

function isBrokenTrailingHeaderMigration(existing) {
  return (
    existing.length >= EVENT_HEADERS.length &&
    normalizeHeader(existing[6]) === "topic" &&
    normalizeHeader(existing[15]) === "total" &&
    normalizeHeader(existing[16]) === "percent" &&
    normalizeHeader(existing[17]) === "source"
  );
}

/**
 * Приводит лист к актуальной схеме колонок.
 * - старая схема (15 колонок, topic на позиции 7): вставляет 3 колонки после selectedIndex
 * - ошибочная миграция (дубли total/percent/source в конце): правит заголовки и удаляет хвост
 */
function ensureEventHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(EVENT_HEADERS);
    return;
  }

  var existing = readHeaderRow(sheet);
  if (headersMatch(existing, EVENT_HEADERS)) {
    return;
  }

  if (normalizeHeader(existing[6]) === "questionText") {
    if (existing.length < EVENT_HEADERS.length) {
      sheet
        .getRange(1, existing.length + 1, 1, EVENT_HEADERS.length)
        .setValues([EVENT_HEADERS.slice(existing.length)]);
    }
    return;
  }

  if (isBrokenTrailingHeaderMigration(existing)) {
    sheet.getRange(1, 7, 1, 9).setValues([["questionText", "selectedText", "correctText"]]);
    if (existing.length > EVENT_HEADERS.length) {
      sheet.getRange(1, EVENT_HEADERS.length + 1, 1, existing.length).clearContent();
    }
    return;
  }

  if (normalizeHeader(existing[6]) === "topic" && existing.length <= 15) {
    sheet.insertColumns(7, 3);
    sheet.getRange(1, 7, 1, 9).setValues([["questionText", "selectedText", "correctText"]]);
    return;
  }

  if (existing.length === EVENT_HEADERS.length) {
    sheet.getRange(1, 1, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
  }
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
