# OrangeHRM UI Test Automation

Playwright + TypeScript smoke suite for the public [OrangeHRM open-source demo](https://opensource-demo.orangehrmlive.com), built on the Page Object Model. It covers authentication, PIM (add/search employee) and Admin → System Users (read-only searches), and ships with Allure reporting and a GitHub Actions workflow.

## Prerequisites

- Node.js **≥ 20** and npm
- Network access to the OrangeHRM demo (or your own instance — see [Configuration](#configuration))
- No Java/.NET required: Allure Report 3 CLI is pure JavaScript.

## Install

```bash
npm install
npx playwright install chromium
```

## Configuration

Copy `.env.example` to `.env` and adjust if needed. Every variable is optional; the demo defaults apply when unset.

| Variable             | Default                                      | Purpose                     |
| -------------------- | -------------------------------------------- | --------------------------- |
| `BASE_URL`           | `https://opensource-demo.orangehrmlive.com`  | Root of the OrangeHRM site  |
| `ORANGEHRM_USERNAME` | `Admin`                                      | Login user                  |
| `ORANGEHRM_PASSWORD` | `admin123`                                   | Login password              |

Configuration is read in exactly one place: `src/config/env.ts`. Tests and page objects never embed credentials.

## Run

| Command               | What it does                                                    |
| --------------------- | --------------------------------------------------------------- |
| `npm test`            | Runs the full smoke suite headlessly in Chromium                |
| `npm run test:headed` | Same, with a visible browser                                    |
| `npm run test:ui`     | Opens Playwright's interactive UI mode                          |
| `npm run test:debug`  | Runs with the Playwright Inspector attached                     |
| `npm run report`      | Generates `allure-report/` from `allure-results/` and opens it  |
| `npm run lint`        | Type-checks the project (`tsc --noEmit`)                        |

Run a subset with the usual Playwright filters, e.g. `npx playwright test tests/auth`.

On failure Playwright keeps a trace, screenshot and video under `test-results/`; open a trace with `npx playwright show-trace <path-to-trace.zip>`. A static HTML report is also written to `playwright-report/`.

## Project layout

```
playwright.config.ts         Chromium @ 1366×768, retries in CI, list + html + allure reporters
tsconfig.json                strict TS with @pages/*, @fixtures/*, @config/*, @utils/* aliases
src/
  config/env.ts              typed env accessor (dotenv + demo defaults)
  fixtures/test.ts           Playwright fixtures: loginPage, loggedIn, page-object fixtures; re-exports expect
  utils/testData.ts          uniqueSuffix(), uniqueEmployeeName(), uniqueEmployeeId()
  pages/
    BasePage.ts              goto(), waitForLoadingToFinish(), breadcrumb, expectToast()
    LoginPage.ts
    DashboardPage.ts         composes SideMenu + UserDropdown
    components/              SideMenu, UserDropdown, OxdSelect (custom dropdown)
    pim/                     EmployeeListPage, AddEmployeePage, EmployeeDetailsPage
    admin/                   SystemUsersPage
tests/
  auth/login.spec.ts         valid / invalid / required / logout
  pim/employee.spec.ts       add employee → search employee
  admin/systemUsers.spec.ts  search by username / by role / no match
.github/workflows/e2e.yml    CI: lint + smoke suite on push/PR, artifacts uploaded
```

## Page Object conventions

- One class per page or reusable region; page objects own **all** locators. Test files contain only fixture/page-object calls and `expect` assertions — never raw CSS/XPath.
- Selectors prefer `name=` attributes, roles/labels and the stable `oxd-*` / `orangehrm-*` class names used by the OrangeHRM UI.
- Actions are intent-named (`login()`, `addEmployee()`, `searchByUsername()`) and return the page object you land on. Assertions live in tests.
- No fixed sleeps: `BasePage.waitForLoadingToFinish()` waits for `.oxd-loading-spinner` to disappear; navigations use `waitForURL`. Table pages (`EmployeeListPage`, `SystemUsersPage`) additionally await the backing `/api/v2` response after load and after every Search/Reset, and `AddEmployeePage` awaits the save `POST`, so reads never race the fetch that populates them.
- Every test gets a fresh browser context and logs in through the UI via the `loggedIn` fixture, so tests are independent and order-free.
- Data created by tests carries a random suffix (`src/utils/testData.ts`) so reruns on the shared demo never collide; the Add Employee test also supplies its own `uniqueEmployeeId()` because the auto-filled id is shared by everyone using the demo at that moment. Tests never modify seeded demo data.

## Continuous integration

`.github/workflows/e2e.yml` runs on every push and pull request: Node 20 with npm cache, `npm ci`, `npm run lint`, Chromium install, `npm test` (1 retry in CI), then uploads `allure-results` plus `playwright-report`/`test-results` as artifacts even when tests fail. Download the `allure-results` artifact and run `npx allure generate ./allure-results --clean && npx allure open ./allure-report` locally to browse the report.

## Notes on the demo instance

The demo is public, shared and periodically reset. Tests therefore tolerate pre-existing data (search assertions check that the created row is present rather than exact counts) and use generous timeouts (`timeout: 60s`, `expect.timeout: 15s`). Transient slowness may still cause a failure; CI retries once.
