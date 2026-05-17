
const MYTHSHELF_BOOKS_CSV_URL = "https://docs.google.com/spreadsheets/d/1kd9gestpjoV03IBcvCoEbTo93Ybknr-mm7wiQKLl8DI/export?format=csv&gid=0";
const LOCAL_BOOKS_CSV_URL = "books.csv";
const USE_GOOGLE_SHEET = true;

// Paste your deployed Google Apps Script Web App URL here.
const MYTHSHELF_APP_URL = "";

let books = [];
let activeFilter = "all";

function csvSource() {
  return USE_GOOGLE_SHEET ? MYTHSHELF_BOOKS_CSV_URL : LOCAL_BOOKS_CSV_URL;
}

async function loadBooks() {
  const source = csvSource();
  const sep = source.includes("?") ? "&" : "?";
  const res = await fetch(source + sep + "cacheBust=" + Date.now(), { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load books CSV");
  const text = await res.text();
  books = parseCSV(text).filter(b => b.Title);
  return books;
}

function parseCSV(text) {
  const rows = text.split(/\r?\n/).filter(row => row.trim());
  if (!rows.length) return [];
  const headers = splitCSV(rows[0]).map(h => h.trim());
  return rows.slice(1).map(line => {
    const values = splitCSV(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : "");
    return obj;
  });
}

function splitCSV(line) {
  const out = [];
  let cur = "";
  let quote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i], n = line[i + 1];
    if (c === '"' && quote && n === '"') { cur += '"'; i++; }
    else if (c === '"') quote = !quote;
    else if (c === "," && !quote) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function cleanISBN(value) {
  return String(value || "").replace(/[^0-9Xx]/g, "");
}

function getCoverURL(book) {
  if (book.CoverURL) return book.CoverURL;
  const isbn = cleanISBN(book.ISBN);
  if (isbn) return "https://covers.openlibrary.org/b/isbn/" + encodeURIComponent(isbn) + "-L.jpg";
  return "";
}

function coverClass(style) {
  const s = String(style || "").toLowerCase();
  if (s.includes("green")) return "green";
  if (s.includes("mixed")) return "mixed";
  if (s.includes("dark")) return "dark";
  if (s.includes("blue")) return "blue";
  return "red";
}

function esc(v) {
  return String(v || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function bookSearchText(book) {
  return Object.values(book).join(" ").toLowerCase();
}

function bookCard(book, opts = {}) {
  const coverURL = getCoverURL(book);
  const coverStyle = coverURL ? `style="background-image:url('${esc(coverURL)}')"` : "";
  const rank = opts.rank || book.TopPickRank || "";
  const score = book.MythShelfScore && book.MythShelfScore !== "0" ? `MythShelf ${esc(book.MythShelfScore)}/5` : esc(book.ReviewStatus || "TBR");
  const era = book.ReadingEra || "Shelf";
  return `
    <article class="book-card ${opts.carousel ? "carousel-card" : ""}">
      <div class="cover ${coverURL ? "" : coverClass(book.CoverStyle)}" ${coverStyle}>
        ${rank ? `<span class="rank">${esc(rank)}</span>` : ""}
        <small>${esc(book.Subgenre || "Fantasy")}</small>
        <strong>${esc(book.Title)}</strong>
      </div>
      <div class="book-body">
        <h3>${esc(book.Title)}</h3>
        <div class="meta">${esc(book.Author)}${book.Series ? " · " + esc(book.Series) : ""}</div>
        <div class="pill-row">
          <span class="pill score">${score}</span>
          <span class="pill status">${esc(era)}</span>
          ${book.ReadingFormat ? `<span class="pill">${esc(book.ReadingFormat)}</span>` : ""}
        </div>
        <p class="note">${esc(book.ShortHook || "")}</p>
      </div>
    </article>`;
}

function renderStats() {
  const logged = books.length;
  const reviewed = books.filter(b => /reviewed|finished/i.test(b.ReviewStatus || "")).length;
  const open = books.filter(b => /open portals|currently|paused|stopped|tbr|unfinished/i.test(`${b.ReadingEra} ${b.ReviewStatus} ${b.ReadingProgress}`)).length;
  document.querySelectorAll("[data-stat='logged']").forEach(el => el.textContent = logged);
  document.querySelectorAll("[data-stat='reviewed']").forEach(el => el.textContent = reviewed);
  document.querySelectorAll("[data-stat='open']").forEach(el => el.textContent = open);
}

function renderTop10() {
  const el = document.getElementById("top10Track");
  if (!el) return;
  let top = books.filter(b => /^yes$/i.test(b.TopPick || "") || b.TopPickRank).sort((a,b) => (Number(a.TopPickRank)||99) - (Number(b.TopPickRank)||99)).slice(0,10);
  if (!top.length) top = books.filter(b => Number(b.MythShelfScore) >= 5).slice(0,10);
  const doubled = [...top, ...top];
  el.innerHTML = doubled.map((b, i) => bookCard(b, { carousel: true, rank: b.TopPickRank || ((i % top.length) + 1) })).join("");
}

function renderCurrent() {
  const el = document.getElementById("currentGrid");
  if (!el) return;
  const current = books.filter(b => /currently/i.test(`${b.ReviewStatus} ${b.ReadingProgress}`)).slice(0,4);
  el.innerHTML = (current.length ? current : books.slice(0,1)).map(b => bookCard(b)).join("");
}

function renderShelf() {
  const el = document.getElementById("shelfGrid");
  if (!el) return;
  const search = (document.getElementById("shelfSearch")?.value || "").toLowerCase();
  const sort = document.getElementById("sortSelect")?.value || "series";
  let filtered = books.filter(book => {
    const text = bookSearchText(book);
    const matchesFilter = activeFilter === "all" || text.includes(activeFilter.toLowerCase());
    const matchesSearch = !search || text.includes(search);
    return matchesFilter && matchesSearch;
  });
  filtered.sort((a,b) => {
    if (sort === "score") return (Number(b.MythShelfScore)||0) - (Number(a.MythShelfScore)||0);
    if (sort === "era") return String(a.ReadingEra||"").localeCompare(String(b.ReadingEra||""));
    if (sort === "title") return String(a.Title||"").localeCompare(String(b.Title||""));
    return String(a.Series||a.Title||"").localeCompare(String(b.Series||b.Title||""));
  });
  el.innerHTML = filtered.map(book => bookCard(book)).join("") || `<article class="panel"><h3>No books found</h3><p>Try another filter or search term.</p></article>`;
}

function renderEraCounts() {
  const map = {
    "First Pages": books.filter(b => b.ReadingEra === "First Pages").length,
    "Chosen Quests": books.filter(b => b.ReadingEra === "Chosen Quests").length,
    "Open Portals": books.filter(b => b.ReadingEra === "Open Portals").length
  };
  Object.entries(map).forEach(([k,v]) => document.querySelectorAll(`[data-era-count="${k}"]`).forEach(el => el.textContent = v || "—"));
}

async function submitToMythShelf(payload) {
  if (!MYTHSHELF_APP_URL) {
    console.warn("Add your Google Apps Script URL to MYTHSHELF_APP_URL in assets/script.js");
    return { ok: false, message: "Backend URL not configured yet." };
  }
  try {
    const res = await fetch(MYTHSHELF_APP_URL, { method: "POST", body: JSON.stringify(payload) });
    return await res.json();
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function wireForms() {
  const newsletter = document.getElementById("newsletterForm");
  if (newsletter) newsletter.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = document.getElementById("newsletterMessage");
    const result = await submitToMythShelf({ action:"newsletter", email:newsletter.email.value, name:newsletter.name.value, source:"MythShelf Dispatch" });
    msg.textContent = result.ok ? "You have joined The MythShelf Dispatch." : result.message;
    if (result.ok) newsletter.reset();
  });
  const suggest = document.getElementById("suggestForm");
  if (suggest) suggest.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = document.getElementById("suggestMessage");
    const result = await submitToMythShelf({ action:"suggest", bookTitle:suggest.bookTitle.value, author:suggest.author.value, series:suggest.series.value, genre:suggest.genre.value, why:suggest.why.value, suggestedBy:suggest.suggestedBy.value });
    msg.textContent = result.ok ? "The suggestion has entered the shelf." : result.message;
    if (result.ok) suggest.reset();
  });
  const vote = document.getElementById("voteForm");
  if (vote) vote.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = document.getElementById("voteMessage");
    const result = await submitToMythShelf({ action:"vote", bookTitle:vote.bookTitle.value, author:vote.author.value, voterName:vote.voterName.value, reason:vote.reason.value });
    msg.textContent = result.ok ? "Your vote has entered the Wish Shelf." : result.message;
    if (result.ok) vote.reset();
  });
}

async function initMythShelf() {
  try {
    await loadBooks();
    renderStats();
    renderTop10();
    renderCurrent();
    renderShelf();
    renderEraCounts();
  } catch (err) {
    console.error(err);
    document.querySelectorAll("[data-error]").forEach(el => el.textContent = "Could not load the MythShelf data.");
  }
  wireForms();
  document.getElementById("shelfSearch")?.addEventListener("input", renderShelf);
  document.getElementById("sortSelect")?.addEventListener("change", renderShelf);
  document.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderShelf();
  }));
}

initMythShelf();
