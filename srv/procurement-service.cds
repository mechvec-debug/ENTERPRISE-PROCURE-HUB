using { mock.procurement as db } from '../db/schema';
using from './annotations/sc-fiori-annotations';
using from './annotations/po-fiori-annotations';

service ProcurementService @(path: '/odata/v4/procurement') {
  @odata.draft.enabled
  entity ShoppingCarts as projection on db.ShoppingCarts;
  entity CartItems as projection on db.CartItems;

@odata.draft.enabled
  entity PurchaseOrders as projection on db.PurchaseOrders;
  entity PurchaseOrderItems as projection on db.PurchaseOrderItems;

  // Goods Receipt Entities
  @odata.draft.enabled
  entity GoodsReceipts as projection on db.GoodsReceipts;
  entity GoodsReceiptItems as projection on db.GoodsReceiptItems;

  // Master Data & Value Helps (Read-Only)
  @readonly entity Suppliers as projection on db.Suppliers;
  @readonly entity MaterialGroups as projection on db.MaterialGroups;
  @readonly entity UnitsOfMeasure as projection on db.UnitsOfMeasure;
  @readonly entity AccountAssignmentCategories as projection on db.AccountAssignmentCategories;
  @readonly entity CostCenters as projection on db.CostCenters;
  @readonly entity WBSElements as projection on db.WBSElements;
  @readonly entity InternalOrders as projection on db.InternalOrders;

  action approveCart(cartId: UUID) returns ShoppingCarts;
  action rejectCart(cartId: UUID) returns ShoppingCarts;

  // Goods Receipt (MIGO 101) Action
  type GRItemInput {
    itemNumber       : Integer;
    poItemNumber     : Integer;
    shortText        : String(255);
    quantityReceived : Decimal(13, 3);
    unitOfMeasure    : String(10);
    storageLocation  : String(10);
    plant            : String(10);
  };

  action postGoodsReceipt(
    poNumber     : String(50),
    deliveryNote : String(100),
    headerText   : String(255),
    items        : many GRItemInput
  ) returns GoodsReceipts;
}
// =========================================================================
// OBJECT PAGE ANNOTATIONS: SHOPPING CART LINE ITEMS
// =========================================================================
annotate ProcurementService.CartItems with @(
  UI.HeaderInfo: {
    TypeName: 'Line Item',
    TypeNamePlural: 'Line Items',
    Title: { $Type: 'UI.DataField', Value: shortText },
    Description: { $Type: 'UI.DataField', Value: itemNumber }
  },
  UI.Facets: [
    {
      $Type: 'UI.ReferenceFacet',
      ID: 'CartItemDetailsFacet',
      Label: 'Item Overview',
      Target: '@UI.FieldGroup#CartItemDetails'
    },
    {
      $Type: 'UI.ReferenceFacet',
      ID: 'CartAccountingFacet',
      Label: 'Account Assignment & Logistics',
      Target: '@UI.FieldGroup#CartAccounting'
    }
  ],
  UI.FieldGroup #CartItemDetails: {
    Data: [
      { $Type: 'UI.DataField', Value: itemNumber, Label: 'Item Number' },
      { $Type: 'UI.DataField', Value: shortText, Label: 'Description' },
      { $Type: 'UI.DataField', Value: materialGroup, Label: 'Material Group' },
      { $Type: 'UI.DataField', Value: quantity, Label: 'Quantity' },
      { $Type: 'UI.DataField', Value: unitOfMeasure, Label: 'Unit of Measure' },
      { $Type: 'UI.DataField', Value: netPrice, Label: 'Net Price' },
      { $Type: 'UI.DataField', Value: currency, Label: 'Currency' }
    ]
  },
  UI.FieldGroup #CartAccounting: {
    Data: [
      { $Type: 'UI.DataField', Value: orderType, Label: 'Order Type' },
      { $Type: 'UI.DataField', Value: accountingObj, Label: 'Account Assignment' },
      { $Type: 'UI.DataField', Value: supplier, Label: 'Supplier' },
      { $Type: 'UI.DataField', Value: deliveryDate, Label: 'Planned Delivery Date' }
    ]
  }
);

// =========================================================================
// OBJECT PAGE ANNOTATIONS: PURCHASE ORDER LINE ITEMS
// =========================================================================
annotate ProcurementService.PurchaseOrderItems with @(
  UI.HeaderInfo: {
    TypeName: 'PO Item',
    TypeNamePlural: 'PO Items',
    Title: { $Type: 'UI.DataField', Value: shortText },
    Description: { $Type: 'UI.DataField', Value: itemNumber }
  },
  UI.Facets: [
    {
      $Type: 'UI.ReferenceFacet',
      ID: 'PoItemDetailsFacet',
      Label: 'Purchase Order Item Information',
      Target: '@UI.FieldGroup#PoItemDetails'
    },
    {
      $Type: 'UI.ReferenceFacet',
      ID: 'PoDeliveryFacet',
      Label: 'Delivery & Inventory Details',
      Target: '@UI.FieldGroup#PoDelivery'
    }
  ],
  UI.FieldGroup #PoItemDetails: {
    Data: [
      { $Type: 'UI.DataField', Value: itemNumber, Label: 'Item Number' },
      { $Type: 'UI.DataField', Value: shortText, Label: 'Item Description' },
      { $Type: 'UI.DataField', Value: materialGroup, Label: 'Material Group' },
      { $Type: 'UI.DataField', Value: quantity, Label: 'Order Quantity' },
      { $Type: 'UI.DataField', Value: unitOfMeasure, Label: 'Order Unit' },
      { $Type: 'UI.DataField', Value: netPrice, Label: 'Net Price' },
      { $Type: 'UI.DataField', Value: currency, Label: 'Currency' }
    ]
  },
  UI.FieldGroup #PoDelivery: {
    Data: [
      { $Type: 'UI.DataField', Value: receivedQuantity, Label: 'Quantity Received' },
      { $Type: 'UI.DataField', Value: storageLocation, Label: 'Storage Location' },
      { $Type: 'UI.DataField', Value: plant, Label: 'Plant' },
      { $Type: 'UI.DataField', Value: accountingObj, Label: 'Cost Center / WBS' },
      { $Type: 'UI.DataField', Value: deliveryDate, Label: 'Delivery Date' }
    ]
  }
);