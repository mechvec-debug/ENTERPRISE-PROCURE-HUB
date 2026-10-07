// @ts-nocheck
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Excel Reader Function
function loadTestPlansFromExcel(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  const workbook = XLSX.readFile(resolvedPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
}

// Load scenarios directly from the .xlsx workbook
const testPlans = loadTestPlansFromExcel('./tests/data/test-plans.xlsx');

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
  const r = (Math.random() * 16) | 0;
  return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
});

test.describe('Data-Driven S2P Material Procurement Workflow (Excel Driven)', () => {
  test.beforeAll(async ({ request }) => {
    console.log('Connecting to CAP service on http://127.0.0.1:4004 ...');
    const maxRetries = 20;
    let isReady = false;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await request.get('/odata/v4/procurement/$metadata');
        if (res.ok()) {
          isReady = true;
          console.log('[PASS] CAP OData service is online and ready for requests.\n');
          break;
        }
      } catch (err) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    if (!isReady) {
      throw new Error('CAP server on http://127.0.0.1:4004 did not respond.');
    }
  });

  for (const tp of testPlans) {
    test(`Test Plan: ${tp.testPlanId} - ${tp.shortDescription}`, async ({ request }) => {
      const createdCartId = generateUUID();
      const cartNumber = 'SC-' + Math.floor(100000 + Math.random() * 900000);
      let generatedPONumber = '';

      const totalQty = parseFloat(tp.quantity) || 1;
      const unitPrice = parseFloat(tp.price) || 0;
      const expectedTotal = totalQty * unitPrice;
      const deliveryDate = tp.deliveryDate || '2026-10-15';

      console.log(`======================================================`);
      console.log(`EXECUTING TEST PLAN: ${tp.testPlanId}`);
      console.log(`Description: ${tp.shortDescription}`);
      console.log(`Profile: ${tp.profileName} | Plant: ${tp.plantCode} | Delivery Date: ${deliveryDate}`);
      console.log(`======================================================`);

      // PHASE 1: SHOPPING PROFILE
      expect(tp.profileName).toBeTruthy();
      console.log(`[PASS] Phase 1: Profile "${tp.profileName}" verified`);

      // PHASE 2: SUBMIT SHOPPING CART
      const scPayload = {
        ID: createdCartId,
        cartNumber: cartNumber,
        profileName: tp.profileName,
        companyCode: String(tp.companyCode),
        plant: String(tp.plantCode),
        costCenter: tp.accountObject,
        approver: tp.approver || 'approver.manager@enterprise.com',
        status: 'SUBMITTED',
        totalAmount: expectedTotal,
        currency: tp.currency || 'EUR',
        items: [
          {
            ID: generateUUID(),
            parent_ID: createdCartId,
            itemNumber: 10,
            shortText: tp.itemDescription,
            orderType: tp.orderType,
            materialGroup: tp.materialGroup,
            quantity: totalQty,
            unitOfMeasure: tp.unitOfMeasure,
            netPrice: unitPrice,
            currency: tp.currency || 'EUR',
            accountingObj: tp.accountObject,
            deliveryDate: deliveryDate, // <-- Passed into Shopping Cart item
            supplier: tp.supplier
          }
        ]
      };

      const scRes = await request.post('/odata/v4/procurement/ShoppingCarts', {
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        data: scPayload
      });

      expect([201, 204]).toContain(scRes.status());
      console.log(`[PASS] Phase 2: Cart ${cartNumber} submitted with delivery date ${deliveryDate}`);

      // PHASE 3: MANAGER APPROVAL & PO GENERATION
      const approveRes = await request.post('/odata/v4/procurement/approveCart', {
        headers: { 'Content-Type': 'application/json' },
        data: { cartId: createdCartId }
      });

      expect(approveRes.status()).toBe(200);
      const approvedData = await approveRes.json();
      generatedPONumber = approvedData.poNumber;
      console.log(`[PASS] Phase 3: PO generated: ${generatedPONumber}`);

      // PHASE 4: GOODS RECEIPT (MIGO 101)
      const grPayload = {
        poNumber: generatedPONumber,
        deliveryNote: `DN-${tp.testPlanId}`,
        headerText: `Automated Goods Receipt for ${tp.testPlanId}`,
        items: [
          {
            itemNumber: 10,
            poItemNumber: 10,
            shortText: tp.itemDescription,
            quantityReceived: totalQty,
            unitOfMeasure: tp.unitOfMeasure,
            storageLocation: '101A',
            plant: String(tp.plantCode)
          }
        ]
      };

      const grRes = await request.post('/odata/v4/procurement/postGoodsReceipt', {
        headers: { 'Content-Type': 'application/json' },
        data: grPayload
      });

      expect(grRes.status()).toBe(200);
      const grResult = await grRes.json();
      console.log(`[PASS] Phase 4: Goods Receipt Material Doc ${grResult.materialDocNumber} posted`);

      // PHASE 5: VERIFY FINAL STATUS & ITEM INTEGRITY
      const poVerifyRes = await request.get(`/odata/v4/procurement/PurchaseOrders?$filter=poNumber eq '${generatedPONumber}'&$expand=items`);
      const poVerifyData = await poVerifyRes.json();
      const finalPO = poVerifyData.value[0];

      expect(finalPO.status).toBe('Delivered');
      expect(finalPO.items[0].accountingObj).toBe(tp.accountObject);
      expect(finalPO.items[0].deliveryDate).toBe(deliveryDate);
      console.log(`[PASS] Phase 5: PO ${generatedPONumber} items verified with Account Assignment and Delivery Date.\n`);
    });
  }
});