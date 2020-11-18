REM
REM This installation file must be run by SYSDBA
REM To run in SQL*Plus: @@install
REM


SET FEEDBACK 1
SET ECHO ON
SET TRIMSPOOL ON
SET TAB OFF
SET PAGESIZE 100

-- Create stories collection using SODA PL/SQL
DECLARE
  stories SODA_Collection_T;
BEGIN
  stories := DBMS_SODA.create_collection('mustories');
END;
/

REM
REM  mustories collection stores story documents for all users.
REM  It has info such as story points, title, subtitle, description etc.
REM  Example document:
REM  {
REM    "category" : "in-progress",
REM    "points" : 9,
REM    "title" : "Add health checks for the system",
REM    "subtitle" : "Can be a simple ping and echo mechanism to start with",
REM    "description" : "This is required to monitor the health of the system"
REM  }
REM


