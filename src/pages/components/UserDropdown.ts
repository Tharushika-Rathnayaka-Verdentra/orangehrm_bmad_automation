import type { Locator, Page } from '@playwright/test';

export type UserMenuEntry = 'About' | 'Support' | 'Change Password' | 'Logout';

/** Header avatar dropdown in the top-right corner. */
export class UserDropdown {
  readonly tab: Locator;
  readonly menu: Locator;

  constructor(private readonly page: Page) {
    this.tab = page.locator('.oxd-userdropdown-tab');
    this.menu = page.locator('.oxd-dropdown-menu');
  }

  entry(name: UserMenuEntry): Locator {
    return this.menu.locator('a', { hasText: name });
  }

  async open(): Promise<void> {
    await this.tab.click();
    await this.menu.waitFor({ state: 'visible' });
  }

  async select(name: UserMenuEntry): Promise<void> {
    await this.open();
    await this.entry(name).click();
  }

  /** Signs out and waits until the login page is reached. */
  async logout(): Promise<void> {
    await this.select('Logout');
    await this.page.waitForURL('**/auth/login');
  }
}
