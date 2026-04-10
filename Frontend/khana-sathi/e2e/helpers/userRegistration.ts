import { expect, type Page } from '@playwright/test';

export const registrationRoute = '**/auth/register';

export async function gotoRegistration(page: Page) {
  await page.goto('/Signup');
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
}

export async function fillRegistrationForm(
  page: Page,
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    agreeTerms: boolean;
  }> = {}
) {
  const values = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'secret123',
    confirmPassword: 'secret123',
    agreeTerms: true,
    ...overrides
  };

  await page.getByPlaceholder('John Doe').fill(values.name);
  await page.getByPlaceholder('example@gmail.com').fill(values.email);
  await page.locator('input[name="password"]').fill(values.password);
  await page.locator('input[name="confirmPassword"]').fill(values.confirmPassword);

  const termsCheckbox = page.getByRole('checkbox', { name: /i agree terms & conditions/i });
  if (values.agreeTerms) {
    await termsCheckbox.check();
  }
}

export async function submitRegistration(page: Page) {
  await page.getByRole('button', { name: /^sign up$/i }).click();
}
