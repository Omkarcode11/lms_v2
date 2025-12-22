import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display homepage with hero section', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: /Welcome to EduFlow/i })).toBeVisible();
    await expect(page.getByText(/modern, AI-powered Learning/i)).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Rich Content')).toBeVisible();
    await expect(page.getByText('Role-Based Access')).toBeVisible();
    await expect(page.getByText('Certifications')).toBeVisible();
    await expect(page.getByText('AI-Powered')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    const getStartedButton = page.getByRole('link', { name: 'Get Started Free' });
    await expect(getStartedButton).toBeVisible();
    await expect(getStartedButton).toHaveAttribute('href', '/auth/signup');
    
    const browseCoursesButton = page.getByRole('link', { name: 'Browse Courses' });
    await expect(browseCoursesButton).toBeVisible();
    await expect(browseCoursesButton).toHaveAttribute('href', '/courses');
  });

  test('should display footer with links', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText(/Built with Next.js/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
  });
});

