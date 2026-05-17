let books = [];
let activeFilter = "all";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1kd9gestpjoV03IBcvCoEbTo93Ybknr-mm7wiQKLl8DI/export?format=csv&gid=0";
const LOCAL_CSV_URL = "books.csv";
const USE_GOOGLE_SHEET = true;

const tierOrder = [
  { name: "Legendary Shelf", note: "Unforgettable / personal favourite" },
  { name: "Crown Worthy", note: "Excellent and strongly recommended" },
  { name: "Worthy Quest", note: "Good, enjoyable, worth reading" },
  { name: "Mixed Magic", note: "Interesting but uneven" },
  { name: "Not My Realm", note: "Not for me, but may work for others" },
  { name: "Abandoned Quest", note: "Did not finish" },
  { name: "Unopened Portal", note: "To be read" }
];

const bookGrid = document.getElementById("bookGrid");
const currentGrid = document.getElementById("currentGrid");
const tierBoard = document.getElementById("tierBoard");
const searchInput = document.getElementById("bookSearch");
const emptyState = document.getElementById("emptyState");
const currentEmpty = document.getElementById("currentEmpty");
const loadError = document.getElementById("loadError");

const statBooks = document.getElementById("statBooks");
const statReviewed = document.getElementById("statReviewed");
const statCurrent = document.getElementById("statCurrent");
const statPaused = document.getElementById("statPaused");

async function loadBooks() {
  try {
    const csvSource = USE_GOOGLE_SHEET ? GOOGLE_SHEET_CSV_URL : LOCAL_CSV_URL;
    const separator = csvSource.includes("?") ? "&" : "?";
    const response = await fetch(csvSource + separator + "cacheBust=" + Date.now(), { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Shelf could not be loaded");
    }

    const text = await response.text();
    books = parseCSV(text);

    renderCurrentReads();
    renderBooks();
    renderTiers();
    updateStats();
  } catch (error) {
    console.error(error);
    loadError.style.display = "block";
  }
}

function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) return rows;

  const headers = splitCSVLine(lines[0]).map(h => h.trim());

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : "";
    });

    if (row.Title) rows.push(normalizeBookRow(row));
  }

  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function normalizeBookRow(row) {
  return {
    Title: row.Title || "",
    Author: row.Author || "",
    ISBN: cleanISBN(row.ISBN || ""),
    CoverURL: row.CoverURL || "",
    CoverStyle: row.CoverStyle || "red",
    Series: row.Series || "",
    Subgenre: row.Subgenre || "Fantasy",
    PublicRating: row.PublicRating || "",
    MythShelfScore: row.MythShelfScore || "0",
    Tier: row.Tier || "Unopened Portal",
    ReviewStatus: row.ReviewStatus || "TBR",
    ReadingFormat: row.ReadingFormat || "",
    ReadingProgress: row.ReadingProgress || "",
    Tags: row.Tags || "",
    ShortHook: row.ShortHook || "",
    ReviewLink: row.ReviewLink || ""
  };
}

function cleanISBN(value) {
  return String(value || "").replace(/[^0-9Xx]/g, "");
}

function getCoverURL(book) {
  const manualCover = String(book.CoverURL || "").trim();

  if (manualCover) {
    return manualCover;
  }

  if (book.ISBN) {
    return "https://covers.openlibrary.org/b/isbn/" + encodeURIComponent(book.ISBN) + "-L.jpg";
  }

  return "";
}

function renderCurrentReads() {
  const currentReads = books.filter(book =>
    String(book.ReviewStatus || "").toLowerCase().includes("currently reading")
  );

  currentGrid.innerHTML = currentReads.map(book => bookCardHTML(book, true)).join("");
  currentEmpty.style.display = currentReads.length ? "none" : "block";
}

function renderBooks() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  let visibleCount = 0;

  bookGrid.innerHTML = books.map(book => {
    const combined = searchableText(book);

    const matchesFilter =
      activeFilter === "all" ||
      combined.includes(activeFilter.toLowerCase());

    const matchesSearch =
      !searchTerm || combined.includes(searchTerm);

    const isVisible = matchesFilter && matchesSearch;
    if (isVisible) visibleCount++;

    return bookCardHTML(book, false, isVisible);
  }).join("");

  emptyState.style.display = visibleCount === 0 ? "block" : "none";
}

