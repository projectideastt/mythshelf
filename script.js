let books = [];
let activeFilter = "all";

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
const tierBoard = document.getElementById("tierBoard");
const searchInput = document.getElementById("bookSearch");
const emptyState = document.getElementById("emptyState");
const loadError = document.getElementById("loadError");

const statBooks = document.getElementById("statBooks");
const statReviewed = document.getElementById("statReviewed");
const statTBR = document.getElementById("statTBR");

async function loadBooks() {
  try {
    const response = await fetch("books.csv", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("books.csv could not be loaded");
    }

    const text = await response.text();
    books = parseCSV(text);

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
    CoverURL: row.CoverURL || "",
    CoverStyle: row.CoverStyle || "red",
    Subgenre: row.Subgenre || "Fantasy",
    OverallRating: row.OverallRating || "0",
    Worldbuilding: row.Worldbuilding || "",
    Characters: row.Characters || "",
    MagicSystem: row.MagicSystem || "",
    Pacing: row.Pacing || "",
    EmotionalImpact: row.EmotionalImpact || "",
    Tier: row.Tier || "Unopened Portal",
    ReviewStatus: row.ReviewStatus || "TBR",
    Tags: row.Tags || "",
    ShortHook: row.ShortHook || "",
    ReviewLink: row.ReviewLink || ""
  };
}

function renderBooks() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  let visibleCount = 0;

  bookGrid.innerHTML = books.map(book => {
    const combined = [
      book.Title,
      book.Author,
      book.Subgenre,
      book.Tier,
      book.ReviewStatus,
      book.Tags,
      book.ShortHook
    ].join(" ").toLowerCase();

    const matchesFilter =
      activeFilter === "all" ||
      combined.includes(activeFilter.toLowerCase());

    const matchesSearch =
      !searchTerm || combined.includes(searchTerm);

    const isVisible = matchesFilter && matchesSearch;
    if (isVisible) visibleCount++;

    const hasCoverURL = String(book.CoverURL || "").trim().length > 0;
    const coverStyle = hasCoverURL
      ? `style="background-image:url('${escapeAttribute(book.CoverURL)}')"`
      : "";

    const reviewLink = String(book.ReviewLink || "").trim();

    return `
      <article class="book-card" style="display:${isVisible ? "block" : "none"}">
        <div class="book-cover ${hasCoverURL ? "has-image" : coverClass(book.CoverStyle)}" ${coverStyle}>
          <small>${escapeHTML(book.Subgenre || "Fantasy")}</small>
          <strong>${escapeHTML(book.Title)}</strong>
        </div>

        <div class="book-body">
          <h3>${escapeHTML(book.Title)}</h3>
          <p class="author">${escapeHTML(book.Author)}</p>

          <div class="tier-pill">${escapeHTML(book.Tier || "Unranked")}</div>

          <div class="tags">
            ${tagHTML(book.Tags)}
          </div>

          <div class="rating-line">
            <span>${starsFromRating(book.OverallRating)}</span>
            <span>${book.OverallRating && book.OverallRating !== "0" ? escapeHTML(book.OverallRating) : escapeHTML(book.ReviewStatus || "TBR")}</span>
          </div>

          ${scoreHTML(book)}

          <p class="review-note">${escapeHTML(book.ShortHook)}</p>

          ${
            reviewLink && reviewLink !== "#"
            ? `<a class="review-link" href="${escapeAttribute(reviewLink)}">Read review →</a>`
            : ``
          }
        </div>
      </article>
    `;
  }).join("");

  emptyState.style.display = visibleCount === 0 ? "block" : "none";
}

function renderTiers() {
  tierBoard.innerHTML = tierOrder.map(tier => {
    const tierBooks = books.filter(book => String(book.Tier || "").trim() === tier.name);

    return `
      <div class="tier-row">
        <div class="tier-label">
          <strong>${escapeHTML(tier.name)}</strong>
          <span>${escapeHTML(tier.note)}</span>
        </div>

        <div class="tier-books">
          ${
            tierBooks.length
            ? tierBooks.map(book => `
                <div class="mini-book ${miniClass(book.CoverStyle)}">
                  <strong>${escapeHTML(book.Title)}</strong>
                  <span>${escapeHTML(book.Author)}</span>
                </div>
              `).join("")
            : `<span style="color: var(--muted);">No books here yet.</span>`
          }
        </div>
      </div>
    `;
  }).join("");
}

function updateStats() {
  const reviewed = books.filter(book =>
    String(book.ReviewStatus || "").toLowerCase().includes("reviewed")
  ).length;

  const tbr = books.filter(book => {
    const status = String(book.ReviewStatus || "").toLowerCase();
    return status.includes("tbr") || status.includes("suggested") || status.includes("reading");
  }).length;

  statBooks.textContent = books.length;
  statReviewed.textContent = reviewed;
  statTBR.textContent = tbr;
}

function resetFilters() {
  activeFilter = "all";
  searchInput.value = "";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === "all");
  });

  renderBooks();
}

function starsFromRating(rating) {
  const value = parseFloat(rating || "0");
  if (!value) return "TBR";
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(0, 5 - rounded);
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

function scoreHTML(book) {
  const scores = [
    ["World", book.Worldbuilding],
    ["Characters", book.Characters],
    ["Magic", book.MagicSystem],
    ["Pacing", book.Pacing]
  ].filter(item => item[1] && item[1] !== "0");

  if (!scores.length) return "";

  return `
    <div class="score-grid">
      ${scores.map(item => `
        <div class="score-item">
          <strong>${escapeHTML(item[0])}</strong>
          ${escapeHTML(item[1])}/5
        </div>
      `).join("")}
    </div>
  `;
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
