# LICENSE UPL 1.0
#
# Copyright (c) 2020, Oracle and/or its affiliates. All rights reserved.
#

###############################################################################
# Dockerfile for MuSprint Stories service
###############################################################################

ARG        BASE_IMAGE=oraclelinux:7.6
FROM       ${BASE_IMAGE}

LABEL      "provider"="Oracle"
LABEL      "maintainer"="Srikrishnan Suresh <srikrishnan.s.suresh@oracle.com>"
LABEL      "version"=1.0.0

WORKDIR    /app
COPY       . /app

#
# Oracle Instant Client and SQL*Plus Client
#
ARG        RELEASE=19
ARG        UPDATE=9

RUN        yum -y install oracle-release-el7 && \
           yum -y install oracle-instantclient${RELEASE}.${UPDATE}-basic && \
           yum -y install oracle-instantclient${RELEASE}.${UPDATE}-sqlplus && \
           rm -rf /var/cache/yum
RUN        sqlplus -v

#
# Node.js module
#
RUN        yum install -y oracle-nodejs-release-el7 && \
           yum install -y --disablerepo=ol7_developer_EPEL nodejs 
RUN        node -v
RUN        npm -v

#
# Dependent node.js modules
#
RUN        npm install

#
# Prepare runnable
#
EXPOSE     5000
ENTRYPOINT [ "npm", "start" ]
