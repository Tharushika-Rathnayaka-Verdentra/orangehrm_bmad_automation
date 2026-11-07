import type { Locator, Page } from '@playwright/test';

/**
 * OrangeHRM's custom `<select>` widget (`.oxd-select-wrapper`).
 * Anchored to the form group whose label matches, so several selects on one page stay distinguishable.
 */
export class OxdSelect {
  readonly root: Locator;
  readonly trigger: Locator;
  private readonly options: Locator;

  constructor(page: Page, label: string | RegExp) {
    this.root = page
      .locator('.oxd-input-group')
      .filter({ has: page.locator('label', { hasText: label }) });
    this.trigger = this.root.locator('.oxd-select-text');
    this.options = page.locator('.oxd-select-dropdown [role="option"]');
  }

  async select(option: string): Promise<void> {
    await this.trigger.click();
    await this.options.filter({ hasText: new RegExp(`^\\s*${escapeRegExp(option)}\\s*$`) }).click();
  }

  async selectedText(): Promise<string> {
    return (await this.trigger.innerText()).trim();
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
