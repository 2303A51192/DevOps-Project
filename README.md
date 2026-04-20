# 📚 LibraSearch — Library Book Search System

A modular, browser-based library management system with full CI/CD via GitHub Actions.

## Project Structure

```
librasearch/
├── .github/
│   └── workflows/
│       └── build.yml        ← CI/CD pipeline
├── backend/
│   ├── app.js               ← Core modules (BookStore, Validator, SearchEngine, UI, App)
│   ├── tests.js             ← Original test suite (browser console)
│   ├── run-tests.js         ← Node.js-compatible test runner (used by CI)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── index.html       ← App entry point
│   │   └── styles.css       ← Dark-theme UI styles
│   ├── build.js             ← Build script (copies src → dist)
│   └── package.json
├── package.json
└── README.md
```

## CI/CD Pipeline (GitHub Actions)

The `build` workflow runs on every push and pull request to `main`/`master`:

| Step | Description |
|------|-------------|
| Checkout Code | Clones the repository |
| Show repository structure | Prints the file tree |
| Setup Node | Installs Node.js v20 |
| Install Backend Dependencies | `npm install` in `/backend` |
| **Run Backend Tests** | Runs all 53 validation tests |
| Install Frontend Dependencies | `npm install` in `/frontend` |
| **Build React App** | Copies `src/` → `dist/` |
| Verify build output | Confirms dist files exist |

## Test Coverage (53 tests)

- ✅ ISBN-13 checksum validation (9 tests)
- ✅ Publication year validation (9 tests)
- ✅ Required / min / max length checks (9 tests)
- ✅ Full book form validation (9 tests)
- ✅ Search query validation (6 tests)
- ✅ Search engine + sorting (11 tests)

## Running Locally

```bash
# Run tests
cd backend
npm test

# Build frontend
cd frontend
npm run build
# Output → frontend/dist/
```

## Setup GitHub Actions

1. Push this project to a GitHub repository
2. The workflow file at `.github/workflows/build.yml` will trigger automatically
3. Go to **Actions** tab in your repo to see the pipeline run
