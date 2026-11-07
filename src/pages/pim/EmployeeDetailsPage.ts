import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/** `/pim/viewPersonalDetails/empNumber/:id` — shown right after an employee is saved. */
export class EmployeeDetailsPage extends BasePage {
  static readonly PATH_PATTERN = /\/pim\/viewPersonalDetails\/empNumber\/(\d+)/;

  readonly nameHeader: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;

  constructor(page: Page) {
    super(page);
    this.nameHeader = page.locator('.orangehrm-edit-employee-name h6');
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
  }

  async headerName(): Promise<string> {
    return (await this.nameHeader.innerText()).trim();
  }

  employeeNumber(): number | null {
    const match = EmployeeDetailsPage.PATH_PATTERN.exec(this.page.url());
    return match ? Number(match[1]) : null;
  }
}
