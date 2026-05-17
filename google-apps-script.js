
const SHEET_NAMES = {
  NEWSLETTER: "Newsletter",
  VOTES: "Votes",
  SUGGESTIONS: "Suggestions",
  WISH: "WishShelf"
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "newsletter") return saveNewsletter(data);
    if (action === "vote") return saveVote(data);
    if (action === "suggest") return saveSuggestion(data);

    return jsonResponse({ ok: false, message: "Unknown action." });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.toString() });
  }
}

function saveNewsletter(data) {
  const sheet = getSheet(SHEET_NAMES.NEWSLETTER);
  const email = clean(data.email);
  const name = clean(data.name);
  const source = clean(data.source || "MythShelf website");

  if (!email) return jsonResponse({ ok: false, message: "Email is required." });

  sheet.appendRow([new Date(), email, name, source]);
  return jsonResponse({ ok: true, message: "Newsletter signup saved." });
}

function saveVote(data) {
  const votesSheet = getSheet(SHEET_NAMES.VOTES);
  const wishSheet = getSheet(SHEET_NAMES.WISH);

  const bookTitle = clean(data.bookTitle);
  const author = clean(data.author);
  const voterName = clean(data.voterName);
  const reason = clean(data.reason);

  if (!bookTitle) return jsonResponse({ ok: false, message: "Book title is required." });

  votesSheet.appendRow([new Date(), bookTitle, author, voterName, reason]);
  updateWishShelfVoteCount(wishSheet, bookTitle, author);

  return jsonResponse({ ok: true, message: "Vote saved." });
}

function saveSuggestion(data) {
  const sheet = getSheet(SHEET_NAMES.SUGGESTIONS);

  const bookTitle = clean(data.bookTitle);
  const author = clean(data.author);
  const series = clean(data.series);
  const genre = clean(data.genre);
  const why = clean(data.why);
  const suggestedBy = clean(data.suggestedBy);

  if (!bookTitle || !author) {
    return jsonResponse({ ok: false, message: "Book title and author are required." });
  }

  sheet.appendRow([new Date(), bookTitle, author, series, genre, why, suggestedBy, "New"]);
  return jsonResponse({ ok: true, message: "Suggestion saved." });
}

function updateWishShelfVoteCount(sheet, bookTitle, author) {
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    sheet.appendRow([bookTitle, author, "", "", "Suggested", 1, ""]);
    return;
  }

  const headers = values[0];
  const titleCol = headers.indexOf("BookTitle");
  const authorCol = headers.indexOf("Author");
  const voteCol = headers.indexOf("VoteCount");

  if (titleCol === -1 || voteCol === -1) {
    throw new Error("WishShelf tab must include BookTitle and VoteCount columns.");
  }

  const normalizedTitle = bookTitle.toLowerCase().trim();

  for (let i = 1; i < values.length; i++) {
    const currentTitle = String(values[i][titleCol]).toLowerCase().trim();
    if (currentTitle === normalizedTitle) {
      const currentVotes = Number(values[i][voteCol]) || 0;
      sheet.getRange(i + 1, voteCol + 1).setValue(currentVotes + 1);
      return;
    }
  }

  sheet.appendRow([bookTitle, author, "", "", "Suggested", 1, ""]);
}

function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet tab: " + sheetName);
  return sheet;
}

function clean(value) {
  return String(value || "").trim();
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
