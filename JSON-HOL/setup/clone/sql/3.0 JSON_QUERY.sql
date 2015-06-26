--
-- Query 1
--
select JSON_QUERY(PO_DOCUMENT,'$.ShippingInstructions') SHIPPING_INSTRUCTIONS
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/
--
-- Query 2
--
select JSON_QUERY(PO_DOCUMENT,'$.LineItems') LINEITEMS
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/
--
-- Query 3
--
select JSON_QUERY(PO_DOCUMENT,'$.LineItems' PRETTY) LINEITEMS
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/
--
-- Query 4
--
select JSON_QUERY(PO_DOCUMENT,'$.LineItems[0]' PRETTY) LINEITEMS
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/
--
-- Query 5
--
select JSON_QUERY(PO_DOCUMENT,'$.LineItems[0].Part') PART
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/
--
-- Query 6
--
select JSON_QUERY(PO_DOCUMENT,'$.LineItems[0].Part.UPCCode') UPC_CODE
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/
--
-- Query 7
--
select JSON_QUERY(PO_DOCUMENT,'$.LineItems[0].Part.UPCCode' ERROR ON ERROR) UPC_CODE
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/
--
-- Query 8
--
select JSON_QUERY(PO_DOCUMENT,'$.LineItems[0].Part.UPCCode' EMPTY ON ERROR) UPC_CODE
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/
--
-- Query 9
--
select JSON_QUERY(PO_DOCUMENT,'$.LineItems[0].Part.UPCCode' WITH CONDITIONAL ARRAY WRAPPER) UPC_CODE
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/
--
-- Query 10
--
select JSON_QUERY(PO_DOCUMENT,'$.LineItems[*].Part.*' WITH ARRAY WRAPPER ) PART
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/