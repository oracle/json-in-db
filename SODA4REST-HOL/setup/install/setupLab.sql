set echo on
spool setupDemo.log
--
def USERNAME = &1
--
def PASSWORD = &2
--
grant connect, resource to &USERNAME identified by &PASSWORD
/
alter user &USERNAME account unlock
/
grant UNLIMITED TABLESPACE to &USERNAME
/
grant CREATE ANY DIRECTORY, DROP ANY DIRECTORY to &USERNAME
/
grant CREATE VIEW to &USERNAME
/
grant SELECT_CATALOG_ROLE to &USERNAME
/
grant SELECT ANY DICTIONARY to &USERNAME
/
grant CTXAPP to &USERNAME
/
quit
