import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Audits (WCAG 2.1 AA)', () => {
    test('Dashboard should pass axe-core accessibility checks', async ({ page }) => {
        // Assume test user is logged in via global setup, otherwise we land on login
        await page.goto('/dashboard');

        // Inject Axe engine
        await injectAxe(page);

        // Wait for network/loading skeleton to finish
        // Alternatively wait for a specific element

        // Run audit
        await checkA11y(page, null, {
            detailedReport: true,
            detailedReportOptions: { html: true },
            axeOptions: {
                runOnly: {
                    type: 'tag',
                    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
                }
            }
        });
    });

    test('Login page should pass axe-core accessibility checks', async ({ page }) => {
        await page.goto('/login');
        await injectAxe(page);

        await checkA11y(page, null, {
            axeOptions: {
                runOnly: {
                    type: 'tag',
                    values: ['wcag2aa', 'wcag21aa']
                }
            }
        });
    });
});
