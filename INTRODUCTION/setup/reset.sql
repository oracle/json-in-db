set echo on
spool reset.log
--
declare
  cursor getTable
  is
  select TABLE_NAME
    from USER_TABLES
   where TABLE_NAME in ( 'J_PURCHASEORDER', 'JSON_DUMPFILE_CONTENTS');
begin
  for t in getTable() loop
    execute immediate 'DROP TABLE "' || t.TABLE_NAME || '" PURGE';
  end loop;
end;
/
purge recyclebin
/
select DIRECTORY_PATH 
  from ALL_DIRECTORIES
 where DIRECTORY_NAME in ('ORDER_ENTRY','JSON_LOADER_OUTPUT')
/
