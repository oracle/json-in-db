set echo on
spool reset.log
--
call XDB.DBMS_SODA_ADMIN.drop_Collection('MyCollection')
/
call XDB.DBMS_SODA_ADMIN.drop_Collection('MyCustomCollection')
/
quit