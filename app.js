/**
 * LibraSearch — Library Book Search System
 * app.js  —  All application logic (modular, no frameworks)
 */

"use strict";

/* ============================================================
   MODULE 1: DATA STORE
   ============================================================ */
const BookStore = (() => {
  const STORAGE_KEY = "librasearch_books";

  // Default seed data
  const SEED = [
    { id: 1, title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Fiction", year: 1960, isbn: "9780061743528", pages: 281, publisher: "HarperCollins", status: "available", description: "A story of racial injustice and the loss of innocence." },
    { id: 2, title: "1984",                   author: "George Orwell",  genre: "Science Fiction", year: 1949, isbn: "9780451524935", pages: 328, publisher: "Signet Classic", status: "borrowed",   description: "Dystopian novel about surveillance and totalitarianism." },
    { id: 3, title: "The Great Gatsby",        author: "F. Scott Fitzgerald", genre: "Fiction",    year: 1925, isbn: "9780743273565", pages: 180, publisher: "Scribner",       status: "available", description: "A tale of wealth, idealism and the American Dream." },
    { id: 4, title: "A Brief History of Time", author: "Stephen Hawking",     genre: "Science",   year: 1988, isbn: "9780553380163", pages: 212, publisher: "Bantam Books",    status: "available", description: "A landmark volume in science writing." },
    { id: 5, title: "The Hobbit",              author: "J.R.R. Tolkien",      genre: "Fantasy",   year: 1937, isbn: "9780547928227", pages: 310, publisher: "Houghton Mifflin",status: "reserved",  description: "The prelude to The Lord of the Rings." },
    { id: 6, title: "Sapiens",                 author: "Yuval Noah Harari",   genre: "History",   year: 2011, isbn: "9780062316097", pages: 443, publisher: "Harper",          status: "borrowed",  description: "A brief history of humankind." },
    { id: 7, title: "The Alchemist",           author: "Paulo Coelho",        genre: "Fiction",   year: 1988, isbn: "9780062315007", pages: 208, publisher: "HarperOne",       status: "available", description: "A novel about following one's dreams." },
    { id: 8, title: "Clean Code",              author: "Robert C. Martin",    genre: "Technology",year: 2008, isbn: "9780132350884", pages: 431, publisher: "Prentice Hall",   status: "available", description: "A handbook of agile software craftsmanship." },
  ];

  let books = [];
  let nextId = 9;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        books = parsed.books || SEED;
        nextId = parsed.nextId || books.length + 1;
      } else {
        books = [...SEED];
        nextId = 9;
        save();
      }
    } catch { books = [...SEED]; nextId = 9; }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ books, nextId })); } catch {}
  }

  function getAll() { return [...books]; }

  function add(bookData) {
    const book = { id: nextId++, ...bookData };
    books.push(book);
    save();
    return book;
  }

  function update(id, data) {
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return null;
    books[idx] = { ...books[idx], ...data };
    save();
    return books[idx];
  }

  function remove(id) {
    const len = books.length;
    books = books.filter(b => b.id !== id);
    if (books.length < len) { save(); return true; }
    return false;
  }

  function isbnExists(isbn, excludeId = null) {
    return books.some(b => b.isbn === isbn && b.id !== excludeId);
  }

  return { load, getAll, add, update, remove, isbnExists };
})();


/* ============================================================
   MODULE 2: VALIDATION
   ============================================================ */
