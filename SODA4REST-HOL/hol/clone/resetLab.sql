set echo on
spool reset.log
--
call DBMS_SODA_ADMIN.dropCollection('MyCollection')
/
call DBMS_SODA_ADMIN.dropCollection('MyCustomCollection')
/
quit