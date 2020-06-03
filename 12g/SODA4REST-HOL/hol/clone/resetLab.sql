set echo on
spool reset.log
--
call XDB.DBMS_SODA_ADMIN.drop_Collection('MyCollection')
/
call XDB.DBMS_SODA_ADMIN.drop_Collection('MyCustomCollection')
/
exec ords.enable_schema;
/
exec ords.delete_privilege_mapping('oracle.soda.privilege.developer', '/soda/*');
/
quit
