const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { ShoppingCarts, CartItems, PurchaseOrders, PurchaseOrderItems } = this.entities;

  // Helper: Compute total from draft or active items
  async function computeTotal(cartId) {
    if (!cartId) return 0;
    let items = await cds.run(SELECT.from(CartItems.drafts).where({ parent_ID: cartId }));
    if (!items || items.length === 0) {
      items = await cds.run(SELECT.from('mock.procurement.CartItems').where({ parent_ID: cartId }));
    }
    return (items || []).reduce((acc, it) => acc + ((Number(it.quantity) || 0) * (Number(it.netPrice) || 0)), 0);
  }

  // 1. FIORI DRAFT INITIALIZATION
  this.before('NEW', 'ShoppingCarts.drafts', (req) => {
    req.data.cartNumber = 'SC-' + Math.floor(100000 + Math.random() * 900000);
    req.data.status = 'SUBMITTED';
    req.data.companyCode = req.data.companyCode || '1000';
    req.data.plant = req.data.plant || '1010';
    req.data.currency = req.data.currency || 'EUR';
    req.data.totalAmount = 0;
  });

  // 2. LIVE DRAFT RECALCULATION
  this.after(['CREATE', 'UPDATE', 'DELETE'], 'CartItems.drafts', async (data, req) => {
    try {
      const itemId = req.data.ID || (req.params && req.params[0] && req.params[0].ID);
      let parentId = req.data.parent_ID;
      if (!parentId && itemId) {
        const item = await cds.run(SELECT.one.from(CartItems.drafts).columns('parent_ID').where({ ID: itemId }));
        parentId = item?.parent_ID;
      }
      if (parentId) {
        const total = await computeTotal(parentId);
        await cds.run(UPDATE(ShoppingCarts.drafts).set({ totalAmount: total }).where({ ID: parentId }));
      }
    } catch (err) {
      console.error('[FLOW-DEBUG ⚠️] Draft recalculation error:', err.message);
    }
  });

  // 3. FIORI DRAFT ACTIVATION
  this.before(['draftActivate', 'SAVE'], 'ShoppingCarts', async (req) => {
    const cartId = req.data.ID;
    const finalTotal = await computeTotal(cartId);
    req.data.totalAmount = finalTotal;
    req.data.status = req.data.status || 'SUBMITTED';

    await cds.run(UPDATE(ShoppingCarts.drafts).set({ 
      totalAmount: finalTotal,
      status: req.data.status 
    }).where({ ID: cartId }));
  });

  // 4. WESCALE DIRECT ACTIVE SUBMISSION
  this.on('CREATE', ['ShoppingCarts', 'ShoppingCarts.drafts'], async (req, next) => {
    if (req.data && Array.isArray(req.data.items) && req.data.items.length > 0) {
      try {
        const cartId = req.data.ID || cds.utils.uuid();
        const cartNum = req.data.cartNumber || ('SC-' + Math.floor(100000 + Math.random() * 900000));
        const rawItems = req.data.items;
        const total = rawItems.reduce((acc, it) => acc + ((Number(it.quantity) || 0) * (Number(it.netPrice) || 0)), 0);

        const header = {
          ID: cartId,
          cartNumber: cartNum,
          profileName: req.data.profileName || 'Standard Operations',
          companyCode: req.data.companyCode || '1000',
          plant: req.data.plant || '1010',
          costCenter: req.data.costCenter || 'CC-9010-IT',
          approver: req.data.approver || 'approver.manager@enterprise.com',
          status: 'SUBMITTED',
          totalAmount: total,
          currency: req.data.currency || 'EUR',
          poNumber: null
        };

        const itemEntries = rawItems.map((it, idx) => {
          let dDate = it.deliveryDate;
          if (dDate && /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dDate)) {
            const parts = dDate.split(/[-/]/);
            dDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }

          return {
            ID: it.ID || cds.utils.uuid(),
            parent_ID: cartId,
            itemNumber: it.itemNumber || (idx + 1) * 10,
            shortText: it.shortText || 'Item',
            orderType: it.orderType || 'Standard Purchase',
            materialGroup: it.materialGroup || 'IT-HARDWARE',
            quantity: Number(it.quantity) || 1,
            unitOfMeasure: it.unitOfMeasure || 'EA',
            netPrice: Number(it.netPrice) || 0,
            currency: it.currency || header.currency,
            accountingObj: it.accountingObj || header.costCenter,
            deliveryDate: dDate || null,
            supplier: it.supplier || '100458 - Dell Direct'
          };
        });

        await cds.run(INSERT.into('mock.procurement.ShoppingCarts').entries(header));
        await cds.run(INSERT.into('mock.procurement.CartItems').entries(itemEntries));

        console.log(`[FLOW-DEBUG ✅] Cart ${cartNum} saved as ACTIVE with Total: ${total} EUR`);

        return req.reply({
          ...header,
          IsActiveEntity: true,
          HasActiveEntity: false,
          HasDraftEntity: false,
          items: itemEntries
        });
      } catch (err) {
        console.error('[FLOW-DEBUG ❌] Wescale Submission DB Error:', err.message);
        return req.reject(500, `Database insert failed: ${err.message}`);
      }
    }
    return next();
  });

  // 5. APPROVE CART ACTION (Sets PO to Ordered and transmits confirmation)
  this.on('approveCart', async (req) => {
    const { cartId } = req.data;
    if (!cartId) return req.reject(400, 'cartId is required');

    const cart = await cds.run(SELECT.one.from('mock.procurement.ShoppingCarts').where({ ID: cartId }));
    if (!cart) return req.reject(404, `Shopping Cart ${cartId} not found`);

    const generatedPO = '45000' + Math.floor(10000 + Math.random() * 90000);
    const poId = cds.utils.uuid();

    const cartItems = await cds.run(SELECT.from('mock.procurement.CartItems').where({ parent_ID: cartId }));
    const rawSupplier = cartItems[0]?.supplier || '100458 - Dell Direct';
    const supplierNum = rawSupplier.includes(' - ') ? rawSupplier.split(' - ')[0] : '100458';
    const supplierName = rawSupplier.includes(' - ') ? rawSupplier.split(' - ')[1] : rawSupplier;

    // Create Purchase Order
    await cds.run(INSERT.into('mock.procurement.PurchaseOrders').entries({
      ID: poId,
      poNumber: generatedPO,
      poDocType: 'NB',
      supplierNumber: supplierNum,
      supplierName: supplierName,
      companyCode: cart.companyCode || '1000',
      purchasingOrg: '1000',
      purchasingGroup: '001',
      status: 'Ordered',
      transmissionStatus: 'PO successfully sent to supplier',
      totalAmount: cart.totalAmount || 0,
      currency: cart.currency || 'EUR'
    }));

    if (cartItems.length > 0) {
      const poItems = cartItems.map(ci => ({
        ID: cds.utils.uuid(),
        parent_ID: poId,
        itemNumber: ci.itemNumber || 10,
        accAssignmentCategory: 'K',
        shortText: ci.shortText || 'Item',
        quantity: ci.quantity || 1,
        unitOfMeasure: ci.unitOfMeasure || 'EA',
        netPrice: ci.netPrice || 0,
        currency: ci.currency || cart.currency || 'EUR',
        deliveryDate: ci.deliveryDate || null,
        materialGroup: ci.materialGroup || 'IT-HARDWARE',
        plant: cart.plant || '1010',
        referencePR: cart.cartNumber
      }));
      await cds.run(INSERT.into('mock.procurement.PurchaseOrderItems').entries(poItems));
    }

    // Update Shopping Cart
    await cds.run(UPDATE('mock.procurement.ShoppingCarts').set({
      status: 'PO_CREATED',
      poNumber: generatedPO
    }).where({ ID: cartId }));

    console.log(`[FLOW-DEBUG 📦] Cart ${cart.cartNumber} APPROVED -> PO ${generatedPO} created with status 'Ordered'.`);

    return req.reply({
      ...cart,
      status: 'PO_CREATED',
      poNumber: generatedPO
    });
  });

  // 6. REJECT CART ACTION
  this.on('rejectCart', async (req) => {
    const { cartId } = req.data;
    if (!cartId) return req.reject(400, 'cartId is required');

    const cart = await cds.run(SELECT.one.from('mock.procurement.ShoppingCarts').where({ ID: cartId }));
    if (!cart) return req.reject(404, `Shopping Cart ${cartId} not found`);

    await cds.run(UPDATE('mock.procurement.ShoppingCarts').set({
      status: 'REJECTED'
    }).where({ ID: cartId }));

    return req.reply({
      ...cart,
      status: 'REJECTED'
    });
  });


