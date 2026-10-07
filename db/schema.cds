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
  parent                : Association to ShoppingCarts;
  itemNumber            : Integer;
  orderType             : String(50);
  shortText             : String(255);
  materialGroup         : String(50);
  quantity              : Decimal(13, 3);
  unitOfMeasure         : String(10);
  netPrice              : Decimal(15, 2);
  currency              : String(5);
  accAssignmentCategory : String(10);
  accountingObj         : String(100);
  deliveryDate          : Date;
  supplier              : String(255);
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
  receivedQuantity      : Decimal(13, 3) default 0;
  unitOfMeasure         : String(10);
  netPrice              : Decimal(15, 2);
  currency              : String(5);
  deliveryDate          : Date;
  materialGroup         : String(50);
  plant                 : String(10);
  storageLocation       : String(20);
  referencePR           : String(50);
  accountingObj         : String(100);
}

// ==========================================
// GOODS RECEIPT (MIGO - MOVEMENT 101)
// ==========================================
entity GoodsReceipts : cuid, managed {
  materialDocNumber : String(50);
  docYear           : Integer;
  postingDate       : Date;
  documentDate      : Date;
  poNumber          : String(50);
  deliveryNote      : String(100);
  headerText        : String(255);
  status            : String(50);
  items             : Composition of many GoodsReceiptItems on items.parent = $self;
}

entity GoodsReceiptItems : cuid {
  parent          : Association to GoodsReceipts;
  itemNumber      : Integer;
  poItemNumber    : Integer;
  shortText       : String(255);
  quantity        : Decimal(13, 3);
  unitOfMeasure   : String(10);
  storageLocation : String(10);
  plant           : String(10);
  movementType    : String(10); // '101'
}

// ==========================================
// MASTER DATA & VALUE HELP TABLES
// ==========================================
entity Suppliers {
  key code        : String(20);
      name        : String(100);
      country     : String(10);
      city        : String(100);
      currency    : String(5);
}

entity MaterialGroups {
  key code        : String(20);
      description : String(100);
}

entity UnitsOfMeasure {
  key code        : String(10);
      description : String(100);
}

entity AccountAssignmentCategories {
  key code        : String(10);  // 'K', 'P', 'F'
      description : String(100);
      objectType  : String(50);   // 'Cost Center', 'WBS Element', 'Internal Order'
}

entity CostCenters {
  key code        : String(50);  // e.g. 'CC-9010-IT'
      name        : String(100);
      companyCode : String(10);
      responsible : String(100);
}

entity WBSElements {
  key code        : String(50);  // e.g. 'PRJ-2026-CLOUD-01'
      description : String(100);
      projectCode : String(50);
}

entity InternalOrders {
  key code        : String(50);  // e.g. 'ORD-77001-FACILITY'
      description : String(100);
      companyCode : String(10);
}