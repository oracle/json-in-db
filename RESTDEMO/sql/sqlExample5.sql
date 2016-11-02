
/* ================================================  
 *    
 * Copyright (c) 2016 Oracle and/or its affiliates.  All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * ================================================
 */

create or replace view PURCHASEORDER_DETAIL_VIEW 
as 
select D.* 
  from "%TABLE_NAME%" p,
       JSON_TABLE(
         p.JSON_DOCUMENT,
         '$'
         columns (
           PO_NUMBER        NUMBER(10)                  path '$.PONumber',
           REFERENCE        VARCHAR2(30 CHAR)           path '$.Reference',
           REQUESTOR        VARCHAR2(128 CHAR )         path '$.Requestor',
           USERID           VARCHAR2(10 CHAR)           path '$.User',
           COSTCENTER       VARCHAR2(16)                path '$.CostCenter',
           SHIP_TO_NAME     VARCHAR2(20 CHAR)           path '$.ShippingInstructions.name',
           SHIP_TO_STREET   VARCHAR2(32 CHAR)           path '$.ShippingInstructions.Address.street',
           SHIP_TO_CITY     VARCHAR2(32 CHAR)           path '$.ShippingInstructions.Address.city',
           SHIP_TO_COUNTY   VARCHAR2(32 CHAR)           path '$.ShippingInstructions.Address.county',
           SHIP_TO_POSTCODE VARCHAR2(10 CHAR)           path '$.ShippingInstructions.Address.postcode',
           SHIP_TO_STATE    VARCHAR2(2 CHAR)            path '$.ShippingInstructions.Address.state',
           SHIP_TO_PROVINCE VARCHAR2(2 CHAR)            path '$.ShippingInstructions.Address.province',
           SHIP_TO_ZIP      VARCHAR2(8 CHAR)            path '$.ShippingInstructions.Address.zipCode',
           SHIP_TO_COUNTRY  VARCHAR2(32 CHAR)           path '$.ShippingInstructions.Address.country',
           SHIP_TO_PHONE    VARCHAR2(24 CHAR)           path '$.ShippingInstructions.Phone[0].number',
           INSTRUCTIONS     VARCHAR2(2048 CHAR)         path '$.SpecialInstructions',
           NESTED PATH '$.LineItems[*]'
           columns (
             ITEMNO         NUMBER(38)                   path '$.ItemNumber', 
             DESCRIPTION    VARCHAR2(256 CHAR)           path '$.Part.Description', 
             UPCCODE        VARCHAR2(14 CHAR)            path '$.Part.UPCCode', 
             QUANTITY       NUMBER(12,4)                 path '$.Quantity', 
             UNITPRICE      NUMBER(14,2)                 path '$.Part.UnitPrice'
           )
         )
       )  d        
/
