import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SideMenu } from './components/SideMenu';
import { UserDropdown } from './components/UserDropdown';

export class DashboardPage extends BasePage {
  static readonly PATH = '/web/index.php/dashboard/index';

  readonly sideMenu: SideMenu;
  readonly userDropdown: UserDropdown;
  readonly widgetNames: Locator;

  constructor(page: Page) {
    super(page);
    this.sideMenu = new SideMenu(page);
    this.userDropdown = new UserDropdown(page);
    this.widgetNames = page.locator('.orangehrm-dashboard-widget-name');
  }

  override async goto(path: string = DashboardPage.PATH): Promise<this> {
    await super.goto(path);
    return this;
  }

  async widgetTitles(): Promise<string[]> {
    const titles = await this.widgetNames.allInnerTexts();
    return titles.map((t) => t.trim());
  }
}
