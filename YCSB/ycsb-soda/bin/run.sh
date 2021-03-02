#!/bin/bash

source bin/env

bin/ycsb run soda -cp $CLASSPATH -P ./workloads/workloadc -jvm-args "-Xmx32g -Xms32g -Dsun.net.inetaddr.ttl=0" -s -threads 20 -p soda.url=jdbc:oracle:thin:@db202012241234_tp?TNS_ADMIN=/home/opc/skareenh/tns_atphash19_clone -p soda.user=json -p soda.password=OracleSoda1! -p table=TESTTABLE -p recordcount=4096 -p maxexecutiontime=60  -p operationcount=1000000000
