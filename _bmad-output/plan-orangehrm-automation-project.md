---
title: 'OrangeHRM UI test automation project'
type: 'feature'
ticket: ''
created: '2026-11-07'
status: 'built'
baseline_revision: '78b37d86a08bf66a725d305e6ba28460c0338880'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent â€” do not modify unless human renegotiates">

## Intent

**Problem:** The repository holds only a placeholder `package.json` and BMad scaffolding; there is no automation framework for the OrangeHRM demo site (`https://opensource-demo.orangehrmlive.com`), so nothing can exercise its login or core HR flows repeatably.

**Approach:** Scaffold a Page Object Model test-automation project against the public demo instance with a config-driven base URL and credentials, page objects for the surfaces investigated below, a smoke suite covering authentication, PIM and Admin flows, and a documented single-command run.

**Decisions (human-approved):**
- Stack: **Playwright + TypeScript** (`@playwright/test`, Node â‰¥ 20, npm).
- Smoke scope: **Auth** (valid/invalid/required/logout) + **PIM** (add employee, search employee) + **Admin â†’ System Users** (search by username and by role, read-only).
- CI: **GitHub Actions** workflow on push/PR, Chromium only, 1 retry, report uploaded as artifact.
- Reporting: **Allure** via `allure-playwright` + the `allure` npm package (Allure Report 3 CLI, pure JS â€” no JDK required) alongside Playwright's `list` reporter.

## Boundaries & Constraints

**Always:** Page Object Model (one class per page/region, tests never hold raw selectors); base URL and credentials read from environment with the public demo defaults (`Admin` / `admin123`) as fallback; selectors prefer `name=` attributes, roles/labels and stable `oxd-*`/`orangehrm-*` class names observed on the live site; every test independent (fresh session per test, no ordering); explicit waits for the `.oxd-loading-spinner` / table to settle â€” no fixed sleeps; test data created by a test carries a unique suffix so reruns on the shared demo do not collide.

**Never:** No tests against modules not listed in the Code Map; no modification of existing demo admin data (change password, delete seeded employees, system settings); no secrets committed; no Java/.NET toolchain (not installed); no sprawling coverage of every module â€” this is the foundation plus a smoke suite.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid login | `Admin` / `admin123` on `/auth/login` | Redirect to `/dashboard/index`; breadcrumb `h6` reads "Dashboard"; side menu lists 12 modules | No error expected |
| Invalid password | `Admin` / `wrongpass` | Stays on `/auth/login`; `.oxd-alert--error` shows "Invalid credentials" | Assert alert text |
| Empty fields | both inputs blank, click Login | Two `.oxd-input-field-error-message` elements with text "Required"; no navigation | Assert both messages |
| Logout | logged in, open `.oxd-userdropdown-tab`, click "Logout" | Back on `/auth/login`; login form visible | No error expected |
| Add employee | PIM â†’ Add, unique first/last name, Save | Lands on employee personal-details page; header shows the name | Demo slowness: wait for navigation, not a timer |
| Search employee | PIM â†’ Employee List, type the created name, Search | `.oxd-table-card` row contains the name; records-found text â‰¥ 1 | Wait for table reload |
| Admin user search by username | Admin â†’ System Users, Username `Admin`, Search | Exactly one `.oxd-table-card`; cells show Username `Admin`, Role `Admin`, Status `Enabled` | Wait for table reload |
| Admin user search by role | Admin â†’ System Users, User Role `ESS`, Search | â‰¥ 1 row; every row's role cell reads `ESS`; records text "(N) Records Found" matches row count | Tolerate N varying on shared demo |
| Admin user search no match | Username `zz-no-such-user-<suffix>`, Search | `.oxd-toast` info "No Records Found" and/or "No Records Found" text in table area; zero rows | Assert empty state |
| Demo instance slow/unreachable | network timeout | Test fails with a clear timeout, retried once in CI | Playwright/pytest retry config |

</frozen-after-approval>

## Code Map

Repository (baseline `78b37d8`):
- `package.json` -- placeholder (`"type": "commonjs"`, no deps, `test` script errors). Replace scripts/deps; do not keep the placeholder test script.
- `.gitignore` -- has `node_modules/`, `_bmad/render/`. Extend with test artifacts (`test-results/`, `playwright-report/`, `.env`).
- `_bmad/`, `.agents/`, `.claude/` -- BMad tooling; never touch.

