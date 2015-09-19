#! /bin/sh
DBAPWD=${1}
USERPWD=${2}
DBA=${3:-system}
USER=${4:-%USER%}
sqlplus -L ${DBA}/${DBAPWD} @setupLab.sql ${USER} ${USERPWD}
sqlplus -L ${USER}/${USERPWD} @resetLab.sql
