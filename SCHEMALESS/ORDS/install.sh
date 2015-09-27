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
  rm -rf "$ORDS_ROOT/XFILES/Applications/SCHEMALESS"
  rc=$?
  echo "DELETE "$ORDS_ROOT/XFILES/Applications/SCHEMALESS" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 6
  fi
  mkdir -p "$ORDS_ROOT/XFILES/Applications/SCHEMALESS"
  rc=$?
  echo "MKDIR "$ORDS_ROOT/XFILES/Applications/SCHEMALESS" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 7
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html"
  fi
  cp  "$demohome/schemalessDevelopment.html" "$ORDS_ROOT/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html"
  rc=$?
  echo "COPY:"$demohome/schemalessDevelopment.html" --> "$ORDS_ROOT/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html" : $rc" >> $logfilename
  if [ $rc != "0" ] 
  then
    echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
    echo "Installation Failed: See $logfilename for details."
    exit 5
  fi
  if [ -e "$ORDS_ROOT/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js" ] 
  then
    rm "$ORDS_ROOT/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js"
  fi
  cp  "$demohome/schemalessDevelopment.js" "$ORDS_ROOT/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js"
  rc=$?
  echo "COPY:"$demohome/schemalessDevelopment.js" --> "$ORDS_ROOT/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js" : $rc" >> $logfilename
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
