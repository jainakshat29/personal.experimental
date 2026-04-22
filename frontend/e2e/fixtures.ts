import { test as base, expect, Page, APIRequestContext } from '@playwright/test';

export interface TestUser {
  email: string;
  username: string;
  password: string;
  token?: string;
}

const API = 'http://localhost:8000/api';

async function registerUser(request: APIRequestContext, user: TestUser): Promise<string> {
  const res = await request.post(`${API}/auth/register`, {
    data: { email: user.email, username: user.username, password: user.password },
  });
  if (!res.ok()) {
    // User might already exist — try login instead
    const login = await request.post(`${API}/auth/login`, {
      data: { email: user.email, password: user.password },
    });
    const body = await login.json();
    return body.access_token;
  }
  const body = await res.json();
  return body.access_token;
}

async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-btn').click();
  await page.waitForURL('**/dashboard');
}

export interface AppFixtures {
  loggedInPage: Page;
  apiToken: string;
}

export const test = base.extend<AppFixtures>({
  apiToken: async ({ request }, use) => {
    const token = await registerUser(request, {
      email: `test-${Date.now()}@example.com`,
      username: `user${Date.now()}`,
      password: 'Password123!',
    });
    await use(token);
  },

  loggedInPage: async ({ page, request }, use) => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'Password123!';
    const username = `e2e${Date.now()}`;
    await registerUser(request, { email, username, password });
    await loginViaUI(page, email, password);
    await use(page);
  },
});

export { expect };
export { loginViaUI, registerUser };
