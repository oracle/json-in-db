set echo on
set autotrace on explain
set pagesize 500 linesize 250 trimspool on
set long 10000000
--
drop index %SEARCH_INDEX_NAME% 
/
create search index %SEARCH_INDEX_NAME% 
   on %TABLE_NAME% (PO_DOCUMENT) 
      for json 
      parameters('sync (on commit) search_on none dataguide on')
/
select dbms_json.getdataguide(
                   USER,
                   '%TABLE_NAME%',
                   'PO_DOCUMENT',
                   DBMS_JSON.JSON_SCHEMA,
                   DBMS_JSON.PRETTY
                 ) DATA_GUIDE 
  from dual
/
select dbms_json.getdataguide(
                   USER,
                   '%TABLE_NAME%',
                   'PO_DOCUMENT',
                   DBMS_JSON.JSON_RELATIONAL,
                   DBMS_JSON.PRETTY
                 ) DATA_GUIDE 
  from dual
/
call dbms_json.createviewonpath(
                '%VIEW_NAME%',
                '%TABLE_NAME%',
                'PO_DOCUMENT','$'
              )
/
desc %VIEW_NAME%
--
begin
  dbms_json.rename(
     '%TABLE_NAME%', 'PO_DOCUMENT', 
     '$.PONumber', dbms_json.JSON_NUMBER, 'PO_NUMBER');
  dbms_json.rename(
    '%TABLE_NAME%', 'PO_DOCUMENT', 
    '$.Reference', dbms_json.JSON_STRING, 'REFERENCE');
  dbms_json.rename(
    '%TABLE_NAME%', 'PO_DOCUMENT', 
    '$.LineItems.Part.UPCCode', dbms_json.JSON_NUMBER, 'UPC_CODE');
end;
/
call dbms_json.createviewonpath(
                '%VIEW_NAME%',
                '%TABLE_NAME%',
                'PO_DOCUMENT','$'
              )
/
desc %VIEW_NAME%
--
select REFERENCE 
  from %VIEW_NAME%
 where PO_NUMBER between 1600 and 1604
/

begin
  if DBMS_XDB.existsResource('/public/%VIEW_NAME%.sql') then
    DBMS_XDB.deleteResource('/public/%VIEW_NAME%.sql');
  end if;
  commit;
end;
/
call dbms_json.createviewonpath(
        VIEWNAME     => '%VIEW_NAME%',
        TABLENAME    => '%TABLE_NAME%',
        JCOLNAME     => 'PO_DOCUMENT',
        PATH         => '$',
        RESOURCEPATH => '/public/%VIEW_NAME%.sql'
     )
/
set long 10000 pages 0
select xdburitype('/public/%VIEW_NAME%.sql').getClob()
  from DUAL
/
quit