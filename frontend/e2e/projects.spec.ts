import { test, expect } from './fixtures';

test.describe('Projects', () => {
  test('shows empty state when no projects exist', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-projects').click();
    await page.waitForURL('**/projects');
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('creates a new project', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('new-project-btn').click();

    await expect(page.getByTestId('project-modal')).toBeVisible();
    await page.getByTestId('project-name-input').fill('Website Redesign');
    await page.getByTestId('project-desc-input').fill('A full redesign of the marketing site');
    await page.getByTestId('save-project-btn').click();

    await expect(page.getByTestId('project-modal')).not.toBeVisible();
    await expect(page.getByTestId('project-grid')).toBeVisible();
    await expect(page.locator('.project-name').first()).toContainText('Website Redesign');
  });

  test('shows validation error when project name is empty', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('new-project-btn').click();
    await page.getByTestId('save-project-btn').click();
    await expect(page.locator('.alert-error')).toBeVisible();
    await expect(page.locator('.alert-error')).toContainText('Name is required');
  });

  test('edits a project', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('new-project-btn').click();
    await page.getByTestId('project-name-input').fill('Old Name');
    await page.getByTestId('save-project-btn').click();
    await expect(page.getByTestId('project-modal')).not.toBeVisible();

    const card = page.locator('[data-testid^="project-card-"]').first();
    await card.locator('[data-testid^="edit-project-"]').click();

    await expect(page.getByTestId('project-modal')).toBeVisible();
    await page.getByTestId('project-name-input').clear();
    await page.getByTestId('project-name-input').fill('New Name');
    await page.getByTestId('save-project-btn').click();

    await expect(page.getByTestId('project-modal')).not.toBeVisible();
    await expect(page.locator('.project-name').first()).toContainText('New Name');
  });

  test('deletes a project', async ({ loggedInPage: page }) => {
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('new-project-btn').click();
    await page.getByTestId('project-name-input').fill('To Be Deleted');
    await page.getByTestId('save-project-btn').click();
    await expect(page.getByTestId('project-modal')).not.toBeVisible();

    const card = page.locator('[data-testid^="project-card-"]').first();
    await card.locator('[data-testid^="delete-project-"]').click();

    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('assigns a task to a project and filters by it', async ({ loggedInPage: page }) => {
    // Create a project
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('new-project-btn').click();
    await page.getByTestId('project-name-input').fill('Alpha Project');
    await page.getByTestId('save-project-btn').click();
    await expect(page.getByTestId('project-modal')).not.toBeVisible();

    // Create a task assigned to that project
    await page.getByTestId('nav-tasks').click();
    await page.getByTestId('new-task-btn').click();
    await page.getByTestId('task-title-input').fill('Alpha task');
    await page.getByTestId('task-project-select').selectOption({ label: 'Alpha Project' });
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByTestId('task-modal')).not.toBeVisible();

    // Create a task with no project
    await page.getByTestId('new-task-btn').click();
    await page.getByTestId('task-title-input').fill('No project task');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByTestId('task-modal')).not.toBeVisible();

    // Filter by project — should see only "Alpha task"
    await page.getByTestId('filter-project').selectOption({ label: 'Alpha Project' });
    await expect(page.locator('.task-item')).toHaveCount(1);
    await expect(page.locator('.task-title').first()).toContainText('Alpha task');
  });

  test('project task count updates after adding task', async ({ loggedInPage: page, request }) => {
    // Create project via API for speed
    const token = (await page.evaluate(() => localStorage.getItem('tf_token')))!;
    const projRes = await request.post('http://localhost:8000/api/projects/', {
      data: { name: 'Count Project', color: '#7c6ef7' },
      headers: { Authorization: `Bearer ${token}` },
    });
    const project = await projRes.json();

    // Add a task via API
    await request.post('http://localhost:8000/api/tasks/', {
      data: { title: 'Counted task', project_id: project.id },
      headers: { Authorization: `Bearer ${token}` },
    });

    await page.getByTestId('nav-projects').click();
    await expect(page.locator('[data-testid^="project-card-"]').first()).toBeVisible();
    await expect(page.locator('.project-footer span').first()).toContainText('1');
  });
});
