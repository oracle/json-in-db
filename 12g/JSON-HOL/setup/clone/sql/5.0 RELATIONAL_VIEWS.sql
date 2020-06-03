--
-- Statement 1
--
create or replace view %TABLE_NAME%_MASTER_VIEW
as
select m.* 
 from %TABLE_NAME% p,
      JSON_TABLE(
        p.PO_DOCUMENT,
        '$'
        columns
          PO_NUMBER        NUMBER(10)          path '$.PONumber',
          REFERENCE        VARCHAR2(30 CHAR)   path '$.Reference',
          REQUESTOR        VARCHAR2(128 CHAR ) path '$.Requestor',
          USERID           VARCHAR2(10 CHAR)   path '$.User',
          COSTCENTER       VARCHAR2(16)        path '$.CostCenter',
          SHIP_TO_NAME     VARCHAR2(20 CHAR)   path '$.ShippingInstructions.name',
          SHIP_TO_STREET   VARCHAR2(32 CHAR)   path '$.ShippingInstructions.Address.street',
          SHIP_TO_CITY     VARCHAR2(32 CHAR)   path '$.ShippingInstructions.Address.city',
          SHIP_TO_COUNTY   VARCHAR2(32 CHAR)   path '$.ShippingInstructions.Address.county',
          SHIP_TO_POSTCODE VARCHAR2(32 CHAR)   path '$.ShippingInstructions.Address.postcode',
          SHIP_TO_STATE    VARCHAR2(2 CHAR)    path '$.ShippingInstructions.Address.state',
          SHIP_TO_PROVINCE VARCHAR2(2 CHAR)    path '$.ShippingInstructions.Address.province',
          SHIP_TO_ZIP      VARCHAR2(8 CHAR)    path '$.ShippingInstructions.Address.zipCode',
          SHIP_TO_COUNTRY  VARCHAR2(32 CHAR)   path '$.ShippingInstructions.Address.country',
          SHIP_TO_PHONE    VARCHAR2(24 CHAR)   path '$.ShippingInstructions.Phone[0].number',
          INSTRUCTIONS     VARCHAR2(2048 CHAR) path '$.SpecialInstructions'
      ) m
/
--
-- Statement 2
--
create or replace view %TABLE_NAME%_DETAIL_VIEW
as
select D.*
  from %TABLE_NAME% p,
       JSON_TABLE(
         p.PO_DOCUMENT,
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
--                                                                                                                                                                                           
--
-- Simple Predicates
--                                                                                                                                                                                     
select SHIP_TO_STREET, SHIP_TO_CITY, SHIP_TO_STATE, SHIP_TO_ZIP                                                                                                                                                                            
  from %TABLE_NAME%_MASTER_VIEW
 where PO_NUMBER = 1600                                                                                                                                                           
/                                                                                                                                                                                            
select PO_NUMBER, REFERENCE, SHIP_TO_PHONE, DESCRIPTION, QUANTITY, UNITPRICE                                                                                                                                                                                     
  from %TABLE_NAME%_DETAIL_VIEW                                                                                                                                                             
 where UPCCODE = '97361551647'                                                                                                                                                                
/                                                                                                                                                                                            
select PO_NUMBER, REFERENCE, SHIP_TO_PHONE, QUANTITY, DESCRIPTION, UNITPRICE                                                                                                                                                                                     
  from %TABLE_NAME%_DETAIL_VIEW                                                                                                                             
 where UPCCODE in ('717951010490', '43396713994', '12236123248')  
 order by PO_NUMBER                                                                                                                       
/                                                                                                                                                                                            
-- 
-- Relational Group by Queries
--                                                                                                                                                                                           
select COSTCENTER, count(*)                                                                                                                                                                  
  From %TABLE_NAME%_MASTER_VIEW                                                                                                                                                             
  group by COSTCENTER                                                                                                                                                                        
  order by COSTCENTER
/                                                                                                                                                                                            
select COSTCENTER, sum (QUANTITY * UNITPRICE) TOTAL_VALUE                                                                                                                                                           
  from %TABLE_NAME%_DETAIL_VIEW                                                                                                                              
 group by COSTCENTER                                                                                                                                                                         
/       
--
-- Multiple Predicates
--                                                                                                                                                                                     
select PO_NUMBER, REFERENCE, INSTRUCTIONS, ITEMNO, UPCCODE, DESCRIPTION, QUANTITY, UNITPRICE                                                                                                           
  from %TABLE_NAME%_DETAIL_VIEW d                                                                                                                              
 where REQUESTOR = 'Steven King'                                                                                                                                                           
   and QUANTITY  > 7                                                                                                                                                                       
   and UNITPRICE > 25.00                                                                                                                                                                   
/                                                                                                                                                                                            
--                                                                                                                                                                                           
-- SQL Analytics                                                                                                                                      
--                                                                                                                                                                                           
select UPCCODE, count(*) "Orders", Quantity "Copies"                                                                                                                                          
  from %TABLE_NAME%_DETAIL_VIEW                                                                                                                                                             
 where UPCCODE in ('717951010490', '43396713994', '12236123248')                                                                                                                              
 group by rollup(UPCCODE, QUANTITY)                                                                                                                                                           
/                                                                                                                                                                                            
select UPCCODE, PO_NUMBER, REFERENCE, QUANTITY, QUANTITY - LAG(QUANTITY,1,QUANTITY) over (ORDER BY PO_NUMBER) as DIFFERENCE                                             
  from %TABLE_NAME%_DETAIL_VIEW                                                                                                                                                             
 where UPCCODE = '43396713994'                                                                                                                                                                
 order by PO_NUMBER DESC                                                                                                                                   
/                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                