--
-- Query 1: Select the document where the PONumber key contains the value 1600 
--
select j.PO_DOCUMENT
  from %TABLE_NAME% j
 where j.PO_DOCUMENT.PONumber = 1600
/
--
-- Query 2: Select the value of the Requestor key where the PONumber key contains the value 1600 
--
select j.PO_DOCUMENT.Requestor
  from %TABLE_NAME% j
 where j.PO_DOCUMENT.PONumber = 1600
/
--
-- Query 3: Group, Count and Order by the value of the CostCenter key
--
select j.PO_DOCUMENT.CostCenter, count(*)
  from %TABLE_NAME% j
 group by j.PO_DOCUMENT.CostCenter 
 order by j.PO_DOCUMENT.CostCenter
/
--
-- Query 4: Select multiple values including values from nested objects
--
select j.PO_DOCUMENT.Reference,
       j.PO_DOCUMENT.Requestor,
       j.PO_DOCUMENT.CostCenter,
       j.PO_DOCUMENT.ShippingInstructions.Address.city
  from %TABLE_NAME% j
/
--
-- Query 4. : Select a key whose value is a non-scalar value
--
select j.PO_DOCUMENT.ShippingInstructions.Address
  from %TABLE_NAME% j
 where j.PO_DOCUMENT.PONumber = 1600
/
