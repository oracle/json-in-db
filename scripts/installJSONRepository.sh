DBA=$1
DBAPWD=$2
XFILES=$3
XFILESPWD=$4
DEMOUSER=$5
DEMOPWD=$6
XDBEXT=$9
XDBEXTPWD=$8
SERVERURL=$9
curl -Lk https://github.com/oracle/json-in-db/zipball/master -o json-in-db.zip
rm -rf oracle-json-in-db-*
unzip -o json-in-db.zip
cd oracle-json-in-db*
cd INTRODUCTION/install
sh INTRODUCTION.sh $DBA $DBAPWD $DEMOUSER $DEMOPWD $SERVERURL
cd ../../RESTDEMO/install
sh RESTDEMO.sh $DBA $DBAPWD $XFILES $XFILESPWD $SERVERURL
cd ../../SCHEMALESS/install
sh SCHEMALESS.sh $DBA $DBAPWD $XFILES $XFILESPWD $SERVERURL
cd ../../..
