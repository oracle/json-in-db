--
-- Query 1
--
select count(*)
  from J_PURCHASEORDER
 where JSON_EXISTS(PO_DOCUMENT,'$.ShippingInstructions.Address.state')
/
--
-- Query 2 : Analysis of documents by county.
--
select JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.county' returning VARCHAR2(10)) COUNTY,
       count(*)
  from J_PURCHASEORDER
 group by JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.county' returning VARCHAR2(10))
/
--
-- Query 3 : Analysis of documents by county. JSON_VALUE with NOT NULL test
--
select JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.county' returning VARCHAR2(10)) COUNTY,
       count(*)
  from J_PURCHASEORDER
 where JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.county' returning VARCHAR2(10)) is not null
 group by JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.county' returning VARCHAR2(10) )
/
--
-- Query 4 : Analysis of documents by county. JSON_EXISTS
--
select JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.county' returning VARCHAR2(10)) COUNTY,
       count(*)
  from J_PURCHASEORDER
 where JSON_EXISTS(PO_DOCUMENT,'$.ShippingInstructions.Address.county')
 group by JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.county' returning VARCHAR2(10))
/