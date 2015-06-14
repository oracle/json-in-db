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
demohome="$(dirname "$(pwd)")"
logfilename=$demohome/install/SCHEMALESS.log
echo "Log File : $logfilename"
rm $logfilename
DBA=$1
DBAPWD=$2
USER=$3
USERPWD=$4
SERVER=$5
echo "Installation Parameters for Oracle REST Services for JSON". > $logfilename
echo "\$DBA         : $DBA" >> $logfilename
echo "\$USER        : $USER" >> $logfilename
echo "\$SERVER      : $SERVER" >> $logfilename
echo "\$DEMOHOME    : $demohome" >> $logfilename
echo "\$ORACLE_HOME : $ORACLE_HOME" >> $logfilename
echo "\$ORACLE_SID  : $ORACLE_SID" >> $logfilename
spexe=$(which sqlplus | head -1)
echo "sqlplus      : $spexe" >> $logfilename
sqlplus -L $DBA/$DBAPWD@$ORACLE_SID @$demohome/install/sql/verifyConnection.sql
rc=$?
echo "sqlplus $DBA:$rc" >> $logfilename
if [ $rc != 2 ] 
then 
  echo "Operation Failed : Unable to connect via SQLPLUS as $DBA - Installation Aborted." >> $logfilename
  echo "Installation Failed [$HttpStatus]: See $logfilename for details."
  exit 2
fi
sqlplus -L $USER/$USERPWD@$ORACLE_SID @$demohome/install/sql/verifyConnection.sql
rc=$?
echo "sqlplus $USER:$rc" >> $logfilename
if [ $rc != 2 ] 
then 
  echo "Operation Failed : Unable to connect via SQLPLUS as $USER - Installation Aborted." >> $logfilename
  echo "Installation Failed [$HttpStatus]: See $logfilename for details."
  exit 3
fi
HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD -X GET --write-out "%{http_code}\n" -s --output /dev/null $SERVER/xdbconfig.xml | head -1)
echo "GET:$SERVER/xdbconfig.xml:$HttpStatus" >> $logfilename
if [ $HttpStatus != "200" ] 
then
  if [ $HttpStatus == "401" ] 
    then
      echo "Unable to establish HTTP connection as '$DBA'. Please note username is case sensitive with Digest Authentication">> $logfilename
      echo "Unable to establish HTTP connection as '$DBA'. Please note username is case sensitive with Digest Authentication"
      echo "Installation Failed [$HttpStatus]: See $logfilename for details."
    else
      echo "Operation Failed- Installation Aborted." >> $logfilename
      echo "Installation Failed [$HttpStatus]: See $logfilename for details."
  fi
  exit 4
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X GET --write-out "%{http_code}\n" -s --output /dev/null $SERVER/public | head -1)
echo "GET:$SERVER/public:$HttpStatus" >> $logfilename
if [ $HttpStatus != "200" ] 
then
  if [ $HttpStatus == "401" ] 
    then
      echo "Unable to establish HTTP connection as '$USER'. Please note username is case sensitive with Digest Authentication">> $logfilename
      echo "Unable to establish HTTP connection as '$USER'. Please note username is case sensitive with Digest Authentication"
      echo "Installation Failed [$HttpStatus]: See $logfilename for details."
    else
      echo "Operation Failed- Installation Aborted." >> $logfilename
      echo "Installation Failed [$HttpStatus]: See $logfilename for details."
  fi
  exit 4
fi
HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/SCHEMALESS" | head -1)
echo "DELETE "$SERVER/XFILES/Applications/SCHEMALESS":$HttpStatus" >> $logfilename
if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ] && [ $HttpStatus != "404" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "Installation Failed [$HttpStatus]: See $logfilename for details."
  exit 6
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES" | head -1)
  echo "MKCOL "$SERVER/XFILES":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "Installation Failed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications" | head -1)
  echo "MKCOL "$SERVER/XFILES/Applications":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "Installation Failed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/SCHEMALESS" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/SCHEMALESS" | head -1)
  echo "MKCOL "$SERVER/XFILES/Applications/SCHEMALESS":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "Installation Failed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html":$HttpStatus - Operation Failed" >> $logfilename
      echo "Installation Failed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html":$HttpStatus - Operation Failed" >> $logfilename
    echo "Installation Failed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/schemalessDevelopment.html" "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html" | head -1)
echo "PUT:"$demohome/schemalessDevelopment.html" --> "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "Installation Failed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js":$HttpStatus - Operation Failed" >> $logfilename
      echo "Installation Failed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js":$HttpStatus - Operation Failed" >> $logfilename
    echo "Installation Failed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/schemalessDevelopment.js" "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js" | head -1)
echo "PUT:"$demohome/schemalessDevelopment.js" --> "$SERVER/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "Installation Failed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
echo "Installation Complete" >> $logfilename
echo "Installation Complete: See $logfilename for details."
