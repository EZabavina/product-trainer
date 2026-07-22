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
 * Лист "events" создаётся автоматически.
 */

var SHEET_NAME = "events";

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

    var headers = [
      "receivedAt",
      "date",
      "type",
      "questionId",
      "correct",
      "selectedIndex",
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

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    sheet.appendRow([
      event.receivedAt || new Date().toISOString(),
      event.date || "",
      event.type || "",
      event.questionId != null ? event.questionId : "",
      event.correct === true ? "TRUE" : event.correct === false ? "FALSE" : "",
      event.selectedIndex != null ? event.selectedIndex : "",
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