Target site (observed 2026-11-07, OrangeHRM OS 5.9):
- Login `/web/index.php/auth/login` -- `input[name="username"]`, `input[name="password"]`, `button[type="submit"]` ("Login"), `h5.orangehrm-login-title`, `.orangehrm-login-forgot`, demo creds in `.orangehrm-demo-credentials p`. Error banner `.oxd-alert.oxd-alert--error .oxd-alert-content-text`; field errors `.oxd-input-field-error-message`.
- Dashboard `/web/index.php/dashboard/index` -- breadcrumb `.oxd-topbar-header-breadcrumb h6`; widgets `.orangehrm-dashboard-widget-name` ("Time at Work", "My Actions", "Quick Launch"â€¦).
- Side menu -- `a.oxd-main-menu-item` with text Admin, PIM, Leave, Time, Recruitment, My Info, Performance, Dashboard, Directory, Maintenance, Claim, Buzz; search `.oxd-main-menu-search input`. Menu text is hidden at narrow widths â€” use desktop viewport â‰¥1280.
- Header user menu -- `.oxd-userdropdown-tab` opens `.oxd-dropdown-menu a` (About, Support, Change Password, Logout â†’ `/web/index.php/auth/logout`).
- PIM list `/web/index.php/pim/viewEmployeeList` -- header "PIM", `.orangehrm-header-container button` "Add", filter labels incl. "Employee Name" (autocomplete input inside `.oxd-autocomplete-text-input`), rows `.oxd-table-card`, loader `.oxd-loading-spinner`.
- PIM add `/web/index.php/pim/addEmployee` -- `input[name="firstName"]`, `input[name="middleName"]`, `input[name="lastName"]`, Employee Id auto-filled, `button[type="submit"]` "Save".
- Admin users `/web/index.php/admin/viewSystemUsers` -- header "Admin", filter title `h5` "System Users"; filters in `.oxd-table-filter` labelled Username (`.oxd-input`), User Role (`.oxd-select-text`, options Admin/ESS), Employee Name (autocomplete "Type for hints..."), Status (`.oxd-select-text`, Enabled/Disabled); buttons "Reset", `button[type="submit"]` "Search", "Add"; records text `.orangehrm-horizontal-padding .oxd-text` e.g. "(9) Records Found"; rows `.oxd-table-card` with `[role="cell"]` order: checkbox, Username, User Role, Employee Name, Status, Actions. Header cells `.oxd-table-header-cell` render only at desktop widths.
- Generic table/filter conventions -- `.oxd-loading-spinner` appears during reloads; `.oxd-toast` carries success/info toasts ("Successfully Saved", "No Records Found"); dropdowns open via `.oxd-select-text` then `.oxd-select-dropdown [role="option"]`.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- project metadata, deps `@playwright/test`, `typescript`, `@types/node`, `dotenv`, `allure-playwright`, `allure` (Report 3 CLI); scripts `test`, `test:headed`, `test:ui`, `test:debug`, `report` (`allure generate ./allure-results --clean` then `allure open ./allure-report`), `lint` (`tsc --noEmit`) -- single-command run
- [x] `tsconfig.json` -- strict TS, `@pages/*`, `@fixtures/*`, `@config/*` path aliases -- readable imports
- [x] `playwright.config.ts` -- `baseURL` from env, Chromium project at 1366Ã—768, `trace: 'retain-on-failure'`, screenshot/video on failure, reporters `list` + `allure-playwright` (output `allure-results`), `retries: process.env.CI ? 1 : 0`, `timeout: 60_000`, `expect.timeout: 15_000`, `fullyParallel` -- demo site is slow and shared
- [x] `.env.example` -- `BASE_URL`, `ORANGEHRM_USERNAME`, `ORANGEHRM_PASSWORD` with demo defaults documented -- no secrets committed
- [x] `src/config/env.ts` -- typed accessor loading `.env` via dotenv with the demo defaults -- one place for configuration
- [x] `src/pages/BasePage.ts` -- `goto(path)`, `waitForLoadingToFinish()` (spinner hidden), `breadcrumb` locator, `expectToast(text)` -- avoid duplication
- [x] `src/pages/LoginPage.ts` -- `login()`, `errorAlert`, `requiredMessages`, `forgotPasswordLink` -- Code Map selectors
- [x] `src/pages/components/SideMenu.ts`, `src/pages/components/UserDropdown.ts`, `src/pages/components/OxdSelect.ts` -- module navigation, logout, dropdown-option picker -- shell and widget interactions
- [x] `src/pages/DashboardPage.ts` -- widget names, composes SideMenu + UserDropdown -- landing assertions
- [x] `src/pages/pim/EmployeeListPage.ts`, `src/pages/pim/AddEmployeePage.ts`, `src/pages/pim/EmployeeDetailsPage.ts` -- add employee, search by name, read header name -- PIM flow
- [x] `src/pages/admin/SystemUsersPage.ts` -- `searchByUsername()`, `searchByRole()`, `reset()`, `rows`, `recordsFoundCount()`, `rowValues(i)` -- Admin flow
- [x] `src/fixtures/test.ts` -- extends `base` with `loginPage`, `loggedIn` (UI login â†’ DashboardPage), page-object fixtures; re-exports `expect` -- independence
- [x] `src/utils/testData.ts` -- `uniqueSuffix()`, `uniqueEmployeeName()` -- rerun safety on shared demo
- [x] `tests/auth/login.spec.ts` -- valid, invalid, required, logout -- I/O rows 1â€“4
- [x] `tests/pim/employee.spec.ts` -- add employee then search it -- I/O rows 5â€“6
- [x] `tests/admin/systemUsers.spec.ts` -- search by username, by role, no-match -- I/O rows 7â€“9
- [x] `.github/workflows/e2e.yml` -- on push/PR: checkout, Node 20 setup with npm cache, `npm ci`, `npx playwright install --with-deps chromium`, `npm test`, upload `allure-results` and `playwright-report`/`test-results` artifacts (`if: always()`) -- continuous signal
- [x] `README.md` -- prerequisites, install, env vars, run/report commands, project layout, POM conventions, CI note -- onboarding
- [x] `.gitignore` -- add `test-results/`, `playwright-report/`, `allure-results/`, `allure-report/`, `.env` -- hygiene

