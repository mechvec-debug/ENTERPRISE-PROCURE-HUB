// @ts-nocheck
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface TestPlan {
  testPlanId: string;
  shortDescription: string;
  profileName: string;
  connectedSystem: string;
  companyCode: string;
  plantCode: string;
  accountCategory: string;
  accountObject: string;
  deliveryAddress: string;
  orderType: string;
  itemDescription: string;
  materialGroup: string;
  quantity: string;
  unitOfMeasure: string;
  price: string;
  currency: string;
  supplier: string;
  approver: string;
  [key: string]: string;
}

function loadFirstTestPlan(filePath: string): TestPlan {
  const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
  const lines: string[] = content.split(/\r?\n/).filter((line: string) => line.trim() !== '' && !line.startsWith('#'));
  const headers: string[] = lines[0].split(';').map((h: string) => h.trim());
  const values: string[] = lines[1].split(';').map((v: string) => v.trim());
  const record: Record<string, string> = {};
  headers.forEach((h: string, i: number) => {
    record[h] = values[i] || '';
  });
  return record as unknown as TestPlan;
}

const tp = loadFirstTestPlan('./tests/data/test-plans.csv');

test.describe(`Foreground Visual Walkthrough: ${tp.testPlanId}`, () => {
  test('Step-by-Step UI Execution with Video Recording', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      console.log(`[UI DIALOG] ${dialog.message()}`);
      await dialog.accept();
    });

    // 1. SHOPPING PROFILE SETUP
    await page.goto('/wescale-portal/webapp/index.html');
    await page.click('[data-testid="btn-open-profile"]');
    await page.fill('[data-testid="input-profile-name"]', tp.profileName);
    await page.fill('[data-testid="input-cph-system"]', tp.connectedSystem);
    await page.fill('[data-testid="input-company-code"]', tp.companyCode);
    await page.fill('[data-testid="input-plant"]', tp.plantCode);
    await page.fill('[data-testid="input-accounting-object"]', tp.accountObject);
    await page.fill('[data-testid="input-delivery-address"]', tp.deliveryAddress);
    await page.click('[data-testid="btn-save-profile"]');
    await expect(page.locator('#activeProfileChip')).toBeVisible();

    // 2. CREATE REQUISITION
    await page.click('[data-testid="nav-free-text"]');
    await page.selectOption('[data-testid="select-order-type"]', tp.orderType);
    await page.selectOption('[data-testid="input-material-group"]', tp.materialGroup);
    await page.fill('[data-testid="input-short-description"]', tp.itemDescription);
    await page.fill('[data-testid="input-quantity"]', tp.quantity);
    await page.selectOption('[data-testid="select-order-unit"]', tp.unitOfMeasure);
    await page.fill('[data-testid="input-net-price"]', tp.price);
    await page.selectOption('[data-testid="select-currency"]', tp.currency);
    await page.selectOption('[data-testid="select-acc-cat"]', tp.accountCategory);
    await page.waitForTimeout(500);
    await page.selectOption('[data-testid="input-acc-assignment"]', tp.accountObject);
    await page.selectOption('[data-testid="input-supplier"]', { label: tp.supplier + ' (US)' });
    await page.click('[data-testid="btn-add-line-item"]');

    // Submit Cart
    const [scRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/ShoppingCarts') && res.request().method() === 'POST'),
      page.click('[data-testid="btn-submit-cart"]')
    ]);
    const scData = await scRes.json();
    const cartNumber = scData.cartNumber;

    // 3. APPROVAL INBOX
    await page.goto('/approval-portal/webapp/index.html');
    const row = page.locator('#approverTableBody tr', { hasText: cartNumber });
    await expect(row).toBeVisible();
    const [apprRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/approveCart') && res.request().method() === 'POST'),
      row.locator('.btn-approve').click()
    ]);
    const apprData = await apprRes.json();
    const poNumber = apprData.poNumber;

    // 4. GOODS RECEIPT
    await page.goto('/goods-receipt/webapp/index.html');
    await page.selectOption('#poSelect', poNumber);
    await page.fill('#deliveryNote', `DN-${tp.testPlanId}`);
    await page.fill('#headerText', `Goods Receipt for ${tp.testPlanId}`);
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/postGoodsReceipt') && res.request().method() === 'POST'),
      page.click('.btn-post')
    ]);
  });
});