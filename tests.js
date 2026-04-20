/**
 * LibraSearch — Validation Test Cases
 * tests.js
 *
 * Run in browser console OR Node.js (copy Validator/SearchEngine modules above)
 * Tests cover: ISBN, Year, Book Form, Search Validation, Search Engine
 */

"use strict";

// ============================================================
// MINI TEST RUNNER
// ============================================================
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     → ${e.message}`);
    failed++;
  }
}
function assert(condition, msg = "Assertion failed") {
  if (!condition) throw new Error(msg);
}
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected "${b}" but got "${a}"`);
}
function group(label, fn) {
  console.group(`\n📦 ${label}`);
  fn();
  console.groupEnd();
}

// ============================================================
// SECTION 1 — ISBN-13 VALIDATION
// ============================================================
group("ISBN-13 Validation", () => {

  // Re-define for standalone testing
  function isValidISBN13(isbn) {
    const digits = isbn.replace(/[\s-]/g, "");
    if (!/^\d{13}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
    return sum % 10 === 0;
  }

  test("Valid ISBN-13: 9780061743528", () =>
    assert(isValidISBN13("9780061743528")));

  test("Valid ISBN-13: 9780451524935", () =>
    assert(isValidISBN13("9780451524935")));

  test("Valid ISBN-13 with dashes: 978-0-06-174352-8", () =>
    assert(isValidISBN13("978-0-06-174352-8")));

  test("Reject ISBN shorter than 13 digits", () =>
    assert(!isValidISBN13("978006174352")));

  test("Reject ISBN longer than 13 digits", () =>
    assert(!isValidISBN13("97800617435281")));

  test("Reject all zeros: 0000000000000", () =>
    assert(!isValidISBN13("0000000000000")));

  test("Reject alphanumeric: 978A06174352X", () =>
    assert(!isValidISBN13("978A06174352X")));

  test("Reject empty string", () =>
    assert(!isValidISBN13("")));

  test("Reject invalid checksum: 9780061743529", () =>
    assert(!isValidISBN13("9780061743529")));
});

// ============================================================
// SECTION 2 — YEAR VALIDATION
// ============================================================
group("Year Validation", () => {

  function isValidYear(year) {
    const y = parseInt(year, 10);
    return !isNaN(y) && y >= 1000 && y <= new Date().getFullYear();
  }

  test("Valid year: 1960", ()    => assert(isValidYear(1960)));
  test("Valid year: 2025", ()    => assert(isValidYear(2025)));
  test("Valid year: 1000", ()    => assert(isValidYear(1000)));
  test("Reject year: 999",  ()   => assert(!isValidYear(999)));
  test("Reject year: 2099", ()   => assert(!isValidYear(2099)));
  test("Reject year: 0",    ()   => assert(!isValidYear(0)));
  test("Reject year: -500", ()   => assert(!isValidYear(-500)));
  test("Reject year: 'abc'", ()  => assert(!isValidYear("abc")));
  test("Reject year: ''",   ()   => assert(!isValidYear("")));
});

// ============================================================
// SECTION 3 — FIELD REQUIRED / LENGTH VALIDATION
// ============================================================
group("Required & Length Checks", () => {

  function required(val) {
    return val !== null && val !== undefined && String(val).trim() !== "";
  }
  function minLength(val, min) { return String(val).trim().length >= min; }
  function maxLength(val, max) { return String(val).trim().length <= max; }

  test("Required: non-empty string passes",       () => assert(required("Hello")));
  test("Required: whitespace-only fails",         () => assert(!required("   ")));
  test("Required: empty string fails",            () => assert(!required("")));
  test("Required: null fails",                    () => assert(!required(null)));
  test("Required: undefined fails",               () => assert(!required(undefined)));

  test("MinLength: 'Hi' >= 2 chars passes",       () => assert(minLength("Hi", 2)));
  test("MinLength: 'H' >= 2 chars fails",         () => assert(!minLength("H", 2)));
  test("MaxLength: 5-char string under 10 passes",() => assert(maxLength("Hello", 10)));
  test("MaxLength: 11-char string under 10 fails",() => assert(!maxLength("Hello World", 10)));
});

// ============================================================
// SECTION 4 — FULL BOOK FORM VALIDATION
// (Simulates Validator.validateBook without BookStore dependency)
// ============================================================
group("Full Book Form Validation", () => {

  function isValidISBN13(isbn) {
    const d = isbn.replace(/[\s-]/g,"");
    if (!/^\d{13}$/.test(d)) return false;
    let s=0; for(let i=0;i<13;i++) s+=parseInt(d[i])*(i%2===0?1:3);
    return s%10===0;
  }
  function isValidYear(y) { const n=parseInt(y,10); return !isNaN(n)&&n>=1000&&n<=2025; }

  function validateBook(data) {
    const errors = {};
    if (!data.title?.trim())             errors.title  = "required";
    else if (data.title.trim().length<2) errors.title  = "too short";
    if (!data.author?.trim())            errors.author = "required";
    if (!data.isbn?.trim())              errors.isbn   = "required";
    else if (!isValidISBN13(data.isbn))  errors.isbn   = "invalid";
    if (!data.genre)                     errors.genre  = "required";
    if (!data.year)                      errors.year   = "required";
    else if (!isValidYear(data.year))    errors.year   = "invalid";
    if (!data.status)                    errors.status = "required";
    return { valid: Object.keys(errors).length === 0, errors };
  }

  const goodBook = {
    title: "Clean Code", author: "Robert C. Martin",
    isbn: "9780132350884", genre: "Technology",
    year: 2008, status: "available"
  };

  test("Valid book data passes validation", () => {
    const r = validateBook(goodBook);
    assert(r.valid, JSON.stringify(r.errors));
  });

  test("Missing title fails", () => {
    const r = validateBook({ ...goodBook, title: "" });
    assert(!r.valid && r.errors.title);
  });

  test("Single-char title fails (too short)", () => {
    const r = validateBook({ ...goodBook, title: "X" });
    assert(!r.valid && r.errors.title === "too short");
  });

  test("Missing author fails", () => {
    const r = validateBook({ ...goodBook, author: "" });
    assert(!r.valid && r.errors.author);
  });

  test("Invalid ISBN fails", () => {
    const r = validateBook({ ...goodBook, isbn: "1234567890123" });
    assert(!r.valid && r.errors.isbn === "invalid");
  });

  test("Missing genre fails", () => {
    const r = validateBook({ ...goodBook, genre: "" });
    assert(!r.valid && r.errors.genre);
  });

  test("Future year 2099 fails", () => {
    const r = validateBook({ ...goodBook, year: 2099 });
    assert(!r.valid && r.errors.year);
  });

  test("Missing status fails", () => {
    const r = validateBook({ ...goodBook, status: "" });
    assert(!r.valid && r.errors.status);
  });

  test("Multiple missing fields — all errors reported", () => {
    const r = validateBook({ title:"", author:"", isbn:"", genre:"", year:"", status:"" });
    assert(!r.valid);
    assert(Object.keys(r.errors).length >= 5);
  });
});

// ============================================================
// SECTION 5 — SEARCH VALIDATION
// ============================================================
group("Search Query Validation", () => {

  function validateSearch(query) {
    if (!query || !query.trim()) return { valid: false, error: "Empty query." };
    if (query.trim().length > 100) return { valid: false, error: "Too long." };
    return { valid: true };
  }

  test("Valid search: 'Orwell' passes",          () => assert(validateSearch("Orwell").valid));
  test("Valid search: '1984' passes",             () => assert(validateSearch("1984").valid));
  test("Empty search fails",                      () => assert(!validateSearch("").valid));
  test("Whitespace-only fails",                   () => assert(!validateSearch("   ").valid));
  test("101-char query fails",                    () => assert(!validateSearch("x".repeat(101)).valid));
  test("100-char query passes",                   () => assert(validateSearch("x".repeat(100)).valid));
});

// ============================================================
// SECTION 6 — SEARCH ENGINE
// ============================================================
group("Search Engine", () => {

  const books = [
    { id:1, title:"To Kill a Mockingbird", author:"Harper Lee",    genre:"Fiction",   year:1960, isbn:"9780061743528", status:"available" },
    { id:2, title:"1984",                   author:"George Orwell", genre:"Science Fiction", year:1949, isbn:"9780451524935", status:"borrowed"  },
    { id:3, title:"The Hobbit",             author:"J.R.R. Tolkien",genre:"Fantasy",   year:1937, isbn:"9780547928227", status:"reserved"  },
    { id:4, title:"Sapiens",                author:"Yuval Harari",  genre:"History",   year:2011, isbn:"9780062316097", status:"available" },
  ];

  function search(books, query, field="all") {
    if (!query?.trim()) return books;
    const q=query.trim().toLowerCase();
    return books.filter(b=> {
      if(field==="title")  return b.title.toLowerCase().includes(q);
      if(field==="author") return b.author.toLowerCase().includes(q);
      if(field==="genre")  return b.genre.toLowerCase().includes(q);
      if(field==="isbn")   return b.isbn.includes(q);
      return b.title.toLowerCase().includes(q)||b.author.toLowerCase().includes(q)||
             b.genre.toLowerCase().includes(q)||b.isbn.includes(q)||String(b.year).includes(q);
    });
  }

  function sortBooks(books, field, order) {
    return [...books].sort((a,b)=>{
      let va=a[field],vb=b[field];
      if(typeof va==="string"){va=va.toLowerCase();vb=vb.toLowerCase();}
      if(va<vb) return order==="asc"?-1:1;
      if(va>vb) return order==="asc"?1:-1;
      return 0;
    });
  }

  test("Search 'orwell' in all fields returns 1 result", () => {
    const r = search(books,"orwell"); assertEqual(r.length,1);
  });
  test("Search 'fiction' by genre returns 2 results (Fiction + Science Fiction)", () => {
    const r = search(books,"fiction","genre"); assertEqual(r.length,2);
  });
  test("Empty query returns all books", () => {
    const r = search(books,""); assertEqual(r.length,4);
  });
  test("Search by ISBN returns correct book", () => {
    const r = search(books,"9780451524935","isbn");
    assertEqual(r.length,1); assertEqual(r[0].title,"1984");
  });
  test("Search case-insensitive: 'TOLKIEN'", () => {
    const r = search(books,"TOLKIEN","author"); assertEqual(r.length,1);
  });
  test("Search by year '1960' in all fields", () => {
    const r = search(books,"1960"); assertEqual(r.length,1);
  });
  test("Non-matching search returns 0 results", () => {
    const r = search(books,"zzznomatch"); assertEqual(r.length,0);
  });
  test("Sort by title ascending: first item is '1984'", () => {
    const r = sortBooks(books,"title","asc");
    assertEqual(r[0].title,"1984");
  });
  test("Sort by title descending: first item is 'To Kill a Mockingbird'", () => {
    const r = sortBooks(books,"title","desc");
    assertEqual(r[0].title,"To Kill a Mockingbird");
  });
  test("Sort by year ascending: first item is 1937", () => {
    const r = sortBooks(books,"year","asc");
    assertEqual(r[0].year,1937);
  });
  test("Sort by year descending: first item is 2011", () => {
    const r = sortBooks(books,"year","desc");
    assertEqual(r[0].year,2011);
  });
});

// ============================================================
// SUMMARY
// ============================================================
console.log(`\n${"=".repeat(50)}`);
console.log(`📊 TEST SUMMARY: ${passed} passed, ${failed} failed out of ${passed+failed} total`);
if (failed === 0) console.log("🎉 All tests passed!");
else console.warn(`⚠️  ${failed} test(s) failed. Review above.`);