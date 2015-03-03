#! /bin/sh
sqlplus system/$1 @runSetup.sql JSON1 $2 $ORACLE_SID $PWD
