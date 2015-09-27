#/* ================================================  
# *    
# * Copyright (c) 2015 Oracle and/or its affiliates.  All rights reserved.
# *
# * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# *
# * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
# *
# * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
# *
# * ================================================ 
# */
doInstall() {
  echo "ORDS Installation Parameters: Oracle REST Services for JSON."
  echo "\$ORDS_ROOT      : $ORDS_ROOT"
  echo "\$USER           : $USER"
  echo "\$SERVER         : $SERVER"
  echo "\$DEMOHOME       : $demohome"
  rm -rf "$ORDS_ROOT/XFILES/Applications/RESTDEMO"
  rc=$?
  echo "DELETE "$ORDS_ROOT/XFILES/Applications/RESTDEMO" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 6
  fi
  mkdir -p "$ORDS_ROOT/XFILES/Applications/RESTDEMO"
  rc=$?
  echo "MKDIR "$ORDS_ROOT/XFILES/Applications/RESTDEMO" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 7
  fi
  mkdir -p "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql"
  rc=$?
  echo "MKDIR "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 7
  fi
  mkdir -p "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js"
  rc=$?
  echo "MKDIR "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 7
  fi
  mkdir -p "$ORDS_ROOT/XFILES/Applications/RESTDEMO/css"
  rc=$?
  echo "MKDIR "$ORDS_ROOT/XFILES/Applications/RESTDEMO/css" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 7
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/JSONREST.html" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/JSONREST.html"
  fi
  cp  "$demohome/JSONREST.html" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/JSONREST.html"
  rc=$?
  echo "COPY:"$demohome/JSONREST.html" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/JSONREST.html" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/JSONREST.js" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/JSONREST.js"
  fi
  cp  "$demohome/js/JSONREST.js" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/JSONREST.js"
  rc=$?
  echo "COPY:"$demohome/js/JSONREST.js" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/JSONREST.js" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json"
  fi
  cp  "$demohome/js/JSONREST-SQL.json" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json"
  rc=$?
  echo "COPY:"$demohome/js/JSONREST-SQL.json" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/POREST.html" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/POREST.html"
  fi
  cp  "$demohome/POREST.html" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/POREST.html"
  rc=$?
  echo "COPY:"$demohome/POREST.html" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/POREST.html" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/POREST.js" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/POREST.js"
  fi
  cp  "$demohome/js/POREST.js" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/POREST.js"
  rc=$?
  echo "COPY:"$demohome/js/POREST.js" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/POREST.js" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/PurchaseOrder.html" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/PurchaseOrder.html"
  fi
  cp  "$demohome/PurchaseOrder.html" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/PurchaseOrder.html"
  rc=$?
  echo "COPY:"$demohome/PurchaseOrder.html" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/PurchaseOrder.html" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js"
  fi
  cp  "$demohome/js/PurchaseOrder.js" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js"
  rc=$?
  echo "COPY:"$demohome/js/PurchaseOrder.js" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/poTemplate.json" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/poTemplate.json"
  fi
  cp  "$demohome/js/poTemplate.json" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/poTemplate.json"
  rc=$?
  echo "COPY:"$demohome/js/poTemplate.json" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/js/poTemplate.json" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql"
  fi
  cp  "$demohome/sql/sqlExample1.sql" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql"
  rc=$?
  echo "COPY:"$demohome/sql/sqlExample1.sql" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql"
  fi
  cp  "$demohome/sql/sqlExample2.sql" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql"
  rc=$?
  echo "COPY:"$demohome/sql/sqlExample2.sql" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql"
  fi
  cp  "$demohome/sql/sqlExample3.sql" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql"
  rc=$?
  echo "COPY:"$demohome/sql/sqlExample3.sql" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql"
  fi
  cp  "$demohome/sql/sqlExample4.sql" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql"
  rc=$?
  echo "COPY:"$demohome/sql/sqlExample4.sql" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql"
  fi
  cp  "$demohome/sql/sqlExample5.sql" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql"
  rc=$?
  echo "COPY:"$demohome/sql/sqlExample5.sql" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql"
  fi
  cp  "$demohome/sql/sqlExample6.sql" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql"
  rc=$?
  echo "COPY:"$demohome/sql/sqlExample6.sql" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql"
  fi
  cp  "$demohome/sql/sqlExample7.sql" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql"
  rc=$?
  echo "COPY:"$demohome/sql/sqlExample7.sql" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/RESTDEMO/css/demo.css" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/RESTDEMO/css/demo.css"
  fi
  cp  "$demohome/css/demo.css" "$ORDS_ROOT/XFILES/Applications/RESTDEMO/css/demo.css"
  rc=$?
  echo "COPY:"$demohome/css/demo.css" --> "$ORDS_ROOT/XFILES/Applications/RESTDEMO/css/demo.css" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  echo "Installation Complete. See $logfilename for details."
}
ORDS_ROOT=${1}
USER=${2}
SERVER=${3}
demohome="$(dirname "$(pwd)")"
logfilename=$demohome/ORDS/install.log
echo "Log File : $logfilename"
if [ -f "$logfilename" ]
then
  rm $logfilename
fi
doInstall 2>&1 | tee -a $logfilename
