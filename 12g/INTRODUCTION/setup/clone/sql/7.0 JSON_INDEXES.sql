--
-- Statement 1
--
create unique index PO_NUMBER_IDX
    on %TABLE_NAME% (JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10) ERROR ON ERROR))
/
--
-- Statement 2
--
create bitmap index COSTCENTER_IDX 
    on %TABLE_NAME% (JSON_VALUE(PO_DOCUMENT,'$.CostCenter'))
/
--
-- Statement 3
--
create index ZIPCODE_IDX 
    on %TABLE_NAME% (JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.zipCode' returning NUMBER(5)))
/
--
-- Statement 4
--
set autotrace on explain
--
select sum(QUANTITY * UNITPRICE) TOTAL_COST
  from %TABLE_NAME%,
       JSON_TABLE(
         PO_DOCUMENT,
         '$.LineItems[*]'
         columns	
						QUANTITY       NUMBER(12,4)                 path '$.Quantity', 
            UNITPRICE      NUMBER(14,2)                 path '$.Part.UnitPrice' 
       )
 where JSON_VALUE(PO_DOCUMENT,'$.PONumber' returning NUMBER(10)) = 1600
/
--
-- Statement 5
--
select distinct JSON_VALUE(PO_DOCUMENT,'$.Requestor') REQUESTOR
  from %TABLE_NAME%
 where JSON_VALUE(PO_DOCUMENT,'$.CostCenter') = 'A110'
/
--
-- Statement 6
--
select JSON_VALUE(PO_DOCUMENT,'$.CostCenter' returning VARCHAR2(10)) COST_CENTER, count(*)
  from %TABLE_NAME% p
 where JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.zipCode' returning NUMBER(5)) between 98001 and 98999
 group by JSON_VALUE(PO_DOCUMENT,'$.CostCenter' returning VARCHAR2(10))
/
