import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { EmployeeDetailsPage } from './EmployeeDetailsPage';

export interface NewEmployee {
  firstName: string;
  lastName: string;
  middleName?: string;
  /** Overrides the auto-filled Employee Id when provided. */
  employeeId?: string;
}

export class AddEmployeePage extends BasePage {
  static readonly PATH = '/web/index.php/pim/addEmployee';
  private static readonly EMPLOYEES_API = '/api/v2/pim/employees';

  readonly firstNameInput: Locator;
  readonly middleNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly employeeIdInput: Locator;
  readonly saveButton: Locator;
  readonly fieldErrors: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.middleNameInput = page.locator('input[name="middleName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.employeeIdInput = page
      .locator('.oxd-input-group')
      .filter({ has: page.locator('label', { hasText: 'Employee Id' }) })
      .locator('input');
    this.saveButton = page.locator('button[type="submit"]');
    this.fieldErrors = page.locator('.oxd-input-field-error-message');
  }

  override async goto(path: string = AddEmployeePage.PATH): Promise<this> {
    await super.goto(path);
    return this;
  }

  async fill(employee: NewEmployee): Promise<void> {
    await this.firstNameInput.fill(employee.firstName);
    if (employee.middleName !== undefined) {
      await this.middleNameInput.fill(employee.middleName);
    }
    await this.lastNameInput.fill(employee.lastName);
    if (employee.employeeId !== undefined) {
      // The field is auto-populated asynchronously; wait for that before overwriting it.
      await expect(this.employeeIdInput).not.toHaveValue('');
      await this.employeeIdInput.fill(employee.employeeId);
    }
  }

  /**
   * Fills the form, saves, and waits for navigation to the new employee's personal-details page.
   * Fails fast with the server's message if the POST is rejected (e.g. duplicate Employee Id).
   */
  async addEmployee(employee: NewEmployee): Promise<EmployeeDetailsPage> {
    await this.fill(employee);
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (res) => res.request().method() === 'POST' && res.url().includes(AddEmployeePage.EMPLOYEES_API),
      ),
      this.saveButton.click(),
    ]);
    if (!response.ok()) {
      throw new Error(`Add employee failed: HTTP ${response.status()} ${await response.text()}`);
    }
    await this.page.waitForURL(EmployeeDetailsPage.PATH_PATTERN);
    const details = new EmployeeDetailsPage(this.page);
    await details.waitForLoadingToFinish();
    return details;
  }
}
