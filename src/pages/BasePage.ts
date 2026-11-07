import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Shared behaviour for every OrangeHRM page: navigation, spinner handling and toast checks.
 * Subclasses expose intent-named actions; assertions stay in the tests.
 */
export abstract class BasePage {
  readonly breadcrumb: Locator;
  readonly loadingSpinner: Locator;
  readonly toast: Locator;
  /** First child of the Vue mount point — present only once the SPA has rendered. */
  private readonly appRoot: Locator;

  constructor(protected readonly page: Page) {
    this.breadcrumb = page.locator('.oxd-topbar-header-breadcrumb h6');
    this.loadingSpinner = page.locator('.oxd-loading-spinner');
    this.toast = page.locator('.oxd-toast');
    this.appRoot = page.locator('#app > *').first();
  }

  /** Navigate to a path relative to `baseURL` and wait for the UI to settle. */
  async goto(path: string): Promise<this> {
    await this.page.goto(path);
    await this.appRoot.waitFor({ state: 'attached' });
    await this.waitForLoadingToFinish();
    return this;
  }

  /**
   * Navigate to a page whose content is fetched from `/api/v2/...` right after mount, and wait for
   * that first response so later filter actions cannot race against the initial load.
   */
  protected async gotoAndWaitForApi(path: string, apiPathFragment: string): Promise<this> {
    await Promise.all([
      this.waitForApi(apiPathFragment),
      (async () => {
        await this.page.goto(path);
        await this.appRoot.waitFor({ state: 'attached' });
      })(),
    ]);
    await this.waitForLoadingToFinish();
    return this;
  }

  /** Waits for every `.oxd-loading-spinner` to disappear (table reloads, form submits, page loads). */
  async waitForLoadingToFinish(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.loadingSpinner).toHaveCount(0);
  }

  /**
   * Runs `action` (e.g. clicking Search) and waits for the matching `/api/v2/...` GET response
   * plus spinner teardown, so the table read afterwards reflects the new filter rather than the stale one.
   */
  protected async performAndWaitForApi(apiPathFragment: string, action: () => Promise<void>): Promise<void> {
    await Promise.all([this.waitForApi(apiPathFragment), action()]);
    await this.waitForLoadingToFinish();
  }

  /** Resolves once a GET to `apiPathFragment` has fully finished (body received), not just on headers. */
  private async waitForApi(apiPathFragment: string): Promise<void> {
    const response = await this.page.waitForResponse(
      (res) => res.request().method() === 'GET' && res.url().includes(apiPathFragment),
    );
    await response.finished();
  }

  /** Asserts a toast containing `text` is shown; toasts auto-dismiss, so this polls immediately. */
  async expectToast(text: string | RegExp): Promise<void> {
    await expect(this.toast.filter({ hasText: text }).first()).toBeVisible();
  }

  currentUrl(): string {
    return this.page.url();
  }
}
