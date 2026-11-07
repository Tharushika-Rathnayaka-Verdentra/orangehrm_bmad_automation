import { test, expect } from '@fixtures/test';
import { env } from '@config/env';
import { DashboardPage } from '@pages/DashboardPage';
import { LoginPage } from '@pages/LoginPage';

const EXPECTED_MODULES = [
  'Admin',
  'PIM',
  'Leave',
  'Time',
  'Recruitment',
  'My Info',
  'Performance',
  'Dashboard',
  'Directory',
  'Maintenance',
  'Claim',
  'Buzz',
];

test.describe('Authentication', () => {
  test('valid credentials land on the dashboard', async ({ loginPage, page }) => {
    const dashboard = await loginPage.login(env.username, env.password);

    await expect(page).toHaveURL(new RegExp(`${DashboardPage.PATH}$`));
    await expect(dashboard.breadcrumb).toHaveText('Dashboard');
    await expect(dashboard.sideMenu.items).toHaveCount(EXPECTED_MODULES.length);
    expect(await dashboard.sideMenu.moduleNames()).toEqual(EXPECTED_MODULES);
  });

  test('invalid password shows an error and stays on login', async ({ loginPage, page }) => {
    await loginPage.submit(env.username, 'wrongpass');

    await expect(loginPage.errorAlert).toHaveText('Invalid credentials');
    await expect(page).toHaveURL(new RegExp(`${LoginPage.PATH}$`));
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('empty fields show Required validation and do not navigate', async ({ loginPage, page }) => {
    await loginPage.submitEmpty();

    await expect(loginPage.requiredMessages).toHaveCount(2);
    await expect(loginPage.requiredMessages).toHaveText(['Required', 'Required']);
    await expect(page).toHaveURL(new RegExp(`${LoginPage.PATH}$`));
  });

  test('logout returns to the login page', async ({ loggedIn, page }) => {
    await loggedIn.userDropdown.logout();

    await expect(page).toHaveURL(new RegExp(`${LoginPage.PATH}$`));
    const loginPage = new LoginPage(page);
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });
});
