set echo on
spool reset.log
--
declare
  cursor getTable
  is
  select TABLE_NAME
    from USER_TABLES
   where TABLE_NAME in ( '%TABLE_NAME%', '%EXTERNAL_TABLE_NAME%');
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
set echo on
spool reset.log
--
CREATE TABLE %EXTERNAL_TABLE_NAME%(
  JSON_DOCUMENT CLOB
)
ORGANIZATION EXTERNAL(
   TYPE ORACLE_LOADER
   DEFAULT DIRECTORY ORDER_ENTRY
   ACCESS PARAMETERS (
      RECORDS DELIMITED BY 0x'0A'
      DISABLE_DIRECTORY_LINK_CHECK  
      BADFILE JSON_LOADER_OUTPUT: '%EXTERNAL_TABLE_NAME%.bad'
      LOGFILE JSON_LOADER_OUTPUT: '%EXTERNAL_TABLE_NAME%.log'
      FIELDS(
        JSON_DOCUMENT CHAR(5000)
      ) 
   )
   LOCATION (
     ORDER_ENTRY:'PurchaseOrders.dmp'
   )
)
PARALLEL
REJECT LIMIT UNLIMITED
/
create table %TABLE_NAME% (
  ID            RAW(16) NOT NULL,
  DATE_LOADED   TIMESTAMP(6) WITH TIME ZONE,
  PO_DOCUMENT CLOB CHECK (PO_DOCUMENT IS JSON)
)
/
insert  
  into %TABLE_NAME%
select SYS_GUID(), SYSTIMESTAMP, JSON_DOCUMENT 
  from %EXTERNAL_TABLE_NAME%
 where JSON_DOCUMENT IS JSON
/
commit
/
create or replace view EMPLOYEE_NAME_VALUE
as
select EMPLOYEE_ID as ID, 'EmployeeId' as NAME, to_char(EMPLOYEE_ID) as VALUE
  from HR.EMPLOYEES
union all
select EMPLOYEE_ID as ID, 'FirstName' as NAME, FIRST_NAME as VALUE
  from HR.EMPLOYEES
union all
select EMPLOYEE_ID as ID, 'LastName' as NAME, LAST_NAME as VALUE
  from HR.EMPLOYEES
union all
select EMPLOYEE_ID as ID, 'EmailAddress' as NAME, EMAIL as VALUE
  from HR.EMPLOYEES
union all
select EMPLOYEE_ID as ID, 'TelephoneNumber' as NAME, PHONE_NUMBER as VALUE
  from HR.EMPLOYEES
union all
select EMPLOYEE_ID as ID , 'HireDate' as NAME, to_char(HIRE_DATE) as VALUE
  from HR.EMPLOYEES
union all
select EMPLOYEE_ID as ID, 'JobId' as NAME, JOB_ID as VALUE
  from HR.EMPLOYEES
union all
select EMPLOYEE_ID as ID, 'Salary' as NAME, to_char(SALARY) as VALUE
  from HR.EMPLOYEES
union all
select EMPLOYEE_ID as ID, 'Commision' as NAME, to_char(COMMISSION_PCT) as VALUE
  from HR.EMPLOYEES
union all
select EMPLOYEE_ID as ID, 'ManagerId' as NAME, to_char(MANAGER_ID) as VALUE
  from HR.EMPLOYEES
union all
select EMPLOYEE_ID as ID, 'DepartmentId' as NAME, to_char(DEPARTMENT_ID) as VALUE
  from HR.EMPLOYEES
/
quit