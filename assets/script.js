const MYTHSHELF_APP_URL = "https://script.google.com/macros/s/AKfycbx9A-7XQnXYmffFZso8-eFXh8NqgxiLjqU1TPWwr3Zoh5HqXJTBhGr31hyCe4ASGidc/exec";
const TOP_VOTES_URL = `${MYTHSHELF_APP_URL}?action=top_votes&limit=10`;
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1kd9gestpjoV03IBcvCoEbTo93Ybknr-mm7wiQKLl8DI/export?format=csv&gid=0";

let allBooks = [];
let activeFilter = "";

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitCSV(line) {
  const result = [];
  let current = "";
  let quote = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quote && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      quote = !quote;
    } else if (char === "," && !quote) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const rows = text.split(/\r?\n/).filter(row => row.trim());
  if (!rows.length) return [];
  const headers = splitCSV(rows[0]).map(header => header.trim());
  return rows.slice(1).map(line => {
    const values = splitCSV(line);
    const item = {};
    headers.forEach((header, i) => item[header] = values[i] ? values[i].trim() : "");
    return item;
  }).filter(item => item.Title);
}

function textOfBook(book) {
  return [
    book.Title,
    book.Author,
    book.Series,
    book.Subgenre,
    book.Tier,
    book.ReviewStatus,
    book.ReadingFormat,
    book.ReadingProgress,
    book.ReadingEra,
    book.Tags,
    book.ShortHook
  ].join(" ").toLowerCase();
}

async function loadTopVotedQuests() {
  const grid = document.getElementById("topVotesGrid");
  if (!grid) return;

  try {
    const response = await fetch(TOP_VOTES_URL, { cache: "no-store" });
    const data = await response.json();

    if (!data.ok || !Array.isArray(data.votes) || data.votes.length === 0) {
      grid.innerHTML = `<p class="loading-note">No Wish Shelf votes yet. Cast the first vote.</p>`;
      return;
    }

    grid.innerHTML = data.votes.map((item, index) => {
      const voteCount = Number(item.voteCount) || 0;
      return `
        <article class="vote-card">
          <span class="vote-rank">#${index + 1}</span>
          <strong>${escapeHTML(item.bookTitle)}</strong>
          <span>${escapeHTML(item.author || "Author not listed")}</span>
          <span>${escapeHTML(item.genre || item.series || "Wish Shelf")}</span>
          <div class="vote-count">${voteCount} vote${voteCount === 1 ? "" : "s"}</div>
        </article>
      `;
    }).join("");

  } catch (error) {
    console.warn("Top votes failed:", error);
    grid.innerHTML = `<p class="loading-note">Top voted quests could not be loaded right now.</p>`;
  }
}

async function loadShelf() {
  const grid = document.getElementById("bookGrid");
  if (!grid) return;

  try {
    const response = await fetch(`${SHEET_CSV_URL}&cacheBust=${Date.now()}`, { cache: "no-store" });
    const text = await response.text();
    allBooks = parseCSV(text);
    renderStats(allBooks);
    renderBooks(allBooks);
  } catch (error) {
    console.warn("Shelf failed:", error);
    grid.innerHTML = `<p class="loading-note">The shelf could not be reached right now.</p>`;
  }
}

function renderStats(books) {
  const bookCount = document.getElementById("bookCount");
  const reviewedCount = document.getElementById("reviewedCount");
  const readingCount = document.getElementById("readingCount");
  const pausedCount = document.getElementById("pausedCount");
  if (bookCount) bookCount.textContent = books.length;
  if (reviewedCount) reviewedCount.textContent = books.filter(b => /finished|reviewed/i.test(`${b.ReadingProgress} ${b.ReviewStatus}`)).length;
  if (readingCount) readingCount.textContent = books.filter(b => /currently/i.test(`${b.ReadingProgress} ${b.ReviewStatus}`)).length;
  if (pausedCount) pausedCount.textContent = books.filter(b => /paused|stopped|abandoned/i.test(`${b.ReadingProgress} ${b.ReviewStatus} ${b.Tier}`)).length;
}

