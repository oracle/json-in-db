#! /bin/sh
DBAPWD=${1}
USERPWD=${2}
DBA=${3:-system}
USER=${4:-%USER%}
sqlplus -L ${DBA}/${DBAPWD} @setupLab.sql ${USER} ${USERPWD}
sqlldr -userid=${USER}/${USERPWD} -control=%HOLDIRECTORY%/install/%DATA_STAGING_TABLE%.ctl -log=%DATA_STAGING_TABLE%.log
cat %DATA_STAGING_TABLE%.log
sqlplus -L ${USER}/${USERPWD} @resetLab.sql
