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