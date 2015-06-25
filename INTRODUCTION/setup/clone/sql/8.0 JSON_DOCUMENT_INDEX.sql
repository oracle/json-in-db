set echo on
set autotrace on explain
set pagesize 50 linesize 250 trimspool on
--
-- Statement 1 : Create the Index
--
create index PO_DOCUMENT_INDEX 
    on %TABLE_NAME%(PO_DOCUMENT) 
       indextype is ctxsys.context 
       parameters('section group CTXSYS.JSON_SECTION_GROUP sync (on commit)')
/
--
-- Query 1 : Use existing functional index on REFERENCE
--
select count(*), sum(QUANTITY * UNITPRICE) TOTAL_COST
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
-- Query 2 : Use docoument index since city is not explicitly indexed.
--
select count(*), sum(QUANTITY * UNITPRICE) TOTAL_COST
  from %TABLE_NAME%,
       JSON_TABLE(
         PO_DOCUMENT,
         '$.LineItems[*]'
         columns	
						QUANTITY       NUMBER(12,4)                 path '$.Quantity', 
            UNITPRICE      NUMBER(14,2)                 path '$.Part.UnitPrice' 
       )
 where JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.city') = 'Seattle'
/
--
-- Query 3 : Use document index combined with functional BITMAP index on CostCenter
--
select count(*), sum(QUANTITY * UNITPRICE) TOTAL_COST
  from %TABLE_NAME%,
       JSON_TABLE(
         PO_DOCUMENT,
         '$.LineItems[*]'
         columns	
						QUANTITY       NUMBER(12,4)                 path '$.Quantity', 
            UNITPRICE      NUMBER(14,2)                 path '$.Part.UnitPrice' 
       )
 where JSON_VALUE(PO_DOCUMENT,'$.ShippingInstructions.Address.city') = 'Seattle'
   and JSON_VALUE(PO_DOCUMENT,'$.CostCenter') = 'A90'
/