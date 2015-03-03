demohome="$(dirname "$(pwd)")"
logfilename=$demohome/install/RESTDEMO.ORDS.log
echo "Log File : $logfilename"
rm $logfilename
USER=$1
echo "Installation Parameters for Oracle REST Services for JSON". > $logfilename
echo "\$USER        : $USER" >> $logfilename
echo "\$STATIC      : $STATIC" >> $logfilename
rm -rf "$STATIC/XFILES/Applications/RESTDEMO"
rc=$?
echo "DELETE "$STATIC/XFILES/Applications/RESTDEMO" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 6
fi
mkdir -p "$STATIC/XFILES/Applications/RESTDEMO"
rc=$?
echo "MKDIR "$STATIC/XFILES/Applications/RESTDEMO" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 7
fi
mkdir -p "$STATIC/XFILES/Applications/RESTDEMO/sql"
rc=$?
echo "MKDIR "$STATIC/XFILES/Applications/RESTDEMO/sql" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 7
fi
mkdir -p "$STATIC/XFILES/Applications/RESTDEMO/js"
rc=$?
echo "MKDIR "$STATIC/XFILES/Applications/RESTDEMO/js" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 7
fi
mkdir -p "$STATIC/XFILES/Applications/RESTDEMO/css"
rc=$?
echo "MKDIR "$STATIC/XFILES/Applications/RESTDEMO/css" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 7
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/JSONREST.html" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/JSONREST.html"
fi
cp  "$demohome/JSONREST.html" "$STATIC/XFILES/Applications/RESTDEMO/JSONREST.html"
rc=$?
echo "COPY:"$demohome/JSONREST.html" --> "$STATIC/XFILES/Applications/RESTDEMO/JSONREST.html" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/js/JSONREST.js" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/js/JSONREST.js"
fi
cp  "$demohome/js/JSONREST.js" "$STATIC/XFILES/Applications/RESTDEMO/js/JSONREST.js"
rc=$?
echo "COPY:"$demohome/js/JSONREST.js" --> "$STATIC/XFILES/Applications/RESTDEMO/js/JSONREST.js" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json"
fi
cp  "$demohome/js/JSONREST-SQL.json" "$STATIC/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json"
rc=$?
echo "COPY:"$demohome/js/JSONREST-SQL.json" --> "$STATIC/XFILES/Applications/RESTDEMO/js/JSONREST-SQL.json" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/POREST.html" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/POREST.html"
fi
cp  "$demohome/POREST.html" "$STATIC/XFILES/Applications/RESTDEMO/POREST.html"
rc=$?
echo "COPY:"$demohome/POREST.html" --> "$STATIC/XFILES/Applications/RESTDEMO/POREST.html" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/js/POREST.js" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/js/POREST.js"
fi
cp  "$demohome/js/POREST.js" "$STATIC/XFILES/Applications/RESTDEMO/js/POREST.js"
rc=$?
echo "COPY:"$demohome/js/POREST.js" --> "$STATIC/XFILES/Applications/RESTDEMO/js/POREST.js" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/PurchaseOrder.html" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/PurchaseOrder.html"
fi
cp  "$demohome/PurchaseOrder.html" "$STATIC/XFILES/Applications/RESTDEMO/PurchaseOrder.html"
rc=$?
echo "COPY:"$demohome/PurchaseOrder.html" --> "$STATIC/XFILES/Applications/RESTDEMO/PurchaseOrder.html" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js"
fi
cp  "$demohome/js/PurchaseOrder.js" "$STATIC/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js"
rc=$?
echo "COPY:"$demohome/js/PurchaseOrder.js" --> "$STATIC/XFILES/Applications/RESTDEMO/js/PurchaseOrder.js" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/js/poTemplate.json" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/js/poTemplate.json"
fi
cp  "$demohome/js/poTemplate.json" "$STATIC/XFILES/Applications/RESTDEMO/js/poTemplate.json"
rc=$?
echo "COPY:"$demohome/js/poTemplate.json" --> "$STATIC/XFILES/Applications/RESTDEMO/js/poTemplate.json" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql"
fi
cp  "$demohome/sql/sqlExample1.sql" "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql"
rc=$?
echo "COPY:"$demohome/sql/sqlExample1.sql" --> "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample1.sql" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql"
fi
cp  "$demohome/sql/sqlExample2.sql" "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql"
rc=$?
echo "COPY:"$demohome/sql/sqlExample2.sql" --> "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample2.sql" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql"
fi
cp  "$demohome/sql/sqlExample3.sql" "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql"
rc=$?
echo "COPY:"$demohome/sql/sqlExample3.sql" --> "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample3.sql" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql"
fi
cp  "$demohome/sql/sqlExample4.sql" "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql"
rc=$?
echo "COPY:"$demohome/sql/sqlExample4.sql" --> "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample4.sql" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql"
fi
cp  "$demohome/sql/sqlExample5.sql" "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql"
rc=$?
echo "COPY:"$demohome/sql/sqlExample5.sql" --> "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample5.sql" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql"
fi
cp  "$demohome/sql/sqlExample6.sql" "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql"
rc=$?
echo "COPY:"$demohome/sql/sqlExample6.sql" --> "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample6.sql" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql"
fi
cp  "$demohome/sql/sqlExample7.sql" "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql"
rc=$?
echo "COPY:"$demohome/sql/sqlExample7.sql" --> "$STATIC/XFILES/Applications/RESTDEMO/sql/sqlExample7.sql" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
if [ -e "$STATIC/XFILES/Applications/RESTDEMO/css/demo.css" ] 
then
  rm "$STATIC/XFILES/Applications/RESTDEMO/css/demo.css"
fi
cp  "$demohome/css/demo.css" "$STATIC/XFILES/Applications/RESTDEMO/css/demo.css"
rc=$?
echo "COPY:"$demohome/css/demo.css" --> "$STATIC/XFILES/Applications/RESTDEMO/css/demo.css" : $rc" >> $logfilename
if [ $rc != "0" ] 
then
  echo "Operation Failed [$rc]: Installation Aborted." >> $logfilename
  echo "Installation Failed: See $logfilename for details."
  exit 5
fi
echo "Installation Complete" >> $logfilename
echo "Installation Complete: See $logfilename for details."
