import type { Locator, Page } from '@playwright/test';

export type MainMenuModule =
  | 'Admin'
  | 'PIM'
  | 'Leave'
  | 'Time'
  | 'Recruitment'
  | 'My Info'
  | 'Performance'
  | 'Dashboard'
  | 'Directory'
  | 'Maintenance'
  | 'Claim'
  | 'Buzz';

/** Left-hand main navigation. Menu labels are only rendered at desktop widths (≥1280px). */
export class SideMenu {
  readonly items: Locator;
  readonly searchInput: Locator;

  constructor(private readonly page: Page) {
    this.items = page.locator('a.oxd-main-menu-item');
    this.searchInput = page.locator('.oxd-main-menu-search input');
  }

  item(name: MainMenuModule): Locator {
    return this.items.filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) });
  }

  async open(name: MainMenuModule): Promise<void> {
    await this.item(name).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async moduleNames(): Promise<string[]> {
    const names = await this.items.allInnerTexts();
    return names.map((n) => n.trim());
  }
}
