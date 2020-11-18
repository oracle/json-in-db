REM
REM  Script to load some sample dataset in stories collection
REM  To run in SQL*Plus: @@sampleload
REM

SET FEEDBACK 1
SET ECHO ON
SET TRIMSPOOL ON
SET TAB OFF
SET PAGESIZE 100

CREATE OR REPLACE PROCEDURE load_data(data IN VARCHAR2)
AUTHID current_user
IS
  c SODA_Collection_T;
  d SODA_Document_T;
  n number;
BEGIN
  c := dbms_soda.open_Collection('mustories');
  d := SODA_Document_T(b_content => utl_raw.cast_to_raw(data));
  n := c.insert_One(d);
END;
/

-- Load documents
EXEC load_data('{"userid" : "B34F23A9A386F76CE053D401C40A3508","type" : "todo","points" : 3,"title" : "Add test case for pings", "subtitle" : "Make sure they run as part of regressions","description" : "Add unit tests for health check pings."}');

EXEC load_data('{"userid" : "B34F23A9A386F76CE053D401C40A3508","type" : "todo","points" : 2,"title" : "Close duplicate bugs","subtitle" : null, "description" : "Mark the base bugs to indicate which ones they are a duplicate of."}');

EXEC load_data('{"userid" : "B34F23A9A386F76CE053D401C40A3508","type" : "todo","points" : 13,"title" : "Add navbar at top","subtitle" : "This is meant for easy access to other tabs", "description" : "Navbar at the top should contain links to user settings, home and notifications."}');

EXEC load_data('{"userid" : "B34F23A9A386F76CE053D401C40A3508","type" : "in-progress","points" : 8,"title" : "Add health checks", "subtitle" : "Can be a simple ping and echo mechanism to start with","description" : "This is required to monitor the health of the system."}');

EXEC load_data('{"userid" : "B34F23A9A386F76CE053D401C40A3508","type" : "in-progress","points" : 3,"title" : "Add transfer button", "subtitle" : "Should be present handy in the home page","description" : "Transfer button should be added in the homepage, it should take the user to the transfer amount page on click."}');

EXEC load_data('{"userid" : "B34F23A9A386F76CE053D401C40A3508","type" : "completed","points" : 1,"title" : "File tracking bugs for QA", "subtitle" : null, "description" : "File tracking bugs for QA for tests in this sprint."}');

EXEC load_data('{"userid" : "B34F23A9A386F76CE053D401C40A3508","type" : "completed","points" : 13,"title" : "Modal for updating user settings", "subtitle" : null, "description" : "On click of user icon, a modal should show up where user can update his profile settings."}');

EXEC load_data('{"userid" : "B34F23A9A386F76CE053D401C40A3508","type" : "completed","points" : 5,"title" : "Fix lint issues in test", "subtitle" : "To be done for unit tests only", "description" : "This has to be done to avoid platform specific test failures. Also make sure lint passes clean for all tests merged previously."}');

EXEC load_data('{"userid" : "B34F23A9A386F76CE053D401C40A3508","type" : "completed","points" : 1,"title" : "Make integration continuous", "subtitle" : "Follow CI/CD model", "description" : "Recently deployed app must be integrated with Jenkins for CI and Docker for CD. Make this a regular, automatic process during code check-in."}');

COMMIT;

SELECT count(1) "NDOCS" FROM mustories;

DROP PROCEDURE load_data;
