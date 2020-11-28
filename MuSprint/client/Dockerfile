# LICENSE UPL 1.0
#
# Copyright (c) 2020, Oracle and/or its affiliates. All rights reserved.
#

###############################################################################
# Dockerfile for MuSprint Stories frontend (React) server
###############################################################################

ARG        BASE_IMAGE=oraclelinux:7.6
FROM       ${BASE_IMAGE}

LABEL      "provider"="Oracle"
LABEL      "maintainer"="Srikrishnan Suresh <srikrishnan.s.suresh@oracle.com>"
LABEL      "version"=1.0.0

WORKDIR    /app
COPY       . /app

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
EXPOSE     3000
ENTRYPOINT [ "npm", "start" ]