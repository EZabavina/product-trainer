/**
 * Google Apps Script для записи ответов в Google Sheets.
 *
 * Установка:
 * 1. Создайте таблицу Sheets с листом "events".
 * 2. Расширения → Apps Script → вставьте этот код.
 * 3. Замените SHEET_NAME при необходимости.
 * 4. Развернуть → Новое развёртывание → Веб-приложение:
 *    - Выполнять от: меня
 *    - Доступ: Все
 * 5. Скопируйте URL веб-приложения в Vercel env: EVENTS_WEBHOOK_URL
 *
 * Колонки создаются автоматически при первом событии.
 */

var SHEET_NAME = "events";

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    var event = body.event || body;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
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

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "product-trainer-sheets" }))
    .setMimeType(ContentService.MimeType.JSON);
}
