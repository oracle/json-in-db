FROM oraclelinux:7-slim

# Point TNS_ADMIN to /db_credentials
# Volume mapping to be provided via "docker run"
ENV TNS_ADMIN /db_credentials

# Create app directory
WORKDIR /usr/src/app

RUN yum update -y && \
  yum install -y oracle-release-el7 && \
  yum install -y oracle-instantclient19.3-basic.x86_64 && \
  yum install -y oracle-nodejs-release-el7 && \
  yum install -y --disablerepo=ol7_developer_EPEL nodejs && \
  yum clean all && \
  node --version && \
  npm --version && \
  echo Installed

CMD ["pm2-runtime", "/app/process.json"]