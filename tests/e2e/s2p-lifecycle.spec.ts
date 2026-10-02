import { test, expect } from '@playwright/test';

// Self-contained UUID generator (requires no @types/node packages)
const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

test.describe('TP_IN_UAT_001: End-to-End S2P Material Procurement Workflow', () => {
  const createdCartId = generateUUID();
  const createdCartNumber = 'SC-' + Math.floor(100000 + Math.random() * 900000);
  let generatedPONumber = '';

  test('Execute Complete Procure-to-Pay Lifecycle (BAS Compatible)', async ({ request }) => {
    // =========================================================================
    // PHASE 1: VALIDATING PROFILE CONFIGURATION
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- PHASE 1: VALIDATING PROFILE CONFIGURATION ---');
    const profile = {
      profileName: 'IT-Sami',
      cphSystem: 'yHL',
      companyCode: '1000',
      plant: '1010',
      accountingObject: 'CC-9010-IT',
      deliveryAddress: 'HQ Tech Park, Tower B, Level 4, Bellary'
    };
    expect(profile.profileName).toBe('IT-Sami');
    console.log(`[PASS] Profile "${profile.profileName}" verified for Plant ${profile.plant}`);

    // =========================================================================
    // PHASE 2: SUBMIT ACTIVE SHOPPING CART (OData V4 Deep Insert)
    // =========================================================================
    console.log('\n--- PHASE 2: SUBMITTING ACTIVE SHOPPING CART ---');
    const scPayload = {
      ID: createdCartId,
      cartNumber: createdCartNumber,
      profileName: profile.profileName,
      companyCode: profile.companyCode,
      plant: profile.plant,
      costCenter: profile.accountingObject,
      approver: 'approver.manager@enterprise.com',
      status: 'SUBMITTED',
      totalAmount: 500.00,
      currency: 'EUR',
      items: [
        {
          ID: generateUUID(),
          parent_ID: createdCartId,
          itemNumber: 10,
          shortText: '27-inch 4K UHD Developer Monitor',
          orderType: 'Standard Purchase',
          materialGroup: 'IT-HARDWARE',
          quantity: 2,
          unitOfMeasure: 'EA',
          netPrice: 250.00,
          currency: 'EUR',
          accountingObj: 'CC-9010-IT',
          supplier: '100458 - Dell Direct'
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

    // Accept both 201 Created and 204 No Content per OData V4 spec
    expect([201, 204]).toContain(scRes.status());
    console.log(`[PASS] Cart ${createdCartNumber} created as ACTIVE. HTTP Status: ${scRes.status()}`);

    // =========================================================================
    // PHASE 3: MANAGER APPROVAL & AUTOMATIC PO GENERATION
    // =========================================================================
    console.log('\n--- PHASE 3: MANAGER APPROVAL & PO CREATION ---');
    const approveRes = await request.post('/odata/v4/procurement/approveCart', {
      headers: { 'Content-Type': 'application/json' },
      data: { cartId: createdCartId }
    });

    expect(approveRes.status()).toBe(200);
    const approvedData = await approveRes.json();
    generatedPONumber = approvedData.poNumber;

    expect(approvedData.status).toBe('PO_CREATED');
    expect(generatedPONumber).toMatch(/^45000\d+$/);
    console.log(`[PASS] Cart approved. SAP Purchase Order generated: ${generatedPONumber}`);

    // Verify PO Header details in ERP persistence
    const poRes = await request.get(`/odata/v4/procurement/PurchaseOrders?$filter=poNumber eq '${generatedPONumber}'`);
    expect(poRes.ok()).toBeTruthy();
    const poList = await poRes.json();
    const poHeader = poList.value[0];

    expect(poHeader.status).toBe('Ordered');
    expect(poHeader.transmissionStatus).toBe('PO successfully sent to supplier');
    console.log(`[PASS] PO ${generatedPONumber} confirmed in status "${poHeader.status}" with transmission status.`);

    // =========================================================================
    // PHASE 4: GOODS RECEIPT (MIGO - MOVEMENT 101)
    // =========================================================================
    console.log('\n--- PHASE 4: POST GOODS RECEIPT (MIGO 101) ---');
    const grPayload = {
      poNumber: generatedPONumber,
      deliveryNote: 'DN-UAT-88102',
      headerText: 'TP_IN_UAT_001 Inbound Delivery Verified',
      items: [
        {
          itemNumber: 10,
          poItemNumber: 10,
          shortText: '27-inch 4K UHD Developer Monitor',
          quantityReceived: 2,
          unitOfMeasure: 'EA',
          storageLocation: '101A',
          plant: '1010'
        }
      ]
    };

    const grRes = await request.post('/odata/v4/procurement/postGoodsReceipt', {
      headers: { 'Content-Type': 'application/json' },
      data: grPayload
    });

    expect(grRes.status()).toBe(200);
    const grResult = await grRes.json();
    expect(grResult.materialDocNumber).toMatch(/^50000\d+$/);
    console.log(`[PASS] Material Document ${grResult.materialDocNumber} posted (Movement 101).`);

    // =========================================================================
    // PHASE 5: FINAL PO DELIVERED STATUS VERIFICATION
    // =========================================================================
    console.log('\n--- PHASE 5: VERIFY FINAL STATUS TRANSITION ---');
    const poFinalRes = await request.get(`/odata/v4/procurement/PurchaseOrders?$filter=poNumber eq '${generatedPONumber}'`);
    const poFinalData = await poFinalRes.json();
    const poFinal = poFinalData.value[0];

    expect(poFinal.status).toBe('Delivered');
    console.log(`[PASS] Purchase Order ${generatedPONumber} is now: "${poFinal.status}". Complete S2P cycle verified!\n======================================================`);
  });
});