**Acceptance Criteria:**
- Given a fresh clone with Node â‰¥ 20, when the developer runs `npm install`, `npx playwright install chromium` and `npm test`, then all smoke tests pass against the live demo without editing any file.
- Given a test file under `tests/`, when inspected, then it contains no raw CSS/XPath selectors â€” only fixture/page-object calls and `expect` assertions.
- Given the suite runs twice in a row, when the second run executes, then the Add Employee test still passes (unique data, no collision).
- Given a failing test, when the run completes, then a trace and screenshot for that test exist under `test-results/` and `npm run report` generates and opens an Allure report listing every executed test.
- Given the repo, when searched for `admin123`, then it appears only in `.env.example`, `README.md` and `src/config/env.ts` defaults â€” never in tests or page objects.
- Given `npm run lint`, when executed, then `tsc --noEmit` reports zero errors.

## Implementation Notes

- 2026-11-07 — Implemented end to end; `npm run lint` clean, `npm test` 8/8 green on two consecutive runs, `allure generate` produces a report listing every result.
- Pinned `typescript` to `^5.9` (npm `latest` is the 7.x native port; kept the stable `tsc` for `baseUrl`/`paths` behaviour). Added an `@utils/*` alias alongside the planned ones.
- Added Playwright's `html` reporter (`open: 'never'`) next to `list` + `allure-playwright` so the CI artifact `playwright-report/` named in the plan is actually produced.
- Flake found and fixed during verification: `.oxd-loading-spinner` count can be 0 before the SPA mounts or before a reload starts, so spinner-only waits raced the initial table fetch. `BasePage.goto()` now waits for `#app` to render; table pages (`EmployeeListPage`, `SystemUsersPage`) wait for their `/api/v2/...` GET on load and after every Search/Reset (`gotoAndWaitForApi` / `performAndWaitForApi`).
- Flake found and fixed: concurrent Add Employee sessions on the shared demo receive the same auto-filled Employee Id, so the POST fails silently. `AddEmployeePage.addEmployee()` now accepts `employeeId` (test supplies `uniqueEmployeeId()`), awaits the POST and throws the server message on non-2xx.
- CI workflow also runs `npm run lint` before the suite and uses `concurrency` to cancel superseded runs.

