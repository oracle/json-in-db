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
logfilename=$demohome/install/INTRODUCTION.log
echo "Log File : $logfilename"
rm $logfilename
DBA=$1
DBAPWD=$2
USER=$3
USERPWD=$4
SERVER=$5
echo "Installation Parameters for Oracle JSON Query and Analytics : Oracle Database 12c (12.1.0.2.0)". > $logfilename
echo "\$DBA         : $DBA" >> $logfilename
echo "\$USER        : $USER" >> $logfilename
echo "\$SERVER      : $SERVER" >> $logfilename
echo "\$DEMOHOME    : $demohome" >> $logfilename
echo "\$ORACLE_HOME : $ORACLE_HOME" >> $logfilename
echo "\$ORACLE_SID  : $ORACLE_SID" >> $logfilename
spexe=$(which sqlplus | head -1)
echo "sqlplus      : $spexe" >> $logfilename
sqlplus -L $DBA/$DBAPWD@$ORACLE_SID as sysdba @$demohome/install/sql/verifyConnection.sql
rc=$?
echo "sqlplus as sysdba:$rc" >> $logfilename
if [ $rc != 2 ] 
then 
  echo "Operation Failed : Unable to connect via SQLPLUS as sysdba - Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 1
fi
sqlplus -L $DBA/$DBAPWD@$ORACLE_SID @$demohome/install/sql/verifyConnection.sql
rc=$?
echo "sqlplus $DBA:$rc" >> $logfilename
if [ $rc != 2 ] 
then 
  echo "Operation Failed : Unable to connect via SQLPLUS as $DBA - Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 2
fi
sqlplus -L $USER/$USERPWD@$ORACLE_SID @$demohome/install/sql/verifyConnection.sql
rc=$?
echo "sqlplus $USER:$rc" >> $logfilename
if [ $rc != 2 ] 
then 
  echo "Operation Failed : Unable to connect via SQLPLUS as $USER - Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
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
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    else
      echo "Operation Failed- Installation Aborted." >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  fi
  exit 4
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X GET --write-out "%{http_code}\n" -s --output /dev/null $SERVER/xdbconfig.xml | head -1)
echo "GET:$SERVER/xdbconfig.xml:$HttpStatus" >> $logfilename
if [ $HttpStatus != "200" ] 
then
  if [ $HttpStatus == "401" ] 
    then
      echo "Unable to establish HTTP connection as '$USER'. Please note username is case sensitive with Digest Authentication">> $logfilename
      echo "Unable to establish HTTP connection as '$USER'. Please note username is case sensitive with Digest Authentication"
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    else
      echo "Operation Failed- Installation Aborted." >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  fi
  exit 4
fi
mkdir -p $demohome/$USER
sqlplus $DBA/$DBAPWD@$ORACLE_SID @$demohome/install/sql/grantPermissions.sql $USER
sqlplus $USER/$USERPWD@$ORACLE_SID @$demohome/install/sql/createHomeFolder.sql
sqlplus $DBA/$DBAPWD@$ORACLE_SID as sysdba @$demohome/setup/runSetup.sql $USER $USERPWD $ORACLE_SID $demohome/setup
HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/publishedContent/demonstrations/JSON/introduction" | head -1)
echo "DELETE "$SERVER/publishedContent/demonstrations/JSON/introduction":$HttpStatus" >> $logfilename
if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ] && [ $HttpStatus != "404" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 6
fi
HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction" | head -1)
echo "DELETE "$SERVER/home/$USER/demonstrations/JSON/introduction":$HttpStatus" >> $logfilename
if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ] && [ $HttpStatus != "404" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 6
fi
HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/publishedContent" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/publishedContent" | head -1)
  echo "MKCOL "$SERVER/publishedContent":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/publishedContent/demonstrations" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/publishedContent/demonstrations" | head -1)
  echo "MKCOL "$SERVER/publishedContent/demonstrations":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/publishedContent/demonstrations/JSON" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/publishedContent/demonstrations/JSON" | head -1)
  echo "MKCOL "$SERVER/publishedContent/demonstrations/JSON":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/publishedContent/demonstrations/JSON/introduction" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $DBA:$DBAPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/publishedContent/demonstrations/JSON/introduction" | head -1)
  echo "MKCOL "$SERVER/publishedContent/demonstrations/JSON/introduction":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home" | head -1)
  echo "MKCOL "$SERVER/home":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER" | head -1)
  echo "MKCOL "$SERVER/home/$USER":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations/JSON":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations/JSON/introduction":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home" | head -1)
  echo "MKCOL "$SERVER/home":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER" | head -1)
  echo "MKCOL "$SERVER/home/$USER":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations/JSON":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations/JSON/introduction":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations/JSON/introduction/sql":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/reset.sql" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/reset.sql" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/reset.sql":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/reset.sql":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/setup/reset.sql" "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/reset.sql" | head -1)
