set echo on
spool installFromJar.log
--
def USERNAME = &1
--
def PASSWORD = &2
--
def OWNER=DBJSON
--
connect &USERNAME/&PASSWORD
--
drop user &OWNER cascade
/
create user &OWNER identified by &OWNER account lock
/
grant unlimited tablespace to &OWNER
/
select '&_CONNECT_IDENTIFIER'
  from DUAL
/
host loadjava -user &USERNAME/&PASSWORD@&_CONNECT_IDENTIFIER -schema &OWNER -grant PUBLIC -oci -v -fileout javax.json-1.0.4.log javax.json-1.0.4.jar 
--
get javax.json-1.0.4.log
.
host loadjava -user &USERNAME/&PASSWORD@&_CONNECT_IDENTIFIER -schema &OWNER -grant PUBLIC -oci -v -fileout orajsoda.log orajsoda.jar
--
get orajsoda.log
.
host loadjava -user &USERNAME/&PASSWORD@&_CONNECT_IDENTIFIER -schema &OWNER -grant PUBLIC -oci -v -fileout orarestsoda.log orarestsoda.jar 
--
get orarestsoda.log
.
--
set serveroutput on
--
alter session set current_schema = &OWNER
/
DEF CLASS_PATH = oracle/json
--
select NAME
  from DBA_JAVA_CLASSES
 where OWNER = '&OWNER'
   and NAME like '&CLASS_PATH.%'
/
declare 
  cursor getClasses 
  is
	select NAME, dbms_java.shortname(NAME) SHORT_NAME
	  from DBA_JAVA_CLASSES
	 where OWNER = USER
	   and NAME like '&CLASS_PATH.%';
begin
  for c in getClasses() loop
	  dbms_output.put_line('Processing class ' || c.NAME);
          execute immediate 'grant execute on "' || c.SHORT_NAME || '" to public';
  end loop;
end;
/
call DBMS_XDB_CONFIG.DELETESERVLET(
       NAME => 'OracleJSONRestServlet'
     )
/
call DBMS_XDB.DELETESERVLETMAPPING(
       NAME => 'OracleJSONRestServlet'
     )
/
call DBMS_XDB_CONFIG.DELETESERVLETSECROLE(
       SERVNAME  => 'OracleJSONRestServlet', 
       ROLENAME  => 'anonymousServletRole'
     ) 
/    
call DBMS_XDB_CONFIG.ADDSERVLETMAPPING(
       PATTERN => '/DBJSON/*', 
       NAME    => 'OracleJSONRestServlet'
     )
/
call DBMS_XDB_CONFIG.ADDSERVLET(
       NAME     => 'OracleJSONRestServlet',
       LANGUAGE => 'Java',
       DISPNAME => 'Oracle Database JSON REST Services',
       DESCRIPT => 'Servlet for for JSON REST Services',
       CLASS    => 'oracle.json.web.RestServlet',
       SCHEMA   => '&OWNER'
     )
/
call DBMS_XDB_CONFIG.ADDSERVLETSECROLE(
   SERVNAME  => 'OracleJSONRestServlet',               
   ROLENAME  => 'authenticatedUser',
   ROLELINK  => 'authenticatedUser'
)     
/
quit
