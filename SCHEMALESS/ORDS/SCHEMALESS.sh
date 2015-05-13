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
 */

demohome="$(dirname "$(pwd)")"
logfilename=$demohome/install/SCHEMALESS.ORDS.log
echo "Log File : $logfilename"
rm $logfilename
USER=$1
echo "Installation Parameters for Oracle REST Services for JSON". > $logfilename
echo "\$USER        : $USER" >> $logfilename
echo "\$STATIC      : $STATIC" >> $logfilename
rm -rf "$STATIC/XFILES/Applications/SCHEMALESS"
rc=$?
echo "DELETE "$STATIC/XFILES/Applications/SCHEMALESS" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 6
fi
mkdir -p "$STATIC/XFILES/Applications/SCHEMALESS"
rc=$?
echo "MKDIR "$STATIC/XFILES/Applications/SCHEMALESS" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 7
fi
if [ -e "$STATIC/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html" ] 
then
  rm "$STATIC/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html"
fi
cp  "$demohome/schemalessDevelopment.html" "$STATIC/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html"
rc=$?
echo "COPY:"$demohome/schemalessDevelopment.html" --> "$STATIC/XFILES/Applications/SCHEMALESS/schemalessDevelopment.html" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js" ] 
then
  rm "$STATIC/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js"
fi
cp  "$demohome/schemalessDevelopment.js" "$STATIC/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js"
rc=$?
echo "COPY:"$demohome/schemalessDevelopment.js" --> "$STATIC/XFILES/Applications/SCHEMALESS/schemalessDevelopment.js" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
echo "Installation Complete" >> $logfilename
echo "Installation Complete: See $logfilename for details."
