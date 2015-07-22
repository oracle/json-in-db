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
  echo "Installation Parameters for Oracle XML DB Hands on Lab : Oracle Database 12c."
  echo "\$DBA            : $DBA"
  echo "\$USER           : $USER"
  echo "\$SERVER         : $SERVER"
  echo "\$DEMOHOME       : $demohome"
  echo "\$ORACLE_HOME    : $ORACLE_HOME"
  echo "\$ORACLE_SID     : $ORACLE_SID"
  echo "\$JSON_HOL_BASE  : $JSON_HOL_BASE"
  spexe=$(which sqlplus | head -1)
  echo "sqlplus      : $spexe"
  sqlplus -L $DBA/$DBAPWD@$ORACLE_SID @$demohome/install/sql/verifyConnection.sql
  rc=$?
  echo "sqlplus $DBA:$rc"
  if [ $rc != 2 ] 
  then 
    echo "Operation Failed : Unable to connect via SQLPLUS as $DBA - Installation Aborted. See $logfilename for details."
    exit 2
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
  sqlplus -L $DBA/$DBAPWD@$ORACLE_SID @$demohome/hol/createUser.sql $USER $USERPWD
  sqlplus -L $USER/$USERPWD@$ORACLE_SID @$demohome/install/sql/verifyConnection.sql
  rc=$?
  echo "sqlplus $USER:$rc"
  if [ $rc != 2 ] 
  then 
    echo "Operation Failed : Unable to connect via SQLPLUS as $USER - Installation Aborted. See $logfilename for details."
    exit 3
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
  mkdir -p $JSON_HOL_BASE
  mkdir -p $JSON_HOL_BASE/sql
  mkdir -p $JSON_HOL_BASE/install
  cp "$demohome/hol/clone/resetLab.sh" "$HOME/reset_JSON"
  chmod +x "$HOME/reset_JSON"
  sed -e "s|%HOLDIRECTORY%\/|$JSON_HOL_BASE\/|g" -i "$HOME/reset_JSON"
  sed -e "s|%DEMODIRECTORY%|$demohome|g" -e "s|%DEMOFOLDERNAME%|JSON-HOL|g" -e "s|%DEMONAME%|Oracle XML DB Hands on Lab : Oracle Database 12c|g" -e "s|%LAUNCHPAD%|Hands on Lab|g" -e "s|%SHORTCUTFOLDER%|$demohome\/$USER|g" -e "s|%PUBLICFOLDER%|\/publishedContent|g" -e "s|%DEMOCOMMON%|\/publishedContent\/Hands-On-Labs\/JSON|g" -e "s|%HOMEFOLDER%|\/home\/%USER%|g" -e "s|%DEMOLOCAL%|\/home\/%USER%\/Hands-On-Labs\/JSON|g" -e "s|%XFILES_SCHEMA%|XFILES|g" -e "s|%DATA_STAGING_TABLE%|SAMPLE_DATASET_JSON_HOL|g" -e "s|%TABLE_NAME%|PURCHASEORDER|g" -e "s|%SCHEMAURL%|http:\/\/localhost:80\/publishedContent\/HOL\/xsd\/purchaseOrder.xsd|g" -e "s|enableHTTPTrace|false|g" -e "s|silentInstall|false|g" -e "s|%ORACLEHOME%|$ORACLE_HOME|g" -e "s|%DBA%|$DBA|g" -e "s|%DBAPASSWORD%|$DBAPWD|g" -e "s|%USER%|$USER|g" -e "s|%PASSWORD%|$USERPWD|g" -e "s|%TNSALIAS%|$ORACLE_SID|g" -e "s|%HOSTNAME%|$HOSTNAME|g" -e "s|%HTTPPORT%|$HTTP|g" -e "s|%FTPPORT%|$FTP|g" -e "s|%DRIVELETTER%||g" -e "s|%SERVERURL%|$SERVER|g" -e "s|%DBCONNECTION%|$USER\/$USERPWD@$ORACLE_SID|g" -e "s|%SQLPLUS%|sqlplus|g" -e "s|\$USER|$USER|g" -e "s|\$SERVER|$SERVER|g" -i "$HOME/reset_JSON"
  cp "$demohome/hol/clone/setupLab.sh" "$JSON_HOL_BASE/install/setupLab.sh"
  sed -e "s|%HOLDIRECTORY%\/|$JSON_HOL_BASE\/|g" -i "$JSON_HOL_BASE/install/setupLab.sh"
  sed -e "s|%DEMODIRECTORY%|$demohome|g" -e "s|%DEMOFOLDERNAME%|JSON-HOL|g" -e "s|%DEMONAME%|Oracle XML DB Hands on Lab : Oracle Database 12c|g" -e "s|%LAUNCHPAD%|Hands on Lab|g" -e "s|%SHORTCUTFOLDER%|$demohome\/$USER|g" -e "s|%PUBLICFOLDER%|\/publishedContent|g" -e "s|%DEMOCOMMON%|\/publishedContent\/Hands-On-Labs\/JSON|g" -e "s|%HOMEFOLDER%|\/home\/%USER%|g" -e "s|%DEMOLOCAL%|\/home\/%USER%\/Hands-On-Labs\/JSON|g" -e "s|%XFILES_SCHEMA%|XFILES|g" -e "s|%DATA_STAGING_TABLE%|SAMPLE_DATASET_JSON_HOL|g" -e "s|%TABLE_NAME%|PURCHASEORDER|g" -e "s|%SCHEMAURL%|http:\/\/localhost:80\/publishedContent\/HOL\/xsd\/purchaseOrder.xsd|g" -e "s|enableHTTPTrace|false|g" -e "s|silentInstall|false|g" -e "s|%ORACLEHOME%|$ORACLE_HOME|g" -e "s|%DBA%|$DBA|g" -e "s|%DBAPASSWORD%|$DBAPWD|g" -e "s|%USER%|$USER|g" -e "s|%PASSWORD%|$USERPWD|g" -e "s|%TNSALIAS%|$ORACLE_SID|g" -e "s|%HOSTNAME%|$HOSTNAME|g" -e "s|%HTTPPORT%|$HTTP|g" -e "s|%FTPPORT%|$FTP|g" -e "s|%DRIVELETTER%||g" -e "s|%SERVERURL%|$SERVER|g" -e "s|%DBCONNECTION%|$USER\/$USERPWD@$ORACLE_SID|g" -e "s|%SQLPLUS%|sqlplus|g" -e "s|\$USER|$USER|g" -e "s|\$SERVER|$SERVER|g" -i "$JSON_HOL_BASE/install/setupLab.sh"
  cp "$demohome/setup/install/setupLab.sql" "$JSON_HOL_BASE/install/setupLab.sql"
  sed -e "s|%DEMODIRECTORY%|$demohome|g" -e "s|%DEMOFOLDERNAME%|JSON-HOL|g" -e "s|%DEMONAME%|Oracle XML DB Hands on Lab : Oracle Database 12c|g" -e "s|%LAUNCHPAD%|Hands on Lab|g" -e "s|%SHORTCUTFOLDER%|$demohome\/$USER|g" -e "s|%PUBLICFOLDER%|\/publishedContent|g" -e "s|%DEMOCOMMON%|\/publishedContent\/Hands-On-Labs\/JSON|g" -e "s|%HOMEFOLDER%|\/home\/%USER%|g" -e "s|%DEMOLOCAL%|\/home\/%USER%\/Hands-On-Labs\/JSON|g" -e "s|%XFILES_SCHEMA%|XFILES|g" -e "s|%DATA_STAGING_TABLE%|SAMPLE_DATASET_JSON_HOL|g" -e "s|%TABLE_NAME%|PURCHASEORDER|g" -e "s|%SCHEMAURL%|http:\/\/localhost:80\/publishedContent\/HOL\/xsd\/purchaseOrder.xsd|g" -e "s|enableHTTPTrace|false|g" -e "s|silentInstall|false|g" -e "s|%ORACLEHOME%|$ORACLE_HOME|g" -e "s|%DBA%|$DBA|g" -e "s|%DBAPASSWORD%|$DBAPWD|g" -e "s|%USER%|$USER|g" -e "s|%PASSWORD%|$USERPWD|g" -e "s|%TNSALIAS%|$ORACLE_SID|g" -e "s|%HOSTNAME%|$HOSTNAME|g" -e "s|%HTTPPORT%|$HTTP|g" -e "s|%FTPPORT%|$FTP|g" -e "s|%DRIVELETTER%||g" -e "s|%SERVERURL%|$SERVER|g" -e "s|%DBCONNECTION%|$USER\/$USERPWD@$ORACLE_SID|g" -e "s|%SQLPLUS%|sqlplus|g" -e "s|\$USER|$USER|g" -e "s|\$SERVER|$SERVER|g" -i "$JSON_HOL_BASE/install/setupLab.sql"
  echo "Cloning \"$demohome/setup/clone/sql\" into \"$JSON_HOL_BASE/sql\""
  cp -r "$demohome/setup/clone/sql"/* "$JSON_HOL_BASE/sql"
  find "$XMLDB_HOL_BASE/sql" -type f -print0 | xargs -0   sed -e "s|%DEMODIRECTORY%|$demohome|g" -e "s|%DEMOFOLDERNAME%|XMLDB-HOL|g" -e "s|%DEMONAME%|Oracle XML DB Hands on Lab : Oracle Database 12c|g" -e "s|%LAUNCHPAD%|Hands on Lab|g" -e "s|%SHORTCUTFOLDER%|$demohome\/$USER|g" -e "s|%PUBLICFOLDER%|\/publishedContent|g" -e "s|%DEMOCOMMON%|\/publishedContent\/Hands-On-Labs\/XMLDB|g" -e "s|%HOMEFOLDER%|\/home\/%USER%|g" -e "s|%DEMOLOCAL%|\/home\/%USER%\/Hands-On-Labs\/XMLDB|g" -e "s|%XFILES_SCHEMA%|XFILES|g" -e "s|%DATA_STAGING_TABLE%|SAMPLE_DATASET_XMLDB_HOL|g" -e "s|%TABLE_NAME%|PURCHASEORDER|g" -e "s|%SCHEMAURL%|http:\/\/localhost:80\/publishedContent\/HOL\/xsd\/purchaseOrder.xsd|g" -e "s|enableHTTPTrace|false|g" -e "s|silentInstall|false|g" -e "s|%ORACLEHOME%|$ORACLE_HOME|g" -e "s|%DBA%|$DBA|g" -e "s|%DBAPASSWORD%|$DBAPWD|g" -e "s|%USER%|$USER|g" -e "s|%PASSWORD%|$USERPWD|g" -e "s|%TNSALIAS%|$ORACLE_SID|g" -e "s|%HOSTNAME%|$HOSTNAME|g" -e "s|%HTTPPORT%|$HTTP|g" -e "s|%FTPPORT%|$FTP|g" -e "s|%DRIVELETTER%||g" -e "s|%SERVERURL%|$SERVER|g" -e "s|%DBCONNECTION%|$USER\/$USERPWD@$ORACLE_SID|g" -e "s|%SQLPLUS%|sqlplus|g" -e "s|\$USER|$USER|g" -e "s|\$SERVER|$SERVER|g" -i
  echo "Cloning Completed"
  mv "$JSON_HOL_BASE/sql/0.0 RESET_DEMO.sql" "$JSON_HOL_BASE/install/resetLab.sql"
  sqlplus $DBA/$DBAPWD@$ORACLE_SID @$demohome/install/sql/grantPermissions.sql $USER
  sqlplus $USER/$USERPWD@$ORACLE_SID @$demohome/install/sql/createHomeFolder.sql
  sqlplus $DBA/$DBAPWD@$ORACLE_SID as sysdba @"$JSON_HOL_BASE/install/setupLab.sql" $USER $USERPWD
  sqlplus $USER/$USERPWD@$ORACLE_SID @"$JSON_HOL_BASE/install/resetLab.sql"
  unzip -o -qq "$demohome/manual/manual.zip" -d "$JSON_HOL_BASE/manual"
  ln -s "$JSON_HOL_BASE/manual/manual.htm" "$JSON_HOL_BASE/manual/index.html"
  echo "Installation Complete. See $logfilename for details."
}
DBA=${1}
DBAPWD=${2}
USER=${3}
USERPWD=${4}
SERVER=${5}
JSON_HOL_BASE=~/Desktop/Database_Track/JSON
demohome="$(dirname "$(pwd)")"
logfilename=$demohome/hol/handsOnLab.log
echo "Log File : $logfilename"
rm $logfilename
doInstall 2>&1 | tee -a $logfilename