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
  echo "ORDS Installation Parameters: Oracle SODA For REST Instroduction."
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
  rm -rf "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST"
  rc=$?
  echo "DELETE "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 6
  fi
  mkdir -p "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST"
  rc=$?
  echo "MKDIR "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 7
  fi
  mkdir -p "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST/manual"
  rc=$?
  echo "MKDIR "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST/manual" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 7
  fi
  if [ -e "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST/manual/manual.zip" ] 
  then
    rm "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST/manual/manual.zip"
  fi
  cp  "$demohome/manual/manual.zip" "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST/manual/manual.zip"
  rc=$?
  echo "COPY:"$demohome/manual/manual.zip" --> "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST/manual/manual.zip" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST/manual/manual.pdf" ] 
  then
    rm "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST/manual/manual.pdf"
  fi
  cp  "$demohome/manual/manual.pdf" "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST/manual/manual.pdf"
  rc=$?
  echo "COPY:"$demohome/manual/manual.pdf" --> "$ORDS_ROOT/publishedContent/Hands-On-Labs/SODA4REST/manual/manual.pdf" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
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
logfilename=$demohome/ORDS/installHandsOnLab.log
echo "Log File : $logfilename"
if [ -f "$logfilename" ]
then
  rm $logfilename
fi
doInstall 2>&1 | tee -a $logfilename
