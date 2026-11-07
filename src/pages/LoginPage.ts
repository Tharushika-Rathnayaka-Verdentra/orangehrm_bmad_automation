import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { DashboardPage } from './DashboardPage';

export class LoginPage extends BasePage {
  static readonly PATH = '/web/index.php/auth/login';

  readonly title: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorAlert: Locator;
  readonly requiredMessages: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('h5.orangehrm-login-title');
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.forgotPasswordLink = page.locator('.orangehrm-login-forgot');
    this.errorAlert = page.locator('.oxd-alert.oxd-alert--error .oxd-alert-content-text');
    this.requiredMessages = page.locator('.oxd-input-field-error-message');
  }

  override async goto(path: string = LoginPage.PATH): Promise<this> {
    await super.goto(path);
    return this;
  }

  /** Fills and submits the form without asserting the result, so both success and failure paths reuse it. */
  async submit(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Happy-path login that waits for the dashboard to load. */
  async login(username: string, password: string): Promise<DashboardPage> {
    await this.submit(username, password);
    await this.page.waitForURL(`**${DashboardPage.PATH}`);
    const dashboard = new DashboardPage(this.page);
    await dashboard.waitForLoadingToFinish();
    return dashboard;
  }

  async submitEmpty(): Promise<void> {
    await this.usernameInput.fill('');
    await this.passwordInput.fill('');
    await this.loginButton.click();
  }
}
