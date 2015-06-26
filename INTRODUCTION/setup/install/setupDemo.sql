set echo on
spool setupDemo.log
--
def USERNAME = &1
--
def PASSWORD = &2
--
def TNSALIAS = &3
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
VAR ORACLE_HOME VARCHAR2(100)
--
begin
	sys.dbms_system.get_env('ORACLE_HOME', :ORACLE_HOME) ;
end;
/
column ORACLE_HOME  new_value ORACLE_HOME 
--
select :ORACLE_HOME ORACLE_HOME
  from dual
/
def ORACLE_HOME
--
column ORACLE_TRACE new_value ORACLE_TRACE
--
select VALUE ORACLE_TRACE
  from V$DIAG_INFO 
 where NAME = 'Diag Trace' 
/ 
--
connect &USERNAME/&PASSWORD@&TNSALIAS
--
create or replace directory ORDER_ENTRY as '&ORACLE_HOME/demo/schema/order_entry'
/
create or replace directory JSON_LOADER_OUTPUT as '&ORACLE_TRACE'
/
quit
