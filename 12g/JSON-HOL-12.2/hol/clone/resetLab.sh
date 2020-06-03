doSetup() {
  cd %HOL_ROOT%/install
  sh setupLab.sh ${DBAPWD} ${USERPWD}
}
DBAPWD=${1:-oracle}
USERPWD=${2:-oracle}
if [ -f "reset_JSON.log" ] 
then
  rm reset_JSON.log
fi
doSetup 2>&1 | tee -a reset_JSON.log
