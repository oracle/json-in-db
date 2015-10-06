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
  echo "Hands On Lab Installation Parameters: SODA for REST : Oracle Database 12c (12.1.0.2.0)."
  echo "\$DBA            : $DBA"
  echo "\$USER           : $USER"
  echo "\$SERVER         : $SERVER"
  echo "\$DEMOHOME       : $demohome"
  echo "\$ORACLE_HOME    : $ORACLE_HOME"
  echo "\$ORACLE_SID     : $ORACLE_SID"
  echo "\$HOL_BASE       : $HOL_BASE"
  echo "\$LABID          : $LABID"
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
  sqlplus -L $DBA/$DBAPWD@$ORACLE_SID @$demohome/hol/sql/createUser.sql $USER $USERPWD
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
  rm -rf "$HOL_BASE"
  mkdir -p "$HOL_BASE"
  mkdir -p "$HOL_BASE/manual"
  mkdir -p "$HOL_BASE/install"
  mkdir -p "$HOL_BASE/SampleDocuments"
  cp "$demohome/hol/clone/resetLab.sh" "$HOME/reset_soda4rest"
  sed -e "s|%DEMODIRECTORY%|$demohome|g" -e "s|%DEMOFOLDERNAME%|SODA4REST-HOL|g" -e "s|%DEMONAME%|SODA for REST : Oracle Database 12c (12.1.0.2.0)|g" -e "s|%HOL_BASE%|$HOL_BASE|g" -e "s|%HOL_ROOT%|$HOME\/Desktop\/Database_Track\/SODA4REST|g" -e "s|%LABID%|soda4rest|g" -e "s|%ORACLEHOME%|$ORACLE_HOME|g" -e "s|%TNSALIAS%|$ORACLE_SID|g" -e "s|%HOSTNAME%|$HOSTNAME|g" -e "s|%HTTPPORT%|$HTTP|g" -e "s|%FTPPORT%|$FTP|g" -e "s|%DRIVELETTER%||g" -e "s|%DBA%|$DBA|g" -e "s|%DBAPASSWORD%|$DBAPWD|g" -e "s|%USER%|$USER|g" -e "s|%PASSWORD%|$USERPWD|g" -e "s|%SERVERURL%|$SERVER|g" -e "s|%DBCONNECTION%|$USER\/$USERPWD@$ORACLE_SID|g" -e "s|%SQLPLUS%|sqlplus|g" -e "s|%SHORTCUTFOLDER%|$demohome\/$USER|g" -e "s|\$USER|$USER|g" -e "s|\$SERVER|$SERVER|g" -i "$HOME/reset_soda4rest"
  cp "$demohome/hol/clone/setupLab.sh" "$HOL_BASE/install/setupLab.sh"
  sed -e "s|%DEMODIRECTORY%|$demohome|g" -e "s|%DEMOFOLDERNAME%|SODA4REST-HOL|g" -e "s|%DEMONAME%|SODA for REST : Oracle Database 12c (12.1.0.2.0)|g" -e "s|%HOL_BASE%|$HOL_BASE|g" -e "s|%HOL_ROOT%|$HOME\/Desktop\/Database_Track\/SODA4REST|g" -e "s|%LABID%|soda4rest|g" -e "s|%ORACLEHOME%|$ORACLE_HOME|g" -e "s|%TNSALIAS%|$ORACLE_SID|g" -e "s|%HOSTNAME%|$HOSTNAME|g" -e "s|%HTTPPORT%|$HTTP|g" -e "s|%FTPPORT%|$FTP|g" -e "s|%DRIVELETTER%||g" -e "s|%DBA%|$DBA|g" -e "s|%DBAPASSWORD%|$DBAPWD|g" -e "s|%USER%|$USER|g" -e "s|%PASSWORD%|$USERPWD|g" -e "s|%SERVERURL%|$SERVER|g" -e "s|%DBCONNECTION%|$USER\/$USERPWD@$ORACLE_SID|g" -e "s|%SQLPLUS%|sqlplus|g" -e "s|%SHORTCUTFOLDER%|$demohome\/$USER|g" -e "s|\$USER|$USER|g" -e "s|\$SERVER|$SERVER|g" -i "$HOL_BASE/install/setupLab.sh"
  cp "$demohome/setup/install/setupLab.sql" "$HOL_BASE/install/setupLab.sql"
  sed -e "s|%DEMODIRECTORY%|$demohome|g" -e "s|%DEMOFOLDERNAME%|SODA4REST-HOL|g" -e "s|%DEMONAME%|SODA for REST : Oracle Database 12c (12.1.0.2.0)|g" -e "s|%HOL_BASE%|$HOL_BASE|g" -e "s|%HOL_ROOT%|$HOME\/Desktop\/Database_Track\/SODA4REST|g" -e "s|%LABID%|soda4rest|g" -e "s|%ORACLEHOME%|$ORACLE_HOME|g" -e "s|%TNSALIAS%|$ORACLE_SID|g" -e "s|%HOSTNAME%|$HOSTNAME|g" -e "s|%HTTPPORT%|$HTTP|g" -e "s|%FTPPORT%|$FTP|g" -e "s|%DRIVELETTER%||g" -e "s|%DBA%|$DBA|g" -e "s|%DBAPASSWORD%|$DBAPWD|g" -e "s|%USER%|$USER|g" -e "s|%PASSWORD%|$USERPWD|g" -e "s|%SERVERURL%|$SERVER|g" -e "s|%DBCONNECTION%|$USER\/$USERPWD@$ORACLE_SID|g" -e "s|%SQLPLUS%|sqlplus|g" -e "s|%SHORTCUTFOLDER%|$demohome\/$USER|g" -e "s|\$USER|$USER|g" -e "s|\$SERVER|$SERVER|g" -i "$HOL_BASE/install/setupLab.sql"
  cp "$demohome/hol/clone/resetLab.sql" "$HOL_BASE/install/resetLab.sql"
  sed -e "s|%DEMODIRECTORY%|$demohome|g" -e "s|%DEMOFOLDERNAME%|SODA4REST-HOL|g" -e "s|%DEMONAME%|SODA for REST : Oracle Database 12c (12.1.0.2.0)|g" -e "s|%HOL_BASE%|$HOL_BASE|g" -e "s|%HOL_ROOT%|$HOME\/Desktop\/Database_Track\/SODA4REST|g" -e "s|%LABID%|soda4rest|g" -e "s|%ORACLEHOME%|$ORACLE_HOME|g" -e "s|%TNSALIAS%|$ORACLE_SID|g" -e "s|%HOSTNAME%|$HOSTNAME|g" -e "s|%HTTPPORT%|$HTTP|g" -e "s|%FTPPORT%|$FTP|g" -e "s|%DRIVELETTER%||g" -e "s|%DBA%|$DBA|g" -e "s|%DBAPASSWORD%|$DBAPWD|g" -e "s|%USER%|$USER|g" -e "s|%PASSWORD%|$USERPWD|g" -e "s|%SERVERURL%|$SERVER|g" -e "s|%DBCONNECTION%|$USER\/$USERPWD@$ORACLE_SID|g" -e "s|%SQLPLUS%|sqlplus|g" -e "s|%SHORTCUTFOLDER%|$demohome\/$USER|g" -e "s|\$USER|$USER|g" -e "s|\$SERVER|$SERVER|g" -i "$HOL_BASE/install/resetLab.sql"
  cp -r "$demohome/setup/SampleDocuments"/* "$HOL_BASE/SampleDocuments"
  unzip -o -qq "$demohome/manual/manual.zip" -d "$HOL_BASE/manual"
  ln -s "$HOL_BASE/manual/manual.htm" "$HOL_BASE/manual/index.html"
  chmod +x "$HOME/reset_soda4rest"
  echo "Installation Complete. See $logfilename for details."
}
DBA=${1}
DBAPWD=${2}
USER=${3}
USERPWD=${4}
SERVER=${5}
HOL_BASE="$HOME/Desktop/Database_Track/SODA4REST"
LABID="soda4rest"
demohome="$(dirname "$(pwd)")"
logfilename=$demohome/hol/installHandsOnLab.log
echo "Log File : $logfilename"
if [ -f "$logfilename" ]
then
  rm $logfilename
fi
doInstall 2>&1 | tee -a $logfilename
