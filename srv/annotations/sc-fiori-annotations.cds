using { ProcurementService as srv } from '../procurement-service';

annotate srv.ShoppingCarts with {
  totalAmount @readonly;
  status      @readonly;
  poNumber    @readonly;
};

annotate srv.ShoppingCarts with @(
  UI.HeaderInfo: {
    TypeName: 'Shopping Cart',
    TypeNamePlural: 'Shopping Carts',
    Title: { Value: cartNumber },
    Description: { Value: profileName }
  },
  UI.HeaderFacets: [
    {
      $Type: 'UI.ReferenceFacet',
      Target: '@UI.DataPoint#CartStatus'
    },
    {
      $Type: 'UI.ReferenceFacet',
      Target: '@UI.DataPoint#CartTotal'
    }
  ],
  UI.DataPoint #CartStatus: {
    Value: status,
    Title: 'Shopping Cart Status'
  },
  UI.DataPoint #CartTotal: {
    Value: totalAmount,
    Title: 'Total Amount'
  },
  UI.SelectionFields: [ cartNumber, status, approver ],
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: cartNumber, Label: 'Cart ID' },
    { $Type: 'UI.DataField', Value: status, Label: 'Status' },
    { $Type: 'UI.DataField', Value: poNumber, Label: 'Purchase Order' },
    { $Type: 'UI.DataField', Value: profileName, Label: 'Profile Name' },
    { $Type: 'UI.DataField', Value: companyCode, Label: 'Company Code' },
    { $Type: 'UI.DataField', Value: plant, Label: 'Plant' },
    { $Type: 'UI.DataField', Value: costCenter, Label: 'Cost Center' },
    { $Type: 'UI.DataField', Value: totalAmount, Label: 'Total Amount' },
    { $Type: 'UI.DataField', Value: currency, Label: 'Currency' }
  ],
  UI.Facets: [
    {
      $Type: 'UI.ReferenceFacet',
      ID: 'HeaderDetailsFacet',
      Label: 'Header Information',
      Target: '@UI.FieldGroup#HeaderDetails'
    },
    {
      $Type: 'UI.ReferenceFacet',
      ID: 'CartItemsFacet',
      Label: 'Line Items',
      Target: 'items/@UI.LineItem'
    }
  ],
  UI.FieldGroup #HeaderDetails: {
    Data: [
      { Value: cartNumber, Label: 'Cart Number' },
      { Value: status, Label: 'Approval Status' },
      { Value: poNumber, Label: 'SAP Purchase Order' },
      { Value: profileName, Label: 'Profile Name' },
      { Value: companyCode, Label: 'Company Code' },
      { Value: plant, Label: 'Plant' },
      { Value: costCenter, Label: 'Cost Center' },
      { Value: approver, Label: 'Approver' },
      { Value: totalAmount, Label: 'Total Amount' },
      { Value: currency, Label: 'Currency' }
    ]
  }
);

// Complete Inline Table for Cart Items
annotate srv.CartItems with @(
  Common.SideEffects #ItemChanged: {
    SourceProperties: [ 'quantity', 'netPrice' ],
    TargetProperties: [ 'parent/totalAmount' ]
  },
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: itemNumber, Label: 'Item #' },
    { $Type: 'UI.DataField', Value: shortText, Label: 'Description' },
    { $Type: 'UI.DataField', Value: materialGroup, Label: 'Material Group' },
    { $Type: 'UI.DataField', Value: quantity, Label: 'Quantity' },
    { $Type: 'UI.DataField', Value: unitOfMeasure, Label: 'Unit' },
    { $Type: 'UI.DataField', Value: netPrice, Label: 'Net Price' },
    { $Type: 'UI.DataField', Value: currency, Label: 'Currency' },
    { $Type: 'UI.DataField', Value: deliveryDate, Label: 'Delivery Date' },
    { $Type: 'UI.DataField', Value: supplier, Label: 'Supplier' },
    { $Type: 'UI.DataField', Value: accountingObj, Label: 'Cost Center' }
  ]
);