// 7. POST GOODS RECEIPT (MIGO - MOVEMENT 101)
    this.on('postGoodsReceipt', async (req) => {
    const { poNumber, deliveryNote, headerText, items } = req.data;
    if (!poNumber) return req.reject(400, 'Purchase Order number (poNumber) is required');
    if (!items || !items.length) return req.reject(400, 'At least one line item must be received');

    // 1. Validate Purchase Order
    const po = await cds.run(SELECT.one.from('mock.procurement.PurchaseOrders').where({ poNumber }));
    if (!po) return req.reject(404, `Purchase Order ${poNumber} not found`);

    const grId = cds.utils.uuid();
    const matDocNumber = '50000' + Math.floor(10000 + Math.random() * 90000);
    const currentYear = 2026;
    const today = new Date().toISOString().split('T')[0];

    // 2. Insert Material Document Header
    await cds.run(INSERT.into('mock.procurement.GoodsReceipts').entries({
      ID: grId,
      materialDocNumber: matDocNumber,
      docYear: currentYear,
      postingDate: today,
      documentDate: today,
      poNumber: poNumber,
      deliveryNote: deliveryNote || 'DEL-' + Math.floor(100000 + Math.random() * 900000),
      headerText: headerText || 'Standard Inbound Delivery (101)',
      status: 'POSTED'
    }));

    // 3. Process Goods Receipt Line Items & Update PO Quantities
    const grItemEntries = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const poItemNum = it.poItemNumber || (i + 1) * 10;
      const qtyReceived = Number(it.quantityReceived) || 0;

      grItemEntries.push({
        ID: cds.utils.uuid(),
        parent_ID: grId,
        itemNumber: (i + 1) * 10,
        poItemNumber: poItemNum,
        shortText: it.shortText || 'Item',
        quantity: qtyReceived,
        unitOfMeasure: it.unitOfMeasure || 'EA',
        storageLocation: it.storageLocation || '101A',
        plant: it.plant || po.plant || '1010',
        movementType: '101'
      });

      // Update receivedQuantity on PO line item
      const poItem = await cds.run(SELECT.one.from('mock.procurement.PurchaseOrderItems').where({
        parent_ID: po.ID,
        itemNumber: poItemNum
      }));

      if (poItem) {
        const newReceivedQty = (Number(poItem.receivedQuantity) || 0) + qtyReceived;
        await cds.run(UPDATE('mock.procurement.PurchaseOrderItems')
          .set({ receivedQuantity: newReceivedQty })
          .where({ ID: poItem.ID }));
      }
    }

    if (grItemEntries.length > 0) {
      await cds.run(INSERT.into('mock.procurement.GoodsReceiptItems').entries(grItemEntries));
    }

    // 4. Update PO Status ('Delivered' if all items fully received, else 'Partially Delivered')
    const allPoItems = await cds.run(SELECT.from('mock.procurement.PurchaseOrderItems').where({ parent_ID: po.ID }));
    const allFulfilled = allPoItems.length > 0 && allPoItems.every(pi => (Number(pi.receivedQuantity) || 0) >= Number(pi.quantity));

    const finalPoStatus = allFulfilled ? 'Delivered' : 'Partially Delivered';
    await cds.run(UPDATE('mock.procurement.PurchaseOrders').set({ status: finalPoStatus }).where({ ID: po.ID }));

    console.log(`[FLOW-DEBUG 🚚] Goods Receipt ${matDocNumber} (Mvt 101) posted for PO ${poNumber}. New PO Status: ${finalPoStatus}`);

    return req.reply({
      ID: grId,
      materialDocNumber: matDocNumber,
      docYear: currentYear,
      postingDate: today,
      documentDate: today,
      poNumber: poNumber,
      deliveryNote: deliveryNote || '',
      headerText: headerText || '',
      status: 'POSTED'
     });
    });
   });