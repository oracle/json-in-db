set echo on
--
desc %TABLE_NAME%
--
drop index %SEARCH_INDEX_NAME% 
/
create search index  %SEARCH_INDEX_NAME%  
   on %TABLE_NAME% (PO_DOCUMENT) for json 
      parameters('sync (on commit) search_on none dataguide on change add_vc')
/
desc %TABLE_NAME%
--
select "PO_DOCUMENT$PONumber",
       "PO_DOCUMENT$User"
  from %TABLE_NAME%
 where "PO_DOCUMENT$PONumber" between 1600 and 1604
/
insert into %TABLE_NAME% (ID, DATE_LOADED, PO_DOCUMENT)
values (SYS_GUID(),SYSTIMESTAMP,'{"NewKey1":1,"NewKey2":"AAAA"}')
/
commit
/
desc %TABLE_NAME%
--
quit