## Plan Change Log

## Review Triage Log

**Pass 1 (quick lens, iteration 0)** — verdicts: high 0 · medium 1 · low 4 · false 0 · maybe-false 0 · rejected 1

| # | Finding | Verdict | Route | Evidence |
|---|---------|---------|-------|----------|
| 1 | `package.json` written with UTF-8 BOM and no trailing newline | low | patch | Confirmed `EF BB BF` prefix on disk; npm tolerates it but strict JSON consumers (`jq`, scanners) reject a BOM. Direct correction: rewrite without BOM, add newline. |
| 2 | `BasePage.gotoAndWaitForApi/performAndWaitForApi`, `AddEmployeePage.addEmployee`: `waitForResponse` promise created before the action and only awaited after — if the action throws, the orphaned promise rejects later as an unhandled rejection | low | patch | Code reads as described; on a click/navigation timeout the test already fails, the orphan adds a second confusing error. Direct correction: `Promise.all([wait, action()])`. |
| 3 | `EmployeeListPage.searchByName`: `fill()` triggers the autocomplete hint `GET /api/v2/pim/employees?nameOrId=…&includeEmployees=onlyCurrent` before the wait is armed; matcher `includes('/api/v2/pim/employees')` can be satisfied by the hint response instead of the table reload (`…/employees?limit=50&offset=0&model=detailed…`), so `recordsFoundCount()` may read the stale count | medium | patch | Verified on the live site: fill → 1 hint request, Search → 1 table request with `?limit=50&offset=0`. A stale-count false pass is a real correctness gap in the suite. Smallest fix: match the table request specifically (`/api/v2/pim/employees?limit=`). |
| 4 | `@types/node ^26` while `engines.node >=20` and CI runs Node 20 | low | patch | True; current code only uses `node:crypto`/`node:path` APIs present in 20, so no runtime break today, but typings should track the supported runtime. Direct correction: pin `@types/node` to `^20`. |
| 5 | `README.md` omits `uniqueEmployeeId()` and does not mention the `/api/v2` response waits the table pages rely on | low | patch | Confirmed against `src/utils/testData.ts` and `BasePage.ts`. Direct doc correction. |
| 6 | AC "`admin123` appears only in `.env.example`, `README.md`, `src/config/env.ts`" — the plan file in `_bmad-output/` also contains it | low | rejected | The AC's intent (never in tests or page objects) holds; the only fix would be editing this build's plan, which triage rules reject. |

Patches 1–5 applied directly (the sync implementer could not be re-engaged): BOM stripped / newline added / `@types/node` pinned `^20.19.0` in `package.json`; `Promise.all` in `BasePage.gotoAndWaitForApi`, `BasePage.performAndWaitForApi`, `AddEmployeePage.addEmployee`; `EmployeeListPage.EMPLOYEES_API` narrowed to `/api/v2/pim/employees?limit=`; README layout and conventions updated. Post-patch verification: `npm run lint` clean, `npm test` 8/8 on two consecutive runs.

## Design Notes

- Keep page objects thin: locators + intent-named actions (`login(user, pass)`, `addEmployee({first,last})`, `searchByName(name)`), assertions live in tests.
- The demo resets periodically and is shared; tests must tolerate unknown pre-existing data (search asserts "contains created name", never exact row counts).
- Fixture pattern (Playwright example):
  ```ts
  export const test = base.extend<{ loggedIn: DashboardPage }>({
    loggedIn: async ({ page }, use) => {
      await new LoginPage(page).goto().login(env.username, env.password);
      await use(new DashboardPage(page));
    },
  });
  ```

## Verification

**Commands:**
- `npm install` -- expected: completes without errors
- `npx playwright install chromium` -- expected: Chromium available
- `npm run lint` -- expected: `tsc --noEmit` exits 0
- `npm test` -- expected: all smoke tests pass against the live demo (auth 4, pim 1â€“2, admin 3)
- `npm test` (second consecutive run) -- expected: passes again, proving unique-data safety
- `npm run report` -- expected: `allure-report/` generated and opened, listing every executed test

**Manual checks (if no CLI):**
- `grep -r admin123 tests src/pages` returns nothing.
- `.github/workflows/e2e.yml` is valid YAML and references the same scripts as `package.json`.
