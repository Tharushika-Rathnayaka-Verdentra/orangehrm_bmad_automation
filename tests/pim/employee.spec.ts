import { test, expect } from '@fixtures/test';
import { EmployeeDetailsPage } from '@pages/pim/EmployeeDetailsPage';
import { EmployeeListPage } from '@pages/pim/EmployeeListPage';
import { uniqueEmployeeId, uniqueEmployeeName } from '@utils/testData';

test.describe('PIM', () => {
  test('add an employee, then find it in the employee list', async ({ employeeListPage, page }) => {
    const employee = { ...uniqueEmployeeName(), employeeId: uniqueEmployeeId() };

    await test.step('Add employee', async () => {
      await expect(employeeListPage.header).toBeVisible();
      const addPage = await employeeListPage.clickAdd();
      const details = await addPage.addEmployee(employee);

      await expect(page).toHaveURL(EmployeeDetailsPage.PATH_PATTERN);
      await expect(details.nameHeader).toHaveText(employee.fullName);
      expect(details.employeeNumber()).not.toBeNull();
    });

    await test.step('Search for the new employee', async () => {
      const listPage = new EmployeeListPage(page);
      await listPage.goto();
      await listPage.searchByName(employee.fullName);

      await expect(listPage.rowContaining(employee.firstName).first()).toBeVisible();
      await expect(listPage.rowContaining(employee.lastName).first()).toBeVisible();
      expect(await listPage.recordsFoundCount()).toBeGreaterThanOrEqual(1);
    });
  });
});
