set echo on
set define off
set pages 100 lines 256 trimspool on
set autotrace on explain
--
create search Index %SEARCH_INDEX_NAME%  
    on %TABLE_NAME%  (PO_DOCUMENT) 
       for json --  
       parameters ('sync (on commit) SEARCH_ON TEXT_VALUE')
/
select j.PO_DOCUMENT
  from %TABLE_NAME%  j
 where JSON_EXISTS(
         PO_DOCUMENT,
         '$?(@.PONumber == $PO_NUMBER)' 
         passing 1600 as  "PO_NUMBER"
       )
/
select j.PO_DOCUMENT.PONumber PO_NUMBER
  from %TABLE_NAME%  j
 where JSON_EXISTS(
         PO_DOCUMENT,
         '$?(@.LineItems.Part.UPCCode == $UPC)' 
         passing 13131092899 as "UPC"
       )
/
select count(*)
  from %TABLE_NAME%  j
 where JSON_EXISTS(
         PO_DOCUMENT,
         '$?(@.User == $USR && @.LineItems.Quantity > $QUANTITY)' 
         passing 'AKHOO' as "USR", 8 as "QUANTITY"
       )
/
select j.PO_DOCUMENT.PONumber PO_NUMBER
  from %TABLE_NAME%  j
 where JSON_EXISTS(
         PO_DOCUMENT,
         '$?(@.User == $USR && exists(@.LineItems?(@.Part.UPCCode == $UPC && @.Quantity > $QUANTITY)))' 
         passing 'AKHOO' as "USR", 43396087798 as "UPC", 8 as "QUANTITY"
       )
/
quit
