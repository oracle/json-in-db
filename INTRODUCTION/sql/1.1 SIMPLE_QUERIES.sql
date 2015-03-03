--
-- Query 1.
--
select j.PO_DOCUMENT.CostCenter, count(*)
  from J_PURCHASEORDER j
 group by j.PO_DOCUMENT.CostCenter 
 order by j.PO_DOCUMENT.CostCenter
/
--
-- Query 2.
--
select j.PO_DOCUMENT
  from J_PURCHASEORDER j
 where j.PO_DOCUMENT.PONumber = 1600
/
--
-- Query 3.
--
select j.PO_DOCUMENT.Reference,
       j.PO_DOCUMENT.Requestor,
       j.PO_DOCUMENT.CostCenter,
       j.PO_DOCUMENT.ShippingInstructions.Address.city
  from J_PURCHASEORDER j
 where j.PO_DOCUMENT.PONumber = 1600
/
--
-- Query 4.
--
select j.PO_DOCUMENT.ShippingInstructions.Address
  from J_PURCHASEORDER j
 where j.PO_DOCUMENT.PONumber = 1600
/
