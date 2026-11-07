import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { OxdSelect } from '../components/OxdSelect';

export type UserRole = 'Admin' | 'ESS';
export type UserStatus = 'Enabled' | 'Disabled';

export interface SystemUserRow {
  username: string;
  role: string;
  employeeName: string;
  status: string;
}

/** Column order observed on the live site: checkbox, Username, User Role, Employee Name, Status, Actions. */
const CELL = { username: 1, role: 2, employeeName: 3, status: 4 } as const;

export class SystemUsersPage extends BasePage {
  static readonly PATH = '/web/index.php/admin/viewSystemUsers';

  readonly header: Locator;
  readonly filterTitle: Locator;
  readonly filter: Locator;
  readonly usernameInput: Locator;
  readonly roleSelect: OxdSelect;
  readonly statusSelect: OxdSelect;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly addButton: Locator;
  readonly recordsFoundText: Locator;
  readonly rows: Locator;
  readonly noRecordsText: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.locator('.oxd-topbar-header-breadcrumb h6', { hasText: 'Admin' });
    this.filterTitle = page.locator('.oxd-table-filter h5', { hasText: 'System Users' });
    this.filter = page.locator('.oxd-table-filter');
    this.usernameInput = this.filter
      .locator('.oxd-input-group')
      .filter({ has: page.locator('label', { hasText: 'Username' }) })
      .locator('input.oxd-input');
    this.roleSelect = new OxdSelect(page, 'User Role');
    this.statusSelect = new OxdSelect(page, 'Status');
    this.searchButton = this.filter.locator('button[type="submit"]');
    this.resetButton = this.filter.locator('button', { hasText: 'Reset' });
    this.addButton = page.locator('.orangehrm-header-container button', { hasText: 'Add' });
    this.recordsFoundText = page.locator('.orangehrm-horizontal-padding .oxd-text');
    this.rows = page.locator('.oxd-table-card');
    this.noRecordsText = page.locator('.orangehrm-horizontal-padding .oxd-text', { hasText: 'No Records Found' });
  }

  override async goto(path: string = SystemUsersPage.PATH): Promise<this> {
    return this.gotoAndWaitForApi(path, SystemUsersPage.USERS_API);
  }

  /** API endpoint backing the users table; awaited after every filter change. */
  private static readonly USERS_API = '/api/v2/admin/users';

  async search(): Promise<void> {
    await this.performAndWaitForApi(SystemUsersPage.USERS_API, () => this.searchButton.click());
  }

  async searchByUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.search();
  }

  async searchByRole(role: UserRole): Promise<void> {
    await this.roleSelect.select(role);
    await this.search();
  }

  async reset(): Promise<void> {
    await this.performAndWaitForApi(SystemUsersPage.USERS_API, () => this.resetButton.click());
  }

  /** Parses "(N) Records Found" / "(N) Record Found"; returns 0 for "No Records Found". */
  async recordsFoundCount(): Promise<number> {
    const text = (await this.recordsFoundText.first().innerText()).trim();
    const match = /\((\d+)\)/.exec(text);
    return match ? Number(match[1]) : 0;
  }

  async rowValues(index: number): Promise<SystemUserRow> {
    const cells = this.rows.nth(index).locator('[role="cell"]');
    const texts = await cells.allInnerTexts();
    const cell = (i: number): string => (texts[i] ?? '').trim();
    return {
      username: cell(CELL.username),
      role: cell(CELL.role),
      employeeName: cell(CELL.employeeName),
      status: cell(CELL.status),
    };
  }

  async allRowValues(): Promise<SystemUserRow[]> {
    const count = await this.rows.count();
    const values: SystemUserRow[] = [];
    for (let i = 0; i < count; i += 1) {
      values.push(await this.rowValues(i));
    }
    return values;
  }
}
