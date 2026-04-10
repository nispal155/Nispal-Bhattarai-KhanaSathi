import { test, expect } from '@playwright/test';
import {
  fillRegistrationForm,
  gotoRegistration,
  registrationRoute,
  submitRegistration
} from './helpers/userRegistration';

test.describe('User Registration', () => {
  test('[REG-E2E-001] renders the public registration page and core form controls', async ({ page }) => {
    await gotoRegistration(page);

    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('example@gmail.com')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /i agree terms & conditions/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /log in here/i })).toHaveAttribute('href', '/login');
  });

  test('[REG-E2E-002] blocks empty submissions with the first validation error', async ({ page }) => {
    let requestSeen = false;
    await page.route(registrationRoute, async (route) => {
      requestSeen = true;
      await route.abort();
    });

    await gotoRegistration(page);
    await submitRegistration(page);

    await expect(page.getByText('Please enter your name')).toBeVisible();
    expect(requestSeen).toBe(false);
  });

  test('[REG-E2E-003] rejects invalid email addresses with browser validation before sending the request', async ({ page }) => {
    let requestSeen = false;
    await page.route(registrationRoute, async (route) => {
      requestSeen = true;
      await route.abort();
    });

    await gotoRegistration(page);
    await fillRegistrationForm(page, {
      email: 'invalid-email',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    });
    await submitRegistration(page);

    await expect(page.locator('input[name="email"]:invalid')).toBeVisible();
    expect(requestSeen).toBe(false);
  });

  test('[REG-E2E-004] completes the successful registration journey and redirects to OTP verification', async ({ page }) => {
    let requestBody: Record<string, unknown> | null = null;
    await page.route(registrationRoute, async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Registration successful. Please check your email for OTP.',
          userId: 'user-1',
          email: 'jane@example.com'
        })
      });
    });

    await gotoRegistration(page);
    await fillRegistrationForm(page, {
      name: '  Jane Doe  ',
      email: 'jane@example.com'
    });
    await submitRegistration(page);

    await expect(page.getByText('Registration successful! Please verify your email.')).toBeVisible();
    await expect(page).toHaveURL(/\/verify-otp$/);
    expect(requestBody).toEqual({
      username: 'Jane Doe',
      email: 'jane@example.com',
      password: 'secret123'
    });
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('pendingVerificationEmail')))
      .toBe('jane@example.com');
  });

  test('[REG-E2E-005] shows backend duplicate-email errors and stays on the signup page', async ({ page }) => {
    await page.route(registrationRoute, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'This email is already registered',
          code: 'EMAIL_EXISTS'
        })
      });
    });

    await gotoRegistration(page);
    await fillRegistrationForm(page);
    await submitRegistration(page);

    await expect(page.getByText('This email is already registered')).toBeVisible();
    await expect(page).toHaveURL(/\/Signup$/);
  });
});