const Validator = (() => {

  function required(val) {
    return val !== null && val !== undefined && String(val).trim() !== "";
  }

  function minLength(val, min) {
    return String(val).trim().length >= min;
  }

  function maxLength(val, max) {
    return String(val).trim().length <= max;
  }

  function isValidISBN13(isbn) {
    const digits = isbn.replace(/[\s-]/g, "");
    if (!/^\d{13}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return sum % 10 === 0;
  }

  function isValidYear(year) {
    const y = parseInt(year, 10);
    return !isNaN(y) && y >= 1000 && y <= new Date().getFullYear();
  }

  function isValidPages(pages) {
    if (!pages && pages !== 0) return true; // optional
    const p = parseInt(pages, 10);
    return !isNaN(p) && p >= 1 && p <= 9999;
  }

  // Validate full book form  →  returns { valid: bool, errors: {} }
  function validateBook(data, excludeId = null) {
    const errors = {};

    if (!required(data.title))              errors.title    = "Title is required.";
    else if (!minLength(data.title, 2))     errors.title    = "Title must be at least 2 characters.";
    else if (!maxLength(data.title, 150))   errors.title    = "Title must be under 150 characters.";

    if (!required(data.author))             errors.author   = "Author is required.";
    else if (!minLength(data.author, 2))    errors.author   = "Author must be at least 2 characters.";
    else if (!maxLength(data.author, 100))  errors.author   = "Author must be under 100 characters.";

    if (!required(data.isbn))               errors.isbn     = "ISBN is required.";
    else if (!isValidISBN13(data.isbn))     errors.isbn     = "Must be a valid 13-digit ISBN.";
    else if (BookStore.isbnExists(data.isbn, excludeId)) errors.isbn = "This ISBN already exists in the catalog.";

    if (!required(data.genre))              errors.genre    = "Please select a genre.";

    if (!required(data.year))               errors.year     = "Publication year is required.";
    else if (!isValidYear(data.year))       errors.year     = `Year must be between 1000 and ${new Date().getFullYear()}.`;

    if (data.pages && !isValidPages(data.pages)) errors.pages = "Pages must be between 1 and 9999.";

    if (!required(data.status))             errors.status   = "Please select availability status.";

    return { valid: Object.keys(errors).length === 0, errors };
  }

  // Validate search query
  function validateSearch(query) {
    if (!required(query)) return { valid: false, error: "Please enter a search term." };
    if (!minLength(query, 1)) return { valid: false, error: "Search query too short." };
    if (!maxLength(query, 100)) return { valid: false, error: "Search query too long (max 100 chars)." };
    return { valid: true };
  }

  return { validateBook, validateSearch, isValidISBN13, isValidYear };
})();


/* ============================================================
   MODULE 3: SEARCH & SORT ENGINE
   ============================================================ */
const SearchEngine = (() => {

  function search(books, query, field = "all") {
    if (!query || !query.trim()) return books;
    const q = query.trim().toLowerCase();
    return books.filter(book => {
      if (field === "title")  return book.title.toLowerCase().includes(q);
      if (field === "author") return book.author.toLowerCase().includes(q);
      if (field === "genre")  return book.genre.toLowerCase().includes(q);
      if (field === "isbn")   return book.isbn.includes(q);
      // all fields
      return (
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.genre.toLowerCase().includes(q) ||
        book.isbn.includes(q) ||
        String(book.year).includes(q) ||
        (book.publisher || "").toLowerCase().includes(q)
      );
    });
  }

  function sort(books, field = "title", order = "asc") {
    return [...books].sort((a, b) => {
      let va = a[field], vb = b[field];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return order === "asc" ? -1 : 1;
      if (va > vb) return order === "asc" ?  1 : -1;
      return 0;
    });
  }

  function highlight(text, query) {
    if (!query || !query.trim()) return escapeHtml(text);
    const esc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${esc})`, "gi");
    return escapeHtml(text).replace(re, "<mark>$1</mark>");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return { search, sort, highlight, escapeHtml };
})();


/* ============================================================
   MODULE 4: RENDER / UI
   ============================================================ */
const UI = (() => {

  function statusBadge(status) {
    return `<span class="status-badge status-${status}">${status}</span>`;
  }

  function buildRow(book, query) {
    const hl = t => SearchEngine.highlight(t, query);
    return `
      <tr data-id="${book.id}">
        <td>${book.id}</td>
        <td><strong>${hl(book.title)}</strong></td>
        <td>${hl(book.author)}</td>
        <td>${hl(book.genre)}</td>
        <td>${hl(String(book.year))}</td>
        <td><code>${hl(book.isbn)}</code></td>
        <td>${statusBadge(book.status)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" data-id="${book.id}">✏ Edit</button>
            <button class="btn-delete" data-id="${book.id}">🗑 Del</button>
          </div>
        </td>
      </tr>`;
  }

  function renderTable(books, tbodyId, query = "") {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = books.map(b => buildRow(b, query)).join("");
  }

  function showNoResults(show) {
    const el = document.getElementById("noResults");
    if (el) el.classList.toggle("hidden", !show);
    const tbl = document.getElementById("bookTable");
    if (tbl) tbl.style.display = show ? "none" : "";
  }

  function setResultCount(n) {
    const el = document.getElementById("resultCount");
    if (el) el.textContent = `${n} book${n !== 1 ? "s" : ""}`;
  }

  function setSearchStatus(msg) {
    const el = document.getElementById("searchStatus");
    if (el) el.textContent = msg;
  }

  function showFormMessage(msg, type) {
    const el = document.getElementById("formMessage");
    if (!el) return;
    el.textContent = msg;
    el.className = `form-message ${type}`;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 4000);
  }

  function showToast(msg, type = "info") {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = `toast ${type}`;
    t.classList.remove("hidden");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add("hidden"), 3500);
  }

  function setFieldError(inputId, errorId, msg) {
    const inp = document.getElementById(inputId);
    const err = document.getElementById(errorId);
    if (inp) inp.classList.toggle("invalid", !!msg);
    if (inp) inp.classList.toggle("valid", !msg && inp.value !== "");
    if (err) err.textContent = msg || "";
  }

  function clearFormErrors(prefix = "") {
    const fields = ["Title","Author","ISBN","Genre","Year","Pages","Status"];
    fields.forEach(f => {
      const lo = f.toLowerCase();
      setFieldError(`${prefix}book${f}`, `${prefix}${lo}Error`, "");
      const el = document.getElementById(`${prefix}book${f}`);
      if (el) { el.classList.remove("invalid","valid"); }
    });
  }

  function updateStats(books) {
    const cnt = k => books.filter(b => b.status === k).length;
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set("statTotal",    books.length);
    set("statAvail",    cnt("available"));
    set("statBorrow",   cnt("borrowed"));
    set("statReserved", cnt("reserved"));
  }

  return { renderTable, showNoResults, setResultCount, setSearchStatus,
           showFormMessage, showToast, setFieldError, clearFormErrors, updateStats };
})();


/* ============================================================
   MODULE 5: EXPORT
   ============================================================ */
const Exporter = (() => {
  function toCSV(books) {
    const headers = ["ID","Title","Author","Genre","Year","ISBN","Pages","Publisher","Status"];
    const rows = books.map(b =>
      [b.id, `"${b.title}"`, `"${b.author}"`, b.genre, b.year, b.isbn,
       b.pages||"", `"${b.publisher||""}"`, b.status].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  function download(books) {
    const csv = toCSV(books);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "librasearch_catalog.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }
  return { download };
})();


/* ============================================================
   MODULE 6: APP CONTROLLER
   ============================================================ */
const App = (() => {

  let currentQuery   = "";
  let currentField   = "all";
  let currentSort    = "title";
  let currentOrder   = "asc";
  let currentResults = [];

  // ---- Init ----
  function init() {
    BookStore.load();
    bindTabs();
    bindSearch();
    bindAddForm();
    bindEditModal();
    bindTableActions();
    bindExport();
    refreshSearch();
    refreshCatalog();
  }

  // ---- Tab Navigation ----
  function bindTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(`tab-${tab}`).classList.add("active");
        if (tab === "catalog") refreshCatalog();
      });
    });
  }

  // ---- Search ----
  function bindSearch() {
    document.getElementById("searchBtn").addEventListener("click", runSearch);
    document.getElementById("clearBtn").addEventListener("click", clearSearch);
    document.getElementById("searchQuery").addEventListener("keydown", e => {
      if (e.key === "Enter") runSearch();
    });
    document.getElementById("sortField").addEventListener("change", () => refreshSearch());
    document.getElementById("sortOrder").addEventListener("change", () => refreshSearch());
    document.getElementById("searchField").addEventListener("change", () => {
      if (currentQuery) refreshSearch();
    });
  }

  function runSearch() {
    const query = document.getElementById("searchQuery").value;
    const errEl = document.getElementById("searchError");
    const result = Validator.validateSearch(query);
    if (!result.valid) {
      if (errEl) errEl.textContent = result.error;
      document.getElementById("searchQuery").classList.add("invalid");
      return;
    }
    if (errEl) errEl.textContent = "";
    document.getElementById("searchQuery").classList.remove("invalid");
    currentQuery = query;
    currentField = document.getElementById("searchField").value;
    refreshSearch();
  }

  function clearSearch() {
    document.getElementById("searchQuery").value = "";
    document.getElementById("searchError").textContent = "";
    document.getElementById("searchQuery").classList.remove("invalid");
    currentQuery = "";
    currentField = "all";
    refreshSearch();
    UI.setSearchStatus("");
  }

  function refreshSearch() {
    currentSort  = document.getElementById("sortField").value;
    currentOrder = document.getElementById("sortOrder").value;
    let books = BookStore.getAll();
    books = SearchEngine.search(books, currentQuery, currentField);
    books = SearchEngine.sort(books, currentSort, currentOrder);
    currentResults = books;
    UI.renderTable(books, "bookTableBody", currentQuery);
    UI.setResultCount(books.length);
    UI.showNoResults(books.length === 0);
    if (currentQuery) {
      UI.setSearchStatus(`Showing ${books.length} result(s) for "${currentQuery}" in [${currentField}] — sorted by ${currentSort} (${currentOrder})`);
    } else {
      UI.setSearchStatus(`Showing all ${books.length} book(s) — sorted by ${currentSort} (${currentOrder})`);
    }
  }

  // ---- Add Book Form ----
  function bindAddForm() {
    const form = document.getElementById("bookForm");

    // Live char counter for description
    document.getElementById("bookDescription").addEventListener("input", function() {
      document.getElementById("descCount").textContent = `${this.value.length} / 500`;
    });

    // Live validation on blur
    ["bookTitle","bookAuthor","bookISBN","bookGenre","bookYear","bookPages","bookStatus"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("blur", () => validateField(id));
    });

    form.addEventListener("submit", handleAddBook);
    document.getElementById("resetFormBtn").addEventListener("click", () => {
      UI.clearFormErrors();
      document.getElementById("formMessage").classList.add("hidden");
    });
  }

  function validateField(id) {
    const val = document.getElementById(id)?.value;
    const errorMap = {
      bookTitle:  ["titleError",  v => !v.trim() ? "Title is required." : v.trim().length < 2 ? "Min 2 chars." : ""],
      bookAuthor: ["authorError", v => !v.trim() ? "Author is required." : v.trim().length < 2 ? "Min 2 chars." : ""],
      bookISBN:   ["isbnError",   v => !v.trim() ? "ISBN is required." : !Validator.isValidISBN13(v) ? "Invalid 13-digit ISBN." : ""],
      bookGenre:  ["genreError",  v => !v ? "Select a genre." : ""],
      bookYear:   ["yearError",   v => !v ? "Year required." : !Validator.isValidYear(v) ? `Year between 1000–${new Date().getFullYear()}.` : ""],
      bookStatus: ["statusError", v => !v ? "Select a status." : ""],
    };
    if (!errorMap[id]) return;
    const [errId, rule] = errorMap[id];
    const msg = rule(val || "");
    UI.setFieldError(id, errId, msg);
  }

  function handleAddBook(e) {
    e.preventDefault();
    const data = getFormData("book");
    const { valid, errors } = Validator.validateBook(data);

    // Show field errors
    const fieldMap = { title:"bookTitle/titleError", author:"bookAuthor/authorError",
                       isbn:"bookISBN/isbnError", genre:"bookGenre/genreError",
                       year:"bookYear/yearError",  pages:"bookPages/pagesError",
                       status:"bookStatus/statusError" };
    Object.entries(fieldMap).forEach(([key, pair]) => {
      const [iId, eId] = pair.split("/");
      UI.setFieldError(iId, eId, errors[key] || "");
    });

    if (!valid) {
      UI.showFormMessage("Please fix the errors above.", "error");
      return;
    }

    BookStore.add(data);
    document.getElementById("bookForm").reset();
    document.getElementById("descCount").textContent = "0 / 500";
    UI.clearFormErrors();
    UI.showFormMessage(`✅ "${data.title}" added successfully!`, "success");
    UI.showToast(`Book "${data.title}" added!`, "success");
    refreshSearch();
    refreshCatalog();
  }

  function getFormData(prefix = "book") {
    const g = id => (document.getElementById(`${prefix}${id}`)?.value || "").trim();
    return {
      title:       g("Title"),
      author:      g("Author"),
      isbn:        g("ISBN").replace(/[\s-]/g,""),
      genre:       g("Genre"),
      year:        parseInt(g("Year"), 10) || "",
      pages:       parseInt(g("Pages"), 10) || "",
      publisher:   g("Publisher"),
      status:      g("Status"),
      description: (document.getElementById(`${prefix}Description`)?.value || "").trim(),
    };
  }

  // ---- Edit Modal ----
  function bindEditModal() {
    document.getElementById("editForm").addEventListener("submit", handleSaveEdit);
    document.getElementById("closeModal").addEventListener("click", closeModal);
    document.getElementById("cancelEdit").addEventListener("click", closeModal);
    document.getElementById("editModal").addEventListener("click", e => {
      if (e.target === document.getElementById("editModal")) closeModal();
    });
  }

  function openEditModal(id) {
    const books = BookStore.getAll();
    const book = books.find(b => b.id === id);
    if (!book) return;
    document.getElementById("editId").value    = book.id;
    document.getElementById("editTitle").value  = book.title;
    document.getElementById("editAuthor").value = book.author;
    document.getElementById("editISBN").value   = book.isbn;
    document.getElementById("editGenre").value  = book.genre;
    document.getElementById("editYear").value   = book.year;
    document.getElementById("editStatus").value = book.status;
    // clear errors
    ["editTitle","editAuthor","editISBN","editGenre","editYear"].forEach(id => {
      document.getElementById(id).classList.remove("invalid","valid");
    });
    ["editTitleError","editAuthorError","editIsbnError","editGenreError","editYearError"].forEach(id => {
      const el = document.getElementById(id); if (el) el.textContent = "";
    });
    document.getElementById("editModal").classList.remove("hidden");
  }

  function closeModal() {
    document.getElementById("editModal").classList.add("hidden");
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    const id  = parseInt(document.getElementById("editId").value, 10);
    const data = {
      title:  document.getElementById("editTitle").value.trim(),
      author: document.getElementById("editAuthor").value.trim(),
      isbn:   document.getElementById("editISBN").value.trim(),
      genre:  document.getElementById("editGenre").value,
      year:   parseInt(document.getElementById("editYear").value, 10),
      status: document.getElementById("editStatus").value,
    };

    const { valid, errors } = Validator.validateBook(data, id);
    UI.setFieldError("editTitle",  "editTitleError",  errors.title  || "");
    UI.setFieldError("editAuthor", "editAuthorError", errors.author || "");
    UI.setFieldError("editISBN",   "editIsbnError",   errors.isbn   || "");
    UI.setFieldError("editGenre",  "editGenreError",  errors.genre  || "");
    UI.setFieldError("editYear",   "editYearError",   errors.year   || "");

    if (!valid) return;

    BookStore.update(id, data);
    closeModal();
    UI.showToast(`"${data.title}" updated!`, "success");
    refreshSearch();
    refreshCatalog();
  }

  // ---- Table Action Delegation ----
  function bindTableActions() {
    document.addEventListener("click", e => {
      const editBtn   = e.target.closest(".btn-edit");
      const deleteBtn = e.target.closest(".btn-delete");
      if (editBtn)   openEditModal(parseInt(editBtn.dataset.id, 10));
      if (deleteBtn) confirmDelete(parseInt(deleteBtn.dataset.id, 10));
    });
    // Column header sort (search table)
    document.querySelectorAll("#bookTable th[data-sort]").forEach(th => {
      th.addEventListener("click", () => {
        const f = th.dataset.sort;
        if (f === "id") return;
        if (currentSort === f) {
          currentOrder = currentOrder === "asc" ? "desc" : "asc";
          document.getElementById("sortOrder").value = currentOrder;
        } else {
          currentSort = f;
          document.getElementById("sortField").value = f;
          currentOrder = "asc";
          document.getElementById("sortOrder").value = "asc";
        }
        refreshSearch();
      });
    });
  }

  function confirmDelete(id) {
    const books = BookStore.getAll();
    const book  = books.find(b => b.id === id);
    if (!book) return;
    if (!confirm(`Delete "${book.title}" by ${book.author}?\nThis cannot be undone.`)) return;
    BookStore.remove(id);
    UI.showToast(`"${book.title}" removed.`, "error");
    refreshSearch();
    refreshCatalog();
  }

  // ---- Catalog ----
  function refreshCatalog() {
    const books = SearchEngine.sort(BookStore.getAll(), "title", "asc");
    UI.renderTable(books, "catalogTableBody", "");
    UI.updateStats(books);
  }

  // ---- Export ----
  function bindExport() {
    document.getElementById("exportBtn").addEventListener("click", () => {
      Exporter.download(currentResults.length ? currentResults : BookStore.getAll());
      UI.showToast("CSV exported!", "info");
    });
  }

  return { init };
})();

// ---- Bootstrap ----
document.addEventListener("DOMContentLoaded", App.init);