namespace mock.procurement;

using { cuid, managed } from '@sap/cds/common';

entity ShoppingCarts : cuid, managed {
  cartNumber   : String(50);
  profileName  : String(100);
  companyCode  : String(10);
  plant        : String(10);
  costCenter   : String(50);
  approver     : String(100);
  status       : String(50);
  totalAmount  : Decimal(15, 2);
  currency     : String(5);
  poNumber     : String(50);
  items        : Composition of many CartItems on items.parent = $self;
}

entity CartItems : cuid {
  parent        : Association to ShoppingCarts;
  itemNumber    : Integer;
  shortText     : String(255);
  orderType     : String(50);
  materialGroup : String(50);
  quantity      : Decimal(13, 3);
  unitOfMeasure : String(10);
  netPrice      : Decimal(15, 2);
  currency      : String(5);
  accountingObj : String(50);
  deliveryDate  : Date;
  supplier      : String(100);
}

entity PurchaseOrders : cuid, managed {
  poNumber           : String(50);
  poDocType          : String(10);
  supplierNumber     : String(50);
  supplierName       : String(100);
  companyCode        : String(10);
  purchasingOrg      : String(10);
  purchasingGroup    : String(10);
  status             : String(50);
  transmissionStatus : String(100);
  totalAmount        : Decimal(15, 2);
  currency           : String(5);
  items              : Composition of many PurchaseOrderItems on items.parent = $self;
}

entity PurchaseOrderItems : cuid {
  parent                : Association to PurchaseOrders;
  itemNumber            : Integer;
  accAssignmentCategory : String(10);
  shortText             : String(255);
  quantity              : Decimal(13, 3);
  unitOfMeasure         : String(10);
  netPrice              : Decimal(15, 2);
  currency              : String(5);
  deliveryDate          : Date;
  materialGroup         : String(50);
  plant                 : String(10);
  referencePR           : String(50);
}