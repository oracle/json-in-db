# Introduction
MuSprint-stories services offer REST endpoints for adding, updating, removing and fetching sprint user stories.

# Installation Prerequisites

* [Create Oracle Cloud account](https://www.oracle.com/cloud/free)  

* [Create Autonmous JSON Database instance](https://www.oracle.com/autonomous-database/autonomous-json-database/get-started/)  

* [Download Wallet](https://docs.oracle.com/en/cloud/paas/autonomous-data-warehouse-cloud/user/connect-download-wallet.html)
  * [Blog](https://blogs.oracle.com/opal/how-connect-to-oracle-autonomous-cloud-databases)

# Deployment Instructions

Follow the instructions below to download and deploy the application using docker.

## 1 Update Profile Configuration File  

After the wallet is downloaded, edit `sqlnet.ora` and change the wallet location directory to the directory containing the `cwallet.sso` file:
~~~~
WALLET_LOCATION = (SOURCE = (METHOD = file) (METHOD_DATA = (DIRECTORY="/Users/sriksure/cloud/Wallet_MuSprintDB")))
SSL_SERVER_DN_MATCH=yes
~~~~

## 2 Download Source

* Download [MuSprint](.) project source, or
* Clone git repository:
  ~~~~
  $ git clone https://github.com/oracle/json-in-db.git
  ~~~~

## 3 Docker Deployment
You can deploy user stories service independently to listen to REST requests using docker container.

**Note:** Make sure you have [docker](https://docs.docker.com/get-docker/) installed. 
~~~~
$ docker -v
Docker version 19.03.13, build 4484c46d9d
~~~~

### 3.1 Build Stories docker image
This container would run express server and issue SODA calls to Oracle Database  
  Change directory to `stories` and build image:
  ~~~~
  $ cd <>/json-in-db/MuSprint/stories
  $ docker build -t musprint-stories:1.0.0 .
  ~~~~

### 3.2 Run Stories app
  ~~~~
  $ docker run -it \
               --env NODE_ORACLEDB_USER=<your_database_username> \
               --env NODE_ORACLEDB_PASSWORD=<your_database_password> \
               --env NODE_ORACLEDB_CONNECTIONSTRING=<your_service_name> \
               --volume <your_path_to_wallet>:<your_path_to_wallet> \
               --env TNS_ADMIN=<your_path_to_wallet> \
               -p 5000:5000 \
               musprint-stories:1.0.0
  ~~~~
  This will start a listener on port 5000.  
  Note:   
  * **`<your_database_username>`**
    * Database user you want to use.
    * `ADMIN` is default when you create an instance.
  * **`<your_database_password>`**
    * Password for the database user.
  * **`<your_service_name>`**
    * One of the network service name entries in tnsnames.ora file in your wallet directory.
    * The first entry would be like the following. In this example, `musprintdb_high` is the service name.
      ~~~~
      musprintdb_high = (description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.us-sanjose-1.oraclecloud.com))(connect_data=(service_name=b4fzgvhdqfdosn8_musprintdb_high.adb.oraclecloud.com))(security=(ssl_server_cert_dn="CN=adb.us-sanjose-1.oraclecloud.com,OU=Oracle ADB SANJOSE,O=Oracle Corporation,L=Redwood City,ST=California,C=US")))
      ~~~~
  * **`<your_path_to_wallet>`**
    * Absolute path of your wallet directory as specified in `sqlnet.ora`.
    * The same path will be used inside the docker container too.
  
Stories REST endpoint is now open at `http://localhost:5000/stories/`

# REST Endpoints

The following table describes the high-level REST endpoints provided by this service.

| Endpoint | Description | Method |
|---|---|---|
| `/stories/health` | Readiness healthcheck | `GET` |
| `/stories/{type}` | Fetch user stories of given type | `GET` |
| `/stories` | Add a new user story | `POST` |
| `/stories/{id}` | Replace an existing user story | `PUT` |
| `/stories/{id}` | Remove an existing user story | `DELETE` |