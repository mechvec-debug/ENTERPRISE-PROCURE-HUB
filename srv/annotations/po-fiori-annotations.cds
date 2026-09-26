using { ProcurementService as srv } from '../procurement-service';

annotate srv.PurchaseOrders with {
  poNumber           @readonly;
  status             @readonly;
  transmissionStatus @readonly;
  totalAmount        @readonly;
};

annotate srv.PurchaseOrders with @(
  UI.HeaderInfo: {
    TypeName: 'Purchase Order',
    TypeNamePlural: 'Purchase Orders',
    Title: { Value: poNumber },
    Description: { Value: supplierName }
  },
  UI.HeaderFacets: [
    {
      $Type: 'UI.ReferenceFacet',
      Target: '@UI.DataPoint#POStatus'
    },
    {
      $Type: 'UI.ReferenceFacet',
      Target: '@UI.DataPoint#POTransmission'
    },
    {
      $Type: 'UI.ReferenceFacet',
      Target: '@UI.DataPoint#POTotal'
    }
  ],
  UI.DataPoint #POStatus: {
    Value: status,
    Title: 'PO Status'
  },
  UI.DataPoint #POTransmission: {
    Value: transmissionStatus,
    Title: 'Transmission Status'
  },
  UI.DataPoint #POTotal: {
    Value: totalAmount,
    Title: 'Total Net Value'
  },
  UI.SelectionFields: [ poNumber, supplierNumber, status, companyCode ],
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: poNumber, Label: 'PO Number' },
    { $Type: 'UI.DataField', Value: poDocType, Label: 'Doc Type' },
    { $Type: 'UI.DataField', Value: supplierNumber, Label: 'Supplier ID' },
    { $Type: 'UI.DataField', Value: supplierName, Label: 'Supplier Name' },
    { $Type: 'UI.DataField', Value: status, Label: 'Status' },
    { $Type: 'UI.DataField', Value: transmissionStatus, Label: 'Dispatch Status' },
    { $Type: 'UI.DataField', Value: totalAmount, Label: 'Net Value' },
    { $Type: 'UI.DataField', Value: currency, Label: 'Currency' }
  ],
  UI.Facets: [
    {
      $Type: 'UI.CollectionFacet',
      ID: 'HeaderSection',
      Label: 'Header Data',
      Facets: [
        {
          $Type: 'UI.ReferenceFacet',
          ID: 'GeneralFacet',
          Label: 'General Information',
          Target: '@UI.FieldGroup#GeneralData'
        },
        {
          $Type: 'UI.ReferenceFacet',
          ID: 'OrgFacet',
          Label: 'Org Data',
          Target: '@UI.FieldGroup#OrgData'
        },
        {
          $Type: 'UI.ReferenceFacet',
          ID: 'StatusFacet',
          Label: 'PO Status & Dispatch',
          Target: '@UI.FieldGroup#StatusData'
        }
      ]
    },
    {
      $Type: 'UI.ReferenceFacet',
      ID: 'ItemsFacet',
      Label: 'Item Overview & Line Details',
      Target: 'items/@UI.LineItem'
    }
  ],
  UI.FieldGroup #GeneralData: {
    Data: [
      { Value: poNumber, Label: 'Purchase Order' },
      { Value: poDocType, Label: 'Document Type' },
      { Value: supplierNumber, Label: 'Supplier Number' },
      { Value: supplierName, Label: 'Supplier Name' }
    ]
  },
  UI.FieldGroup #OrgData: {
    Data: [
      { Value: companyCode, Label: 'Company Code' },
      { Value: purchasingOrg, Label: 'Purchasing Organization' },
      { Value: purchasingGroup, Label: 'Purchasing Group' }
    ]
  },
  UI.FieldGroup #StatusData: {
    Data: [
      { Value: status, Label: 'Status' },
      { Value: transmissionStatus, Label: 'Transmission Status' },
      { Value: totalAmount, Label: 'Total Net Value' },
      { Value: currency, Label: 'Document Currency' }
    ]
  }
);

// Complete Inline Table for Purchase Order Items
annotate srv.PurchaseOrderItems with @(
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: itemNumber, Label: 'Item #' },
    { $Type: 'UI.DataField', Value: accAssignmentCategory, Label: 'Acct Assgt' },
    { $Type: 'UI.DataField', Value: shortText, Label: 'Short Text' },
    { $Type: 'UI.DataField', Value: materialGroup, Label: 'Material Group' },
    { $Type: 'UI.DataField', Value: plant, Label: 'Plant' },
    { $Type: 'UI.DataField', Value: quantity, Label: 'PO Quantity' },
    { $Type: 'UI.DataField', Value: unitOfMeasure, Label: 'Order Unit' },
    { $Type: 'UI.DataField', Value: netPrice, Label: 'Net Price' },
    { $Type: 'UI.DataField', Value: currency, Label: 'Currency' },
    { $Type: 'UI.DataField', Value: deliveryDate, Label: 'Delivery Date' },
    { $Type: 'UI.DataField', Value: referencePR, Label: 'Ref. Shopping Cart' }
  ]
);