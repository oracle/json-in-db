set echo on
spool testcase.log
--
connect sys/ as sysdba
--
set define on
set timing on
--
def USERNAME = JSON1
--
def PASSWORD = oracle
--
def USER_TABLESPACE = USERS
--
def TEMP_TABLESPACE = TEMP
--
grant create any directory, drop any directory, connect, resource, alter session, create view, unlimited tablespace to &USERNAME identified by &PASSWORD
/
alter user &USERNAME default tablespace &USER_TABLESPACE temporary tablespace &TEMP_TABLESPACE
/
grant CTXAPP to &USERNAME
/
--
@../setup/setup.sql &USERNAME &PASSWORD
--
spool testcase.log APPEND
--
connect &USERNAME/&PASSWORD
--
column CostCenter FORMAT A10
column COST_CENTER FORMAT A10
--
set long 100000 pages 40 lines 256 trimspool on timing on headings on
--
@"../sql/1.0 CREATE_TABLE.sql"
--
@"../sql/1.1 SIMPLE_QUERIES.sql"
--
@"../sql/2.0 JSON_VALUE.sql"
--
@"../sql/3.0 JSON_QUERY.sql"
--
@"../sql/4.0 JSON_TABLE.sql"
--
@"../sql/5.0 RELATIONAL_VIEWS.sql"
--
@"../sql/6.0 JSON_EXISTS.sql"
--
set autotrace on explain
--
@"../sql/7.0 JSON_INDEXES.sql"
--
@"../sql/8.0 JSON_DOCUMENT_INDEX.sql"
--
quit