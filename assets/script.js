
const MYTHSHELF_BOOKS_CSV_URL = "https://docs.google.com/spreadsheets/d/1kd9gestpjoV03IBcvCoEbTo93Ybknr-mm7wiQKLl8DI/export?format=csv&gid=0";
const LOCAL_BOOKS_CSV_URL = "books.csv";
const USE_GOOGLE_SHEET = true;
const MYTHSHELF_APP_URL = "https://script.google.com/macros/s/AKfycbx9A-7XQnXYmffFZso8-eFXh8NqgxiLjqU1TPWwr3Zoh5HqXJTBhGr31hyCe4ASGidc/exec";
const TOP_VOTES_URL = MYTHSHELF_APP_URL + "?action=top_votes&limit=10";

let books = [];
let activeFilter = "all";

function csvSource() {
  return USE_GOOGLE_SHEET ? MYTHSHELF_BOOKS_CSV_URL : LOCAL_BOOKS_CSV_URL;
}

async function loadBooks() {
  const source = csvSource();
  const sep = source.includes("?") ? "&" : "?";
  const response = await fetch(source + sep + "cacheBust=" + Date.now(), { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load books CSV");
  const text = await response.text();
  books = parseCSV(text).filter(book => book.Title);
  return books;
}

function parseCSV(text) {
  const rows = text.split(/\r?\n/).filter(row => row.trim());
  if (!rows.length) return [];
  const headers = splitCSV(rows[0]).map(header => header.trim());
  return rows.slice(1).map(line => {
    const values = splitCSV(line);
    const obj = {};
    headers.forEach((header, index) => obj[header] = values[index] ? values[index].trim() : "");
    return obj;
  });
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
  const value = String(style || "").toLowerCase();
  if (value.includes("green")) return "green";
  if (value.includes("mixed")) return "mixed";
  if (value.includes("dark")) return "dark";
  if (value.includes("blue")) return "blue";
  return "red";
}

function esc(value) {
  return String(value || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function bookSearchText(book) {
  return Object.values(book).join(" ").toLowerCase();
}

function bookCard(book, options = {}) {
  const coverURL = getCoverURL(book);
  const background = coverURL ? `style="background-image:url('${esc(coverURL)}')"` : "";
  const rank = options.rank || book.TopPickRank || "";
  const score = book.MythShelfScore && book.MythShelfScore !== "0" ? `MythShelf ${esc(book.MythShelfScore)}/5` : esc(book.ReviewStatus || "TBR");
  const era = book.ReadingEra || "Shelf";

  return `
    <article class="book-card ${options.carousel ? "carousel-card" : ""}">
      <div class="cover ${coverURL ? "" : coverClass(book.CoverStyle)}" ${background}>
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
    </article>
  `;
}

function renderHeroCovers() {
  const slots = [
    { id: "heroTopPick", find: b => /^yes$/i.test(b.TopPick || "") && String(b.TopPickRank || "") === "1" },
    { id: "heroChosenQuest", find: b => b.Title && /stormlight|way of kings/i.test(`${b.Series} ${b.Title}`) },
    { id: "heroOpenPortal", find: b => /currently reading/i.test(`${b.ReviewStatus} ${b.ReadingProgress}`) }
  ];

  slots.forEach(slot => {
    const el = document.getElementById(slot.id);
    if (!el) return;
    const book = books.find(slot.find) || books[0];
    if (!book) return;
    const cover = getCoverURL(book);
    if (cover) el.style.backgroundImage = `url('${cover}')`;
    const titleEl = el.querySelector("strong");
    if (titleEl) titleEl.textContent = book.Title;
  });
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
  const track = document.getElementById("top10Track");
  if (!track) return;
  let top = books
    .filter(b => /^yes$/i.test(b.TopPick || "") || b.TopPickRank)
    .sort((a,b) => (Number(a.TopPickRank) || 99) - (Number(b.TopPickRank) || 99))
    .slice(0,10);

  if (!top.length) {
    top = books.filter(b => Number(b.MythShelfScore) >= 5).slice(0,10);
  }

  track.innerHTML = [...top, ...top]
    .map((book, index) => bookCard(book, { carousel: true, rank: book.TopPickRank || ((index % top.length) + 1) }))
    .join("");
}

function renderCurrent() {
  const grid = document.getElementById("currentGrid");
  if (!grid) return;
  const current = books.filter(b => /currently/i.test(`${b.ReviewStatus} ${b.ReadingProgress}`)).slice(0,4);
  grid.innerHTML = (current.length ? current : books.slice(0,1)).map(book => bookCard(book)).join("");
}

function renderShelf() {
  const grid = document.getElementById("shelfGrid");
  if (!grid) return;

  const search = (document.getElementById("shelfSearch")?.value || "").toLowerCase();
  const sort = document.getElementById("sortSelect")?.value || "series";

  let filtered = books.filter(book => {
    const text = bookSearchText(book);
    const matchesFilter = activeFilter === "all" || text.includes(activeFilter.toLowerCase());
    const matchesSearch = !search || text.includes(search);
    return matchesFilter && matchesSearch;
  });

  filtered.sort((a,b) => {
    if (sort === "score") return (Number(b.MythShelfScore) || 0) - (Number(a.MythShelfScore) || 0);
    if (sort === "era") return String(a.ReadingEra || "").localeCompare(String(b.ReadingEra || ""));
    if (sort === "title") return String(a.Title || "").localeCompare(String(b.Title || ""));
    return String(a.Series || a.Title || "").localeCompare(String(b.Series || b.Title || ""));
  });

  grid.innerHTML = filtered.map(book => bookCard(book)).join("") || `<article class="panel"><h3>No books found</h3><p>Try another filter or search term.</p></article>`;
}

function renderEraCounts() {
  const counts = {
    "First Pages": books.filter(b => b.ReadingEra === "First Pages").length,
    "Chosen Quests": books.filter(b => b.ReadingEra === "Chosen Quests").length,
    "Open Portals": books.filter(b => b.ReadingEra === "Open Portals").length
  };
  Object.entries(counts).forEach(([key, value]) => {
    document.querySelectorAll(`[data-era-count="${key}"]`).forEach(el => el.textContent = value || "—");
  });
}

async function submitToMythShelf(payload) {
  try {
    const response = await fetch(MYTHSHELF_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    return { ok: false, message: "The shelf could not be reached. Please try again." };
  }
}

function wireForms() {
  const newsletter = document.getElementById("newsletterForm");
  if (newsletter) {
    newsletter.addEventListener("submit", async event => {
      event.preventDefault();
      const message = document.getElementById("newsletterMessage");
      message.textContent = "Joining the Dispatch...";
      const result = await submitToMythShelf({
        action: "newsletter",
        email: newsletter.email.value,
        name: newsletter.name.value,
        source: "MythShelf Dispatch"
      });
      message.textContent = result.ok ? "You have joined The MythShelf Dispatch." : result.message;
      if (result.ok) newsletter.reset();
    });
  }

  const suggest = document.getElementById("suggestForm");
  if (suggest) {
    suggest.addEventListener("submit", async event => {
      event.preventDefault();
      const message = document.getElementById("suggestMessage");
      message.textContent = "Sending suggestion...";
      const result = await submitToMythShelf({
        action: "suggest",
        bookTitle: suggest.bookTitle.value,
        author: suggest.author.value,
        series: suggest.series.value,
        genre: suggest.genre.value,
        why: suggest.why.value,
        suggestedBy: suggest.suggestedBy.value
      });
      message.textContent = result.ok ? "The suggestion has entered the shelf." : result.message;
      if (result.ok) suggest.reset();
    });
  }

  const vote = document.getElementById("voteForm");
  if (vote) {
    vote.addEventListener("submit", async event => {
      event.preventDefault();
      const message = document.getElementById("voteMessage");
      message.textContent = "Casting vote...";
      const result = await submitToMythShelf({
        action: "vote",
        bookTitle: vote.bookTitle.value,
        author: vote.author.value,
        voterName: vote.voterName.value,
        reason: vote.reason.value
      });
      message.textContent = result.ok ? "Your vote has entered the Wish Shelf." : result.message;
      if (result.ok) vote.reset();
    });
  }
}

async function initMythShelf() {
  try {
    await loadBooks();
    renderHeroCovers();
    renderStats();
    renderTop10();
    renderCurrent();
    await loadTopVotedQuests();
    renderShelf();
    renderEraCounts();
  } catch (error) {
    console.error(error);
    document.querySelectorAll("[data-error]").forEach(el => el.textContent = "The shelf is temporarily unavailable.");
  }

  wireForms();

  document.getElementById("shelfSearch")?.addEventListener("input", renderShelf);
  document.getElementById("sortSelect")?.addEventListener("change", renderShelf);

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      renderShelf();
    });
  });
}

initMythShelf();
