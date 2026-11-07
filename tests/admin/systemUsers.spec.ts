import { test, expect } from '@fixtures/test';
import { uniqueSuffix } from '@utils/testData';

test.describe('Admin → System Users', () => {
  test('search by username returns the single matching user', async ({ systemUsersPage }) => {
    await expect(systemUsersPage.header).toBeVisible();
    await expect(systemUsersPage.filterTitle).toBeVisible();

    await systemUsersPage.searchByUsername('Admin');

    await expect(systemUsersPage.rows).toHaveCount(1);
    const row = await systemUsersPage.rowValues(0);
    expect(row.username).toBe('Admin');
    expect(row.role).toBe('Admin');
    expect(row.status).toBe('Enabled');
    expect(await systemUsersPage.recordsFoundCount()).toBe(1);
  });

  test('search by role lists only users with that role', async ({ systemUsersPage }) => {
    await systemUsersPage.searchByRole('ESS');

    await expect(systemUsersPage.rows.first()).toBeVisible();
    const rows = await systemUsersPage.allRowValues();
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (const row of rows) {
      expect(row.role).toBe('ESS');
    }
    expect(await systemUsersPage.recordsFoundCount()).toBe(rows.length);
  });

  test('search for an unknown username shows the empty state', async ({ systemUsersPage }) => {
    await systemUsersPage.searchByUsername(`zz-no-such-user-${uniqueSuffix()}`);

    await expect(systemUsersPage.noRecordsText).toBeVisible();
    await expect(systemUsersPage.rows).toHaveCount(0);
    expect(await systemUsersPage.recordsFoundCount()).toBe(0);
  });
});