function renderBooks(books) {
  const grid = document.getElementById("bookGrid");
  if (!grid) return;

  if (!books.length) {
    grid.innerHTML = `<p class="loading-note">No books matched that search.</p>`;
    return;
  }

  grid.innerHTML = books.slice(0, 120).map(book => `
    <article class="book-card">
      <strong>${escapeHTML(book.Title)}</strong>
      <span>${escapeHTML(book.Author)} · ${escapeHTML(book.Series || "Standalone")}</span>
      <span>${escapeHTML(book.Subgenre || "Fantasy")}</span>
      <div>
        <span class="pill">${escapeHTML(book.Tier || "Mapped")}</span>
        <span class="pill">${escapeHTML(book.ReadingProgress || book.ReviewStatus || "Shelf")}</span>
        ${book.MythShelfScore ? `<span class="pill">MythShelf ${escapeHTML(book.MythShelfScore)}/5</span>` : ""}
      </div>
      <p class="hook">${escapeHTML(book.ShortHook || "This quest is still being mapped.")}</p>
    </article>
  `).join("");
}

function applyFilters() {
  const search = document.getElementById("bookSearch");
  const query = search ? search.value.toLowerCase().trim() : "";
  const filtered = allBooks.filter(book => {
    const text = textOfBook(book);
    const matchesSearch = !query || text.includes(query);
    const matchesFilter = !activeFilter || text.includes(activeFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });
  renderBooks(filtered);
}

function setupFilters() {
  const search = document.getElementById("bookSearch");
  if (search) search.addEventListener("input", applyFilters);

  document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "";
      document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.toggle("active", btn === button && activeFilter));
      applyFilters();
    });
  });
}

function postToCollector(payload) {
  return fetch(MYTHSHELF_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      ...payload,
      page: window.location.href,
      userAgent: navigator.userAgent
    })
  });
}

function formDataToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setupForms() {
  const voteForm = document.getElementById("voteForm");
  const suggestForm = document.getElementById("suggestForm");
  const newsletterForm = document.getElementById("newsletterForm");

  if (voteForm) {
    voteForm.addEventListener("submit", async event => {
      event.preventDefault();
      const status = document.getElementById("voteStatus");
      const data = formDataToObject(voteForm);
      try {
        await postToCollector({ action: "vote", ...data });
        if (status) { status.textContent = "Your vote was sent to the Wish Shelf."; status.className = "form-status ok"; }
        voteForm.reset();
        setTimeout(loadTopVotedQuests, 1600);
      } catch (error) {
        if (status) { status.textContent = "The vote could not be sent right now."; status.className = "form-status fail"; }
      }
    });
  }

  if (suggestForm) {
    suggestForm.addEventListener("submit", async event => {
      event.preventDefault();
      const status = document.getElementById("suggestStatus");
      const data = formDataToObject(suggestForm);
      try {
        await postToCollector({ action: "suggest", ...data });
        if (status) { status.textContent = "Your suggestion was sent."; status.className = "form-status ok"; }
        suggestForm.reset();
      } catch (error) {
        if (status) { status.textContent = "The suggestion could not be sent right now."; status.className = "form-status fail"; }
      }
    });
  }

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async event => {
      event.preventDefault();
      const status = document.getElementById("newsletterStatus");
      const data = formDataToObject(newsletterForm);
      try {
        await postToCollector({ action: "newsletter", source: "MythShelf website", ...data });
        if (status) { status.textContent = "You were added to the list."; status.className = "form-status ok"; }
        newsletterForm.reset();
      } catch (error) {
        if (status) { status.textContent = "Signup could not be sent right now."; status.className = "form-status fail"; }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadTopVotedQuests();
  loadShelf();
  setupFilters();
  setupForms();
});
