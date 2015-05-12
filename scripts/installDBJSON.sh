DBA=$1
DBAPWD=$2
ORDSHOME=$3
if [ -e "$ORDSHOME/ords.war" ]
then
  unzip $ORDSHOME/ords.war javax.json-1.0.4.jar
  unzip $ORDSHOME/ords.war orajsonrest.jar
  unzip $ORDSHOME/ords.war orasoda.jar
  sqlplus /nolog @scripts/INSTALL_FROM_JARS.sql $DBA $DBAPWD 
fi
