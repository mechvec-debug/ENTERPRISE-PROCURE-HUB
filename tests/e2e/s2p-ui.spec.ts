cat << 'EOF' > tests/e2e/s2p-ui.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TP_IN_UAT_001: Foreground UI Walkthrough', () => {
  let createdCartNumber = '';
  let generatedPONumber = '';

  test('Interactive Browser Walkthrough with Video', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      console.log(`[UI DIALOG] ${dialog.message()}`);
      await dialog.accept();
    });

    // 1. SHOPPING PROFILE SETUP
    await page.goto('/wescale-portal/webapp/index.html');
    await page.click('[data-testid="btn-open-profile"]');
    await page.fill('[data-testid="input-profile-name"]', 'IT-Sami');
    await page.fill('[data-testid="input-cph-system"]', 'yHL');
    await page.fill('[data-testid="input-company-code"]', '1000');
    await page.fill('[data-testid="input-plant"]', '1010');
    await page.fill('[data-testid="input-accounting-object"]', 'CC-9010-IT');
    await page.fill('[data-testid="input-delivery-address"]', 'HQ Tech Park, Tower B, Level 4, Bellary');
    await page.click('[data-testid="btn-save-profile"]');
    await expect(page.locator('#activeProfileChip')).toBeVisible();

    // 2. CREATE REQUISITION WITH CASCADING DROPDOWNS
    await page.click('[data-testid="nav-free-text"]');
    await page.selectOption('[data-testid="select-order-type"]', 'Standard Purchase');
    await page.selectOption('[data-testid="input-material-group"]', 'IT-HARDWARE');
    await page.fill('[data-testid="input-short-description"]', '27-inch 4K UHD Developer Monitor');
    await page.fill('[data-testid="input-quantity"]', '2');
    await page.selectOption('[data-testid="select-order-unit"]', 'EA');
    await page.fill('[data-testid="input-net-price"]', '250.00');
    await page.selectOption('[data-testid="select-currency"]', 'EUR');
    await page.selectOption('[data-testid="select-acc-cat"]', 'K');
    await page.waitForTimeout(500);
    await page.selectOption('[data-testid="input-acc-assignment"]', 'CC-9010-IT');
    await page.selectOption('[data-testid="input-supplier"]', { label: '100458 - Dell Direct (US)' });
    await page.click('[data-testid="btn-add-line-item"]');

    // Submit Cart
    const [scRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/ShoppingCarts') && res.request().method() === 'POST'),
      page.click('[data-testid="btn-submit-cart"]')
    ]);
    const scData = await scRes.json();
    createdCartNumber = scData.cartNumber;

    // 3. MANAGER INBOX APPROVAL
    await page.goto('/approval-portal/webapp/index.html');
    const row = page.locator('#approverTableBody tr', { hasText: createdCartNumber });
    await expect(row).toBeVisible();
    const [apprRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/approveCart') && res.request().method() === 'POST'),
      row.locator('.btn-approve').click()
    ]);
    const apprData = await apprRes.json();
    generatedPONumber = apprData.poNumber;

    // 4. GOODS RECEIPT (MIGO 101)
    await page.goto('/goods-receipt/webapp/index.html');
    await page.selectOption('#poSelect', generatedPONumber);
    await page.fill('#deliveryNote', 'DN-994821');
    await page.fill('#headerText', 'TP_IN_UAT_001 Goods Received');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/postGoodsReceipt') && res.request().method() === 'POST'),
      page.click('.btn-post')
    ]);
  });
});
