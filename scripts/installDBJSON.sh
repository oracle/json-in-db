DBA=$1
DBAPWD=$2
ORDSHOME=$3
if [ -e "$ORDSHOME/ords.war" ]
then
  unzip -j $ORDSHOME/ords.war WEB-INF/lib/javax.json-1.0.4.jar
  unzip -j $ORDSHOME/ords.war WEB-INF/lib/orajsonrest.jar
  unzip -j $ORDSHOME/ords.war WEB-INF/lib/orasoda.jar
  sqlplus /nolog @scripts/INSTALL_FROM_JAR.sql $DBA $DBAPWD 
fi
