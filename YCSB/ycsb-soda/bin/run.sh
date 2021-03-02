#!/bin/bash

source bin/env

bin/ycsb run soda -cp $CLASSPATH -P ./workloads/workloadb -jvm-args "-Xmx32g -Xms32g -Dsun.net.inetaddr.ttl=0" -s -threads 20 -p soda.url=jdbc:oracle:thin:@<db_service_name>?TNS_ADMIN=<tns and wallet dirname>-p soda.user=<dbuser> -p soda.password=<db pasword> -p table=<collection name> -p recordcount=4096000 -p maxexecutiontime=600  -p operationcount=1000000000
 
