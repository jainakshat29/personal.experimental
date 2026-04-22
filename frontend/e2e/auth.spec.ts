import { test, expect, loginViaUI, registerUser } from './fixtures';

const unique = () => Date.now().toString();

test.describe('Authentication', () => {
  test('shows login page by default when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/login');
    await expect(page.getByTestId('login-card')).toBeVisible();
  });

  test('registers a new user and redirects to dashboard', async ({ page }) => {
    const id = unique();
    await page.goto('/register');
    await page.getByTestId('username-input').fill(`user${id}`);
    await page.getByTestId('email-input').fill(`user${id}@example.com`);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('register-btn').click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
  });

  test('shows error on duplicate email registration', async ({ page, request }) => {
    const id = unique();
    const email = `dupe${id}@example.com`;
    await registerUser(request, { email, username: `orig${id}`, password: 'Password123!' });

    await page.goto('/register');
    await page.getByTestId('username-input').fill(`other${id}`);
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('register-btn').click();
    await expect(page.getByTestId('register-error')).toBeVisible();
    await expect(page.getByTestId('register-error')).toContainText('already');
  });

  test('logs in an existing user', async ({ page, request }) => {
    const id = unique();
    const email = `login${id}@example.com`;
    await registerUser(request, { email, username: `login${id}`, password: 'Password123!' });

    await page.goto('/login');
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-btn').click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByTestId('sidebar')).toBeVisible();
  });

  test('shows error on wrong password', async ({ page, request }) => {
    const id = unique();
    await registerUser(request, {
      email: `wrong${id}@example.com`,
      username: `wrong${id}`,
      password: 'Password123!',
    });

    await page.goto('/login');
    await page.getByTestId('email-input').fill(`wrong${id}@example.com`);
    await page.getByTestId('password-input').fill('WrongPassword!');
    await page.getByTestId('login-btn').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
  });

  test('logs out and redirects to login', async ({ loggedInPage: page }) => {
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await page.getByTestId('logout-btn').click();
    await page.waitForURL('**/login');
    await expect(page.getByTestId('login-card')).toBeVisible();
  });

  test('redirects unauthenticated user away from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
  });

  test('register link on login page navigates to register', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('register-link').click();
    await page.waitForURL('**/register');
    await expect(page.getByTestId('register-card')).toBeVisible();
  });

  test('login link on register page navigates to login', async ({ page }) => {
    await page.goto('/register');
    await page.getByTestId('login-link').click();
    await page.waitForURL('**/login');
    await expect(page.getByTestId('login-card')).toBeVisible();
  });
});
