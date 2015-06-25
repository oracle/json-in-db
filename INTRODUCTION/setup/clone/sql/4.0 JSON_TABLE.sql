--
-- Query 1.
--
select M.* 
  from %TABLE_NAME% p,
       JSON_TABLE(
         p.PO_DOCUMENT,
         '$' 
         columns
           PO_NUMBER            NUMBER(10)                  path  '$.PONumber',
           REFERENCE            VARCHAR2(30 CHAR)           path  '$.Reference',
           REQUESTOR            VARCHAR2(32 CHAR)           path  '$.Requestor',
           USERID               VARCHAR2(10 CHAR)           path  '$.User',
           COSTCENTER           VARCHAR2(16)                path  '$.CostCenter'
       ) M
 where PO_NUMBER between 1600 and 1604
/
--
-- Query 2.
--
select D.*
  from %TABLE_NAME% p,
       JSON_TABLE(
         p.PO_DOCUMENT,
         '$' 
         columns(
           PO_NUMBER            NUMBER(10)                  path  '$.PONumber',
           REFERENCE            VARCHAR2(30 CHAR)           path  '$.Reference',
           REQUESTOR            VARCHAR2(32 CHAR)           path  '$.Requestor',
           USERID               VARCHAR2(10 CHAR)           path  '$.User',
           COSTCENTER           VARCHAR2(16)                path  '$.CostCenter',
           NESTED PATH '$.LineItems[*]'
           columns(
             ITEMNO         NUMBER(16)             path '$.ItemNumber', 
             DESCRIPTION    VARCHAR2(32 CHAR)      path '$.Part.Description', 
             UPCCODE        VARCHAR2(14 CHAR)      path '$.Part.UPCCode', 
             QUANTITY       NUMBER(5,4)            path '$.Quantity', 
             UNITPRICE      NUMBER(5,2)            path '$.Part.UnitPrice'
           )
         )
       ) D
 where PO_NUMBER = 1600  
/
/*
**
** 12.1.0.2.0 Legacy JSON_TABLE chaining syntax. Uses JSON_TABLE chaining syntax. 
**
select PO_NUMBER, REFERENCE, REQUESTOR, USERID, COSTCENTER, D.*
  from %TABLE_NAME% p,
       JSON_TABLE(
         p.PO_DOCUMENT,
         '$' 
         columns
           PO_NUMBER            NUMBER(10)                  path  '$.PONumber',
           REFERENCE            VARCHAR2(30 CHAR)           path  '$.Reference',
           REQUESTOR            VARCHAR2(32 CHAR)           path  '$.Requestor',
           USERID               VARCHAR2(10 CHAR)           path  '$.User',
           COSTCENTER           VARCHAR2(16)                path  '$.CostCenter',
           LINEITEMS            VARCHAR2(4000) FORMAT JSON  path  '$.LineItems'
       ) M,
       JSON_TABLE(
         m.LINEITEMS,
         '$[*]'
         columns
           ITEMNO         NUMBER(16)             path '$.ItemNumber', 
           DESCRIPTION    VARCHAR2(32 CHAR)      path '$.Part.Description', 
           UPCCODE        VARCHAR2(14 CHAR)      path '$.Part.UPCCode', 
           QUANTITY       NUMBER(5,4)            path '$.Quantity', 
           UNITPRICE      NUMBER(5,2)            path '$.Part.UnitPrice'
       ) D
 where PO_NUMBER = 1600  
/
**
*/