echo "PUT:"$demohome/setup/reset.sql" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/reset.sql":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.0%20CREATE_TABLE.sql" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.0%20CREATE_TABLE.sql" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.0 CREATE_TABLE.sql":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.0 CREATE_TABLE.sql":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/1.0 CREATE_TABLE.sql" "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.0%20CREATE_TABLE.sql" | head -1)
echo "PUT:"$demohome/sql/1.0 CREATE_TABLE.sql" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.0 CREATE_TABLE.sql":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.1%20SIMPLE_QUERIES.sql" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.1%20SIMPLE_QUERIES.sql" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.1 SIMPLE_QUERIES.sql":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.1 SIMPLE_QUERIES.sql":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/1.1 SIMPLE_QUERIES.sql" "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.1%20SIMPLE_QUERIES.sql" | head -1)
echo "PUT:"$demohome/sql/1.1 SIMPLE_QUERIES.sql" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/1.1 SIMPLE_QUERIES.sql":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/2.0%20JSON_VALUE.sql" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/2.0%20JSON_VALUE.sql" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/2.0 JSON_VALUE.sql":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/2.0 JSON_VALUE.sql":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/2.0 JSON_VALUE.sql" "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/2.0%20JSON_VALUE.sql" | head -1)
echo "PUT:"$demohome/sql/2.0 JSON_VALUE.sql" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/2.0 JSON_VALUE.sql":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/3.0%20JSON_QUERY.sql" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/3.0%20JSON_QUERY.sql" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/3.0 JSON_QUERY.sql":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/3.0 JSON_QUERY.sql":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/3.0 JSON_QUERY.sql" "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/3.0%20JSON_QUERY.sql" | head -1)
echo "PUT:"$demohome/sql/3.0 JSON_QUERY.sql" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/3.0 JSON_QUERY.sql":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/4.0%20JSON_TABLE.sql" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/4.0%20JSON_TABLE.sql" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/4.0 JSON_TABLE.sql":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/4.0 JSON_TABLE.sql":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/4.0 JSON_TABLE.sql" "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/4.0%20JSON_TABLE.sql" | head -1)
echo "PUT:"$demohome/sql/4.0 JSON_TABLE.sql" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/4.0 JSON_TABLE.sql":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/5.0%20RELATIONAL_VIEWS.sql" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/5.0%20RELATIONAL_VIEWS.sql" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/5.0 RELATIONAL_VIEWS.sql":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/5.0 RELATIONAL_VIEWS.sql":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/5.0 RELATIONAL_VIEWS.sql" "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/5.0%20RELATIONAL_VIEWS.sql" | head -1)
echo "PUT:"$demohome/sql/5.0 RELATIONAL_VIEWS.sql" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/5.0 RELATIONAL_VIEWS.sql":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/6.0%20JSON_EXISTS.sql" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/6.0%20JSON_EXISTS.sql" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/6.0 JSON_EXISTS.sql":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/6.0 JSON_EXISTS.sql":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/6.0 JSON_EXISTS.sql" "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/6.0%20JSON_EXISTS.sql" | head -1)
echo "PUT:"$demohome/sql/6.0 JSON_EXISTS.sql" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/6.0 JSON_EXISTS.sql":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/7.0%20JSON_INDEXES.sql" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/7.0%20JSON_INDEXES.sql" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/7.0 JSON_INDEXES.sql":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/7.0 JSON_INDEXES.sql":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/7.0 JSON_INDEXES.sql" "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/7.0%20JSON_INDEXES.sql" | head -1)
echo "PUT:"$demohome/sql/7.0 JSON_INDEXES.sql" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/7.0 JSON_INDEXES.sql":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/8.0%20JSON_DOCUMENT_INDEX.sql" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/8.0%20JSON_DOCUMENT_INDEX.sql" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/8.0 JSON_DOCUMENT_INDEX.sql":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/8.0 JSON_DOCUMENT_INDEX.sql":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/sql/8.0 JSON_DOCUMENT_INDEX.sql" "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/8.0%20JSON_DOCUMENT_INDEX.sql" | head -1)
echo "PUT:"$demohome/sql/8.0 JSON_DOCUMENT_INDEX.sql" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/sql/8.0 JSON_DOCUMENT_INDEX.sql":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home" | head -1)
  echo "MKCOL "$SERVER/home":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER" | head -1)
  echo "MKCOL "$SERVER/home/$USER":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations/JSON":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations/JSON/introduction":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/manual" | head -1)
if [ $HttpStatus == "404" ] 
then
  HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X MKCOL --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/manual" | head -1)
  echo "MKCOL "$SERVER/home/$USER/demonstrations/JSON/introduction/manual":$HttpStatus" >> $logfilename
  if [ $HttpStatus != "201" ]
  then
    echo "Operation Failed [$HttpStatus] - Installation Aborted." >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 6
	 fi
