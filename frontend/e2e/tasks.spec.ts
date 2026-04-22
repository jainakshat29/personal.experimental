import { test, expect } from './fixtures';

test.describe('Tasks', () => {
  test('shows empty state when no tasks exist', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-tasks').click();
    await page.waitForURL('**/tasks');
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('creates a new task', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-tasks').click();
    await page.getByTestId('new-task-btn').click();

    await expect(page.getByTestId('task-modal')).toBeVisible();
    await page.getByTestId('task-title-input').fill('My first task');
    await page.getByTestId('task-desc-input').fill('A description for the task');
    await page.getByTestId('task-priority-select').selectOption('high');
    await page.getByTestId('save-task-btn').click();

    await expect(page.getByTestId('task-modal')).not.toBeVisible();
    await expect(page.locator('[data-testid="task-list"]')).toBeVisible();
    await expect(page.locator('.task-title').first()).toContainText('My first task');
  });

  test('shows validation error when title is empty', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-tasks').click();
    await page.getByTestId('new-task-btn').click();
    await page.getByTestId('save-task-btn').click();
    await expect(page.locator('.alert-error')).toBeVisible();
    await expect(page.locator('.alert-error')).toContainText('Title is required');
  });

  test('edits an existing task', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-tasks').click();
    await page.getByTestId('new-task-btn').click();
    await page.getByTestId('task-title-input').fill('Task to edit');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByTestId('task-modal')).not.toBeVisible();

    const taskItem = page.locator('.task-item').first();
    await taskItem.hover();
    await taskItem.locator('[data-testid^="edit-task-"]').click();

    await expect(page.getByTestId('task-modal')).toBeVisible();
    await page.getByTestId('task-title-input').clear();
    await page.getByTestId('task-title-input').fill('Updated task title');
    await page.getByTestId('task-status-select').selectOption('in_progress');
    await page.getByTestId('save-task-btn').click();

    await expect(page.getByTestId('task-modal')).not.toBeVisible();
    await expect(page.locator('.task-title').first()).toContainText('Updated task title');
    await expect(page.locator('.badge-in_progress').first()).toBeVisible();
  });

  test('deletes a task', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-tasks').click();
    await page.getByTestId('new-task-btn').click();
    await page.getByTestId('task-title-input').fill('Task to delete');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByTestId('task-modal')).not.toBeVisible();

    const taskItem = page.locator('.task-item').first();
    await taskItem.hover();
    await taskItem.locator('[data-testid^="delete-task-"]').click();

    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('marks a task as done by clicking the check circle', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-tasks').click();
    await page.getByTestId('new-task-btn').click();
    await page.getByTestId('task-title-input').fill('Toggle me');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByTestId('task-modal')).not.toBeVisible();

    const check = page.locator('[data-testid^="task-check-"]').first();
    await check.click();

    await expect(check).toHaveClass(/done/);
    await expect(page.locator('.task-title.done').first()).toBeVisible();
    await expect(page.locator('.badge-done').first()).toBeVisible();
  });

  test('filters tasks by status', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-tasks').click();

    // Create a "todo" task
    await page.getByTestId('new-task-btn').click();
    await page.getByTestId('task-title-input').fill('Todo task');
    await page.getByTestId('task-status-select').selectOption('todo');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByTestId('task-modal')).not.toBeVisible();

    // Create a "done" task
    await page.getByTestId('new-task-btn').click();
    await page.getByTestId('task-title-input').fill('Done task');
    await page.getByTestId('task-status-select').selectOption('done');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByTestId('task-modal')).not.toBeVisible();

    // Filter by "done"
    await page.getByTestId('filter-status').selectOption('done');
    await expect(page.locator('.task-item')).toHaveCount(1);
    await expect(page.locator('.task-title').first()).toContainText('Done task');

    // Filter by "todo"
    await page.getByTestId('filter-status').selectOption('todo');
    await expect(page.locator('.task-item')).toHaveCount(1);
    await expect(page.locator('.task-title').first()).toContainText('Todo task');
  });

  test('filters tasks by priority', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-tasks').click();

    await page.getByTestId('new-task-btn').click();
    await page.getByTestId('task-title-input').fill('High priority');
    await page.getByTestId('task-priority-select').selectOption('high');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByTestId('task-modal')).not.toBeVisible();

    await page.getByTestId('new-task-btn').click();
    await page.getByTestId('task-title-input').fill('Low priority');
    await page.getByTestId('task-priority-select').selectOption('low');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByTestId('task-modal')).not.toBeVisible();

    await page.getByTestId('filter-priority').selectOption('high');
    await expect(page.locator('.task-item')).toHaveCount(1);
    await expect(page.locator('.task-title').first()).toContainText('High priority');
  });

  test('closes modal when clicking overlay', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-tasks').click();
    await page.getByTestId('new-task-btn').click();
    await expect(page.getByTestId('task-modal')).toBeVisible();
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId('task-modal')).not.toBeVisible();
  });
});
