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

  action approveCart(cartId: UUID) returns ShoppingCarts;
  action rejectCart(cartId: UUID) returns ShoppingCarts;
}