fi
sed -e "s|%DESKTOP%|C:\Users\Mark D Drake\Desktop|g" -e "s|%STARTMENU%|C:\Users\Mark D Drake\AppData\Roaming\Microsoft\Windows\Start Menu|g" -e "s|%WINWORD%|C:\PROGRA~2\MICROS~2\Office12\WINWORD.EXE|g" -e "s|%EXCEL%|C:\PROGRA~2\MICROS~2\Office12\EXCEL.EXE|g" -e "s|%DEMODIRECTORY%|$demohome|g" -e "s|%DEMOFOLDERNAME%|INTRODUCTION|g" -e "s|%DEMONAME%|Oracle JSON Query and Analytics : Oracle Database 12c (12.1.0.2.0)|g" -e "s|%LAUNCHPAD%|JSON (12.1.0.2.0)|g" -e "s|%LAUNCHPADFOLDER%|C:\Users\Mark D Drake\AppData\Roaming\Microsoft\Windows\Start Menu\JSON Demonstrations|g" -e "s|%SHORTCUTFOLDER%|$demohome\/$USER|g" -e "s|%PUBLICFOLDER%|\/publishedContent|g" -e "s|%DEMOCOMMON%|\/publishedContent\/demonstrations\/JSON\/introduction|g" -e "s|%HOMEFOLDER%|\/home\/%USER%|g" -e "s|%DEMOLOCAL%|\/home\/%USER%\/demonstrations\/JSON\/introduction|g" -e "s|%XFILES_SCHEMA%|XFILES|g" -e "s|enableHTTPTrace|false|g" -e "s|%ORACLEHOME%|$ORACLE_HOME|g" -e "s|%DBA%|$DBA|g" -e "s|%DBAPASSWORD%|$DBAPWD|g" -e "s|%USER%|$USER|g" -e "s|%PASSWORD%|$USERPWD|g" -e "s|%TNSALIAS%|$ORACLE_SID|g" -e "s|%HOSTNAME%|$HOSTNAME|g" -e "s|%HTTPPORT%|$HTTP|g" -e "s|%FTPPORT%|$FTP|g" -e "s|%DRIVELETTER%||g" -e "s|%SERVERURL%|$SERVER|g" -e "s|%DBCONNECTION%|$USER\/$USERPWD@$ORACLE_SID|g" -e "s|%SQLPLUS%|sqlplus|g" -e "s|\$USER|$USER|g" -e "s|\$SERVER|$SERVER|g" -i $demohome/install/configuration.xml
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD --head --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/configuration.xml" | head -1)
if [ $HttpStatus != "404" ] 
then
  if [ $HttpStatus == "200" ] 
  then
    HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X DELETE --write-out "%{http_code}\n" -s --output /dev/null "$SERVER/home/$USER/demonstrations/JSON/introduction/configuration.xml" | head -1)
    if [ $HttpStatus != "200" ] && [ $HttpStatus != "204" ]
    then
      echo "DELETE(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/configuration.xml":$HttpStatus - Operation Failed" >> $logfilename
      echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
      exit 5
    fi
  else
    echo "HEAD(PUT) "$SERVER/home/$USER/demonstrations/JSON/introduction/configuration.xml":$HttpStatus - Operation Failed" >> $logfilename
    echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
    exit 5
  fi
fi
HttpStatus=$(curl --noproxy '*' --digest -u $USER:$USERPWD -X PUT --write-out "%{http_code}\n"  -s --output /dev/null --upload-file "$demohome/install/configuration.xml" "$SERVER/home/$USER/demonstrations/JSON/introduction/configuration.xml" | head -1)
echo "PUT:"$demohome/install/configuration.xml" --> "$SERVER/home/$USER/demonstrations/JSON/introduction/configuration.xml":$HttpStatus" >> $logfilename
if [ $HttpStatus != "201" ] 
then
  echo "Operation Failed: Installation Aborted." >> $logfilename
  echo "InstallationFailed [$HttpStatus]: See $logfilename for details."
  exit 5
fi
sqlplus $DBA/$DBAPWD@$ORACLE_SID @$demohome/install/sql/publishDemo.sql /home/$USER/demonstrations/JSON/introduction XFILES
shellscriptName="$demohome/JSON_(12.1.0.2.0).sh"
echo "Shell Script : $shellscriptName" >> $logfilename
echo "Shell Script : $shellscriptName"
echo "firefox $SERVER/home/$USER/demonstrations/JSON/introduction/index.html"> $shellscriptName
echo "Installation Complete" >> $logfilename
echo "Installation Complete: See $logfilename for details."
