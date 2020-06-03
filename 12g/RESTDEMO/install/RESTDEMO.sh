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
  echo "Installation Parameters: Oracle REST Services for JSON."
  echo "\$DBA            : $DBA"
  echo "\$USER           : $USER"
  echo "\$SERVER         : $SERVER"
  echo "\$DEMOHOME       : $demohome"
  echo "\$ORACLE_HOME    : $ORACLE_HOME"
  echo "\$ORACLE_SID     : $ORACLE_SID"
  spexe=$(which sqlplus | head -1)
  echo "sqlplus      : $spexe"
  unset http_proxy
  unset https_proxy
  unset no_proxy
  sqlplus -L $DBA/$DBAPWD@$ORACLE_SID @$demohome/install/sql/verifyConnection.sql
  rc=$?
  echo "sqlplus $DBA:$rc"
  if [ $rc != 2 ] 
  then 
    echo "Operation Failed : Unable to connect via SQLPLUS as $DBA - Installation Aborted. See $logfilename for details."
    exit 2
  fi
  sqlplus -L $USER/$USERPWD@$ORACLE_SID @$demohome/install/sql/verifyConnection.sql
  rc=$?
  echo "sqlplus $USER:$rc"
  if [ $rc != 2 ] 
  then 
    echo "Operation Failed : Unable to connect via SQLPLUS as $USER - Installation Aborted. See $logfilename for details."
    exit 3
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD -X GET --write-out "%{http_code}\n" -s --output /dev/null $SERVER/xdbconfig.xml | head -1)
  echo "GET:$SERVER/xdbconfig.xml:$HttpStatus"
  if [ $HttpStatus != "200" ] 
  then
    if [ $HttpStatus == "401" ] 
      then
        echo "Unable to establish HTTP connection as '$DBA'. Please note username is case sensitive with Digest Authentication"
        echo "Installation Failed: See $logfilename for details."
      else
        echo "Operation Failed- Installation Aborted. See $logfilename for details."
    fi
    exit 4
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X GET --write-out "%{http_code}\n" -s --output /dev/null $SERVER/public | head -1)
  echo "GET:$SERVER/public:$HttpStatus"
  if [ $HttpStatus != "200" ] 
  then
    if [ $HttpStatus == "401" ] 
      then
        echo "Unable to establish HTTP connection as '$USER'. Please note username is case sensitive with Digest Authentication"
        echo "Installation Failed: See $logfilename for details."
      else
        echo "Operation Failed- Installation Aborted. See $logfilename for details."
    fi
    exit 4
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO" | head -1)
  echo "DELETE \"$SERVER/XFILES/Applications/RESTDEMO\":$HttpStatus"
  if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ] && [ $HttpStatus != "404" ] 
  then
    echo "Operation Failed: Installation Aborted. See $logfilename for details."
    exit 6
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES" | head -1)
    echo "MKCOL \"$SERVER/XFILES\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications/RESTDEMO\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES" | head -1)
    echo "MKCOL \"$SERVER/XFILES\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications/RESTDEMO\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications/RESTDEMO/sql\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES" | head -1)
    echo "MKCOL \"$SERVER/XFILES\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications/RESTDEMO\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications/RESTDEMO/js\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES" | head -1)
    echo "MKCOL \"$SERVER/XFILES\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications/RESTDEMO\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/css" | head -1)
  if [ $HttpStatus == "404" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/css" | head -1)
    echo "MKCOL \"$SERVER/XFILES/Applications/RESTDEMO/css\":$HttpStatus"
    if [ $HttpStatus != "201" ]
    then
      echo "Operation Failed [$HttpStatus] - Installation Aborted. See $logfilename for details."
      exit 6
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/JSONREST.html" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/JSONREST.html" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/JSONREST.html\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/JSONREST.html\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/JSONREST.html" "$SERVER/XFILES/Applications/RESTDEMO/JSONREST.html" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/JSONREST.html\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST.js" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST.js" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST.js\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST.js\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/js/JSONREST.js" "$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST.js" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST.js\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/js/JSONREST-SQL.json" "$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/POREST.html" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/POREST.html" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/POREST.html\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/POREST.html\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/POREST.html" "$SERVER/XFILES/Applications/RESTDEMO/POREST.html" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/POREST.html\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js/POREST.js" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js/POREST.js" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/js/POREST.js\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/js/POREST.js\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/js/POREST.js" "$SERVER/XFILES/Applications/RESTDEMO/js/POREST.js" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/js/POREST.js\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/PurchaseOrder.html" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/PurchaseOrder.html" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/PurchaseOrder.html\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/PurchaseOrder.html\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/PurchaseOrder.html" "$SERVER/XFILES/Applications/RESTDEMO/PurchaseOrder.html" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/PurchaseOrder.html\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/js/PurchaseOrder.js" "$SERVER/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js/poTemplate.json" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/js/poTemplate.json" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/js/poTemplate.json\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/js/poTemplate.json\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/js/poTemplate.json" "$SERVER/XFILES/Applications/RESTDEMO/js/poTemplate.json" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/js/poTemplate.json\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/sqlExample1.sql" "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/sqlExample2.sql" "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/sqlExample3.sql" "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/sqlExample4.sql" "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/sqlExample5.sql" "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/sqlExample6.sql" "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/sqlExample7.sql" "$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/css/demo.css" | head -1)
  if [ $HttpStatus != "404" ] 
  then
    if [ $HttpStatus == "200" ] 
    then
      HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/RESTDEMO/css/demo.css" | head -1)
      if [ $HttpStatus != "200" ] && [ $HttpStatus != "202" ] && [ $HttpStatus != "204" ]
      then
        echo "PUT[DELETE] \"$SERVER/XFILES/Applications/RESTDEMO/css/demo.css\":$HttpStatus - Delete Operation Failed. See $logfilename for details."
        exit 5
      fi
    else
      echo "PUT[HEAD] \"$SERVER/XFILES/Applications/RESTDEMO/css/demo.css\":$HttpStatus - Operation Failed. See $logfilename for details."
      exit 5
    fi
  fi
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/css/demo.css" "$SERVER/XFILES/Applications/RESTDEMO/css/demo.css" | head -1)
  if [ $HttpStatus != "201" ] 
  then
    echo "PUT \"$SERVER/XFILES/Applications/RESTDEMO/css/demo.css\":$HttpStatus - Operation Failed: Installation Aborted. See $logfilename for details."
    exit 5
  fi
  echo "Installation Complete. See $logfilename for details."
}
DBA=${1}
DBAPWD=${2}
USER=${3}
USERPWD=${4}
SERVER=${5}
demohome="$(dirname "$(pwd)")"
logfilename=$demohome/install/RESTDEMO.log
echo "Log File : $logfilename"
if [ -f "$logfilename" ]
then
  rm $logfilename
fi
doInstall 2>&1 | tee -a $logfilename
