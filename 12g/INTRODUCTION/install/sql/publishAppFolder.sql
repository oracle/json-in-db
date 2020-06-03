
/* ================================================  
 *    
 * Copyright (c) 2016 Oracle and/or its affiliates.  All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * ================================================ */

set echo on
--
spool publishAppFolder.log
--
def SOURCE_FOLDER = &1
--
def ACL = &2
--
-- Publish the application by creating a Link between the Installation Folder and /XFiles/Applications
-- Should always be invoked by DBA.
--
declare
  V_SOURCE_PATH varchar2(700) := '&SOURCE_FOLDER';
  V_FOLDER_NAME varchar2(700) := substr('&SOURCE_FOLDER',instr('&SOURCE_FOLDER','/',-1)+1);
  V_TARGET_PATH varchar2(700) := XFILES_CONSTANTS.FOLDER_APPLICATIONS_PUBLIC || '/' || V_FOLDER_NAME;

  cursor publishResources is
  select path 
    from path_view
   where under_path(res,V_SOURCE_PATH) = 1;

begin
  dbms_xdb.setAcl(V_SOURCE_PATH,&ACL);
  for res in publishResources loop
    dbms_xdb.setACL(res.path,&ACL);
  end loop;
  if dbms_xdb.existsResource(V_TARGET_PATH) then
    dbms_xdb.deleteResource(V_TARGET_PATH);
  end if;
  dbms_xdb.link(V_SOURCE_PATH,XFILES_CONSTANTS.FOLDER_APPLICATIONS_PUBLIC,V_FOLDER_NAME,DBMS_XDB.LINK_TYPE_WEAK);
end;
/
commit
/
--
@@postInstallationSteps
--
quit
