FROM oraclelinux:7.6

COPY . /app

RUN yum install -y oracle-release-el7
RUN yum install -y oracle-instantclient19.3-basic.x86_64
RUN yum install -y oracle-nodejs-release-el7
RUN yum install -y --disablerepo=ol7_developer_EPEL nodejs 
RUN yum install -y bzip2

RUN npm -g install @oracle/ojet-cli
RUN npm -g install pm2

RUN cd /app && npm install && ojet build

CMD ["pm2-runtime", "/app/process.json"]
