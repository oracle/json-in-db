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
