import { test as base, expect } from '@playwright/test';
import { env } from '@config/env';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { EmployeeListPage } from '@pages/pim/EmployeeListPage';
import { AddEmployeePage } from '@pages/pim/AddEmployeePage';
import { SystemUsersPage } from '@pages/admin/SystemUsersPage';

export interface PageFixtures {
  /** Login page already opened in a fresh, unauthenticated context. */
  loginPage: LoginPage;
  /** Performs a UI login with the configured credentials and hands back the dashboard. */
  loggedIn: DashboardPage;
  /** Authenticated and navigated to PIM → Employee List. */
  employeeListPage: EmployeeListPage;
  /** Authenticated and navigated to PIM → Add Employee. */
  addEmployeePage: AddEmployeePage;
  /** Authenticated and navigated to Admin → System Users. */
  systemUsersPage: SystemUsersPage;
}

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },

  loggedIn: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const dashboard = await loginPage.login(env.username, env.password);
    await use(dashboard);
  },

  employeeListPage: async ({ page, loggedIn: _loggedIn }, use) => {
    const listPage = new EmployeeListPage(page);
    await listPage.goto();
    await use(listPage);
  },

  addEmployeePage: async ({ page, loggedIn: _loggedIn }, use) => {
    const addPage = new AddEmployeePage(page);
    await addPage.goto();
    await use(addPage);
  },

  systemUsersPage: async ({ page, loggedIn: _loggedIn }, use) => {
    const usersPage = new SystemUsersPage(page);
    await usersPage.goto();
    await use(usersPage);
  },
});

export { expect };
