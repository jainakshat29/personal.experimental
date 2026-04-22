import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test('shows stats grid on login', async ({ loggedInPage: page }) => {
    await expect(page.getByTestId('stats-grid')).toBeVisible();
    await expect(page.getByTestId('stat-total')).toContainText('0');
    await expect(page.getByTestId('stat-done')).toContainText('0');
  });

  test('stats update after creating tasks', async ({ loggedInPage: page, request }) => {
    const token = (await page.evaluate(() => localStorage.getItem('tf_token')))!;
    const headers = { Authorization: `Bearer ${token}` };

    await request.post('http://localhost:8000/api/tasks/', {
      data: { title: 'Task 1', status: 'todo' }, headers,
    });
    await request.post('http://localhost:8000/api/tasks/', {
      data: { title: 'Task 2', status: 'done' }, headers,
    });
    await request.post('http://localhost:8000/api/tasks/', {
      data: { title: 'Task 3', status: 'in_progress' }, headers,
    });

    await page.reload();
    await expect(page.getByTestId('stat-total')).toContainText('3');
    await expect(page.getByTestId('stat-done')).toContainText('1');
    await expect(page.getByTestId('stat-inprogress')).toContainText('1');
  });

  test('recent tasks appear on dashboard', async ({ loggedInPage: page, request }) => {
    const token = (await page.evaluate(() => localStorage.getItem('tf_token')))!;
    await request.post('http://localhost:8000/api/tasks/', {
      data: { title: 'Dashboard task' },
      headers: { Authorization: `Bearer ${token}` },
    });

    await page.reload();
    await expect(page.getByTestId('dashboard-task').first()).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-task"] .task-title').first()).toContainText('Dashboard task');
  });

  test('nav links work from dashboard', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-tasks').click();
    await page.waitForURL('**/tasks');

    await page.getByTestId('nav-projects').click();
    await page.waitForURL('**/projects');

    await page.getByTestId('nav-dashboard').click();
    await page.waitForURL('**/dashboard');
  });
});
