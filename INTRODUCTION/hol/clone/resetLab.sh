doSetup() {
  cd %HOLDIRECTORY%/install
  sh setupLab.sh ${DBAPWD} ${USERPWD}
}
DBAPWD=${1:-oracle}
USERPWD=${2:-oracle}
if [ -f "reset_XMLDB.log" ] 
then
  rm reset_XMLDB.log
fi
doSetup 2>&1 | tee -a reset_XMLDB.log
