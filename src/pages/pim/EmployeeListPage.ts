import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { AddEmployeePage } from './AddEmployeePage';

export class EmployeeListPage extends BasePage {
  static readonly PATH = '/web/index.php/pim/viewEmployeeList';
  /**
   * API request backing the employee table; awaited after load and every filter change. The `?limit=`
   * suffix excludes the autocomplete hint request (`/employees?nameOrId=…`) that typing a name fires.
   */
  private static readonly EMPLOYEES_API = '/api/v2/pim/employees?limit=';

  readonly header: Locator;
  readonly addButton: Locator;
  readonly employeeNameInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly recordsFoundText: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.locator('.oxd-topbar-header-breadcrumb h6', { hasText: 'PIM' });
    this.addButton = page.locator('.orangehrm-header-container button', { hasText: 'Add' });
    this.employeeNameInput = page
      .locator('.oxd-input-group')
      .filter({ has: page.locator('label', { hasText: 'Employee Name' }) })
      .locator('.oxd-autocomplete-text-input input');
    this.searchButton = page.locator('.oxd-table-filter button[type="submit"]');
    this.resetButton = page.locator('.oxd-table-filter button', { hasText: 'Reset' });
    this.recordsFoundText = page.locator('.orangehrm-horizontal-padding .oxd-text');
    this.rows = page.locator('.oxd-table-card');
  }

  override async goto(path: string = EmployeeListPage.PATH): Promise<this> {
    return this.gotoAndWaitForApi(path, EmployeeListPage.EMPLOYEES_API);
  }

  async clickAdd(): Promise<AddEmployeePage> {
    await this.addButton.click();
    await this.page.waitForURL(`**${AddEmployeePage.PATH}`);
    const addPage = new AddEmployeePage(this.page);
    await addPage.waitForLoadingToFinish();
    return addPage;
  }

  /** Types a free-text name (no autocomplete pick) and submits the filter, then waits for the table to reload. */
  async searchByName(name: string): Promise<void> {
    await this.employeeNameInput.fill(name);
    await this.performAndWaitForApi(EmployeeListPage.EMPLOYEES_API, () => this.searchButton.click());
  }

  rowContaining(text: string): Locator {
    return this.rows.filter({ hasText: text });
  }

  /** Parses "(N) Records Found" / "(N) Record Found"; returns 0 for "No Records Found". */
  async recordsFoundCount(): Promise<number> {
    const text = (await this.recordsFoundText.first().innerText()).trim();
    const match = /\((\d+)\)/.exec(text);
    return match ? Number(match[1]) : 0;
  }
}