function bookCardHTML(book, featured = false, isVisible = true) {
  const coverURL = getCoverURL(book);
  const hasCoverURL = coverURL.length > 0;
  const coverStyle = hasCoverURL
    ? `style="background-image:url('${escapeAttribute(coverURL)}')"`
    : "";

  const reviewLink = String(book.ReviewLink || "").trim();
  const linkHTML = reviewLink && reviewLink !== "#"
    ? `<a class="review-link" href="${escapeAttribute(reviewLink)}">Read review →</a>`
    : "";

  const seriesHTML = book.Series
    ? `<p class="author">${escapeHTML(book.Author)} · ${escapeHTML(book.Series)}</p>`
    : `<p class="author">${escapeHTML(book.Author)}</p>`;

  return `
    <article class="book-card ${featured ? "featured-card" : ""}" style="display:${isVisible ? "block" : "none"}">
      <div class="book-cover ${hasCoverURL ? "has-image" : coverClass(book.CoverStyle)}" ${coverStyle}>
        <small>${escapeHTML(book.Subgenre || "Fantasy")}</small>
        <strong>${escapeHTML(book.Title)}</strong>
      </div>

      <div class="book-body">
        <h3>${escapeHTML(book.Title)}</h3>
        ${seriesHTML}

        <div class="tier-pill">${escapeHTML(book.Tier || "Unranked")}</div>

        ${formatHTML(book)}

        ${ratingHTML(book)}

        <div class="tags">
          ${tagHTML(book.Tags)}
        </div>

        <p class="review-note">${escapeHTML(book.ShortHook)}</p>

        ${linkHTML}
      </div>
    </article>
  `;
}

function ratingHTML(book) {
  const items = [];

  if (book.PublicRating) {
    items.push(`<span class="rating-pill public">Reader rating: ${escapeHTML(book.PublicRating)}</span>`);
  }

  if (book.MythShelfScore && book.MythShelfScore !== "0") {
    items.push(`<span class="rating-pill personal">MythShelf: ${escapeHTML(book.MythShelfScore)}/5</span>`);
  }

  if (!items.length) return "";

  return `<div class="rating-row">${items.join("")}</div>`;
}

function formatHTML(book) {
  const items = [];

  if (book.ReviewStatus) items.push(book.ReviewStatus);
  if (book.ReadingFormat) items.push(book.ReadingFormat);
  if (book.ReadingProgress) items.push(book.ReadingProgress);

  if (!items.length) return "";

  return `
    <div class="format-row">
      ${items.map(item => `<span class="format-pill">${escapeHTML(item)}</span>`).join("")}
    </div>
  `;
}

function searchableText(book) {
  return [
    book.Title,
    book.Author,
    book.ISBN,
    book.Series,
    book.Subgenre,
    book.PublicRating,
    book.MythShelfScore,
    book.Tier,
    book.ReviewStatus,
    book.ReadingFormat,
    book.ReadingProgress,
    book.Tags,
    book.ShortHook
  ].join(" ").toLowerCase();
}

function renderTiers() {
  tierBoard.innerHTML = tierOrder.map(tier => {
    const tierBooks = books.filter(book => String(book.Tier || "").trim() === tier.name);
    const booksHTML = tierBooks.length
      ? tierBooks.map(book => `
          <div class="mini-book ${miniClass(book.CoverStyle)}">
            <strong>${escapeHTML(book.Title)}</strong>
            <span>${escapeHTML(book.Author)}</span>
          </div>
        `).join("")
      : `<span style="color: var(--muted);">No books here yet.</span>`;

    return `
      <div class="tier-row">
        <div class="tier-label">
          <strong>${escapeHTML(tier.name)}</strong>
          <span>${escapeHTML(tier.note)}</span>
        </div>

        <div class="tier-books">
          ${booksHTML}
        </div>
      </div>
    `;
  }).join("");
}

function updateStats() {
  const reviewed = books.filter(book => {
    const status = String(book.ReviewStatus || "").toLowerCase();
    return status.includes("reviewed") || status.includes("finished");
  }).length;

  const current = books.filter(book =>
    String(book.ReviewStatus || "").toLowerCase().includes("currently reading")
  ).length;

  const paused = books.filter(book => {
    const status = String(book.ReviewStatus || "").toLowerCase();
    return status.includes("paused") || status.includes("stopped") || status.includes("dnf");
  }).length;

  statBooks.textContent = books.length;
  statReviewed.textContent = reviewed;
  statCurrent.textContent = current;
  statPaused.textContent = paused;
}

function resetFilters() {
  activeFilter = "all";
  searchInput.value = "";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === "all");
  });

  renderBooks();
}

function coverClass(style) {
  const value = String(style || "").toLowerCase().trim();
  if (value === "green") return "cover-green";
  if (value === "mixed") return "cover-mixed";
  if (value === "dark") return "cover-dark";
  return "cover-red";
}

function miniClass(style) {
  const value = String(style || "").toLowerCase().trim();
  if (value === "green") return "green-mini";
  if (value === "mixed" || value === "dark") return "mixed-mini";
  return "";
}

function tagHTML(tags) {
  return String(tags || "")
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map(tag => `<span class="tag">${escapeHTML(tag)}</span>`)
    .join("");
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderBooks();
  });
});

searchInput.addEventListener("input", renderBooks);
document.getElementById("resetBtn").addEventListener("click", resetFilters);

document.getElementById("suggestForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const message = document.getElementById("formMessage");
  message.style.display = "block";

  setTimeout(() => {
    message.style.display = "none";
  }, 5000);

  this.reset();
});

loadBooks();
