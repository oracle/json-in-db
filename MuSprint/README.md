# Introduction
MuSprint is a web application designed to track sprint user stories on a story
board. Stories are organized into 'To Do', 'In Progress' or 'Completed'
category. Each story is assigned 'story points' to indicate the amount of
effort required to complete it. Using the web user interface, it is possible
to switch a story from one category to another. A story can be deleted or edited
too.

![Img-1](./client/src/img/board-1.png)

# Deployment View
Currently MuSprint application uses SERN stack. SERN stands for SODA-Express-
React-Node.js. Simple Oracle Document Access (aka SODA) is a set of NoSQL style
APIs to create and manage JSON document collections in Oracle Database. The
application runs against Autonomous JSON Database (AJD) instance.

![Img-2](./images/SERN.png)

For more info: [SODA](https://docs.oracle.com/en/database/oracle/simple-oracle-document-access/index.html) -  [Express](https://expressjs.com/) - [React](https://reactjs.org/) - [Node.js](https://nodejs.org/)

# References

* [SODA API](https://docs.oracle.com/en/database/oracle/simple-oracle-document-access/nodejs/index.html)  

* [SQL/JSON](https://docs.oracle.com/en/database/oracle/oracle-database/19/adjsn/index.html)

* [Autonomous JSON Database (AJD)](https://www.oracle.com/autonomous-database/autonomous-json-database/)  

# Installation Prerequisites
* Install Docker  
  [https://www.docker.com/]()

* Create Oracle Cloud account  
  [https://www.oracle.com/cloud/]()

* Create Autonmous JSON Database instance  
  [https://www.oracle.com/autonomous-database/autonomous-json-database/get-started/]()

* Download Wallet  
  [https://docs.oracle.com/en/cloud/paas/autonomous-data-warehouse-cloud/user/connect-download-wallet.html]()  
  [https://blogs.oracle.com/opal/how-connect-to-oracle-autonomous-cloud-databases]()

# Deployment Instructions

Follow the instructions below to download and deploy the application, either using docker containers or manually. Steps 1 and 2 are the same for both.

### 1 Update Profile Configuration File  

After the wallet is downloaded, edit `sqlnet.ora` and change the wallet location directory to the directory containing the `cwallet.sso` file:
~~~~
WALLET_LOCATION = (SOURCE = (METHOD = file) (METHOD_DATA = (DIRECTORY="/Users/sriksure/cloud/Wallet_MuSprintDB")))
SSL_SERVER_DN_MATCH=yes
~~~~

### 2 Download Source

* Download [MuSprint](.) project source, or
* Clone git repository:
  ~~~~
  $ git clone https://github.com/oracle/json-in-db.git
  ~~~~

## Docker Deployment  

### 3 Build and Run Docker Image

This involves deployment of a frontend server (React) and a backend server (Express + SODA).The following instructions are for running two standalone apps. Alternatively, you may use [`docker compose`](https://docs.docker.com/compose/) for running multi-container Docker applications. 

#### 3.1 Deploying frontend server [Console - 1]

* Build `stories` docker image - This container would run express server and issue SODA calls to Oracle Database  
  Change directory to `stories` and build image:
  ~~~~
  $ cd <>/json-in-db/MuSprint/stories
  $ docker build -t musprint-stories:1.0.0 .
  ~~~~

* Run `stories` app
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

#### 3.2 Deploying backend server [Console - 2]

* Build `client` docker image  
  Change directory to `client` and build image:
  ~~~~
  $ cd <>/json-in-db/MuSprint/client
  $ docker build -t musprint-client:1.0.0 .
  ~~~~

* Run client app  
  ~~~~
  $ docker run -it \
               -p 3000:3000 \
               musprint-client:1.0.0
  ~~~~
  This will start a listener on port 3000.  

The application is ready to view on a browser:  http://localhost:3000/

## Manual Deployment  

### 3 Install Oracle Instant Client and Node.js packages

MuSprint front and back end servers depend on Oracle Instant Client package Node.js modules. Follow the instructions below to install them.

  * Oracle Instant Client  
    https://www.oracle.com/database/technologies/instant-client/downloads.html  
    Oracle Instant Client Basic package should be enough for MuSprint. Additionally, you may also install SQL*Plus package to connect to an Oracle Database Instance.
  * Node.js  
    https://nodejs.org/en/download/

Verify Node.js and NPM packages are installed correctly.
~~~~
$ node -v
v15.0.1

$ npm -v
7.0.3
~~~~

### 4 Install Node.js Dependencies

You can see a `package.json` file in both `client/` and `stories/` directories. Using NPM, install the dependent node modules for client and stories.  

**Console - 1**
~~~~
$ cd <>/json-in-db/MuSprint/stories
$ npm install
~~~~

**Console - 2**
~~~~
$ cd <>/json-in-db/MuSprint/client
$ npm install
~~~~

### 5 Run frontend and backend servers

In two parallel consoles, run the backend and frontend servers. Alternatively, you may use [`concurrently`](https://www.npmjs.com/package/concurrently) NPM package to run the two concurrently.

#### 5.1 Run backend server [Console - 1]

Backend server uses Express.js and serves as ReST endpoints. It establishes connection to Oracle Database instance to read and write JSON documents using SODA APIs.

* Set up server environment variables
  ~~~~
  export NODE_ORACLEDB_USER=<your_database_username>
  export NODE_ORACLEDB_PASSWORD=<your_database_password>
  export NODE_ORACLEDB_CONNECTIONSTRING=<your_service_name>
  export TNS_ADMIN=<your_path_to_wallet>
  export NODE_ORACLEDB_ICPATH=<your_path_to_instant_client>
  ~~~~

  * Note:   
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
    * **`<your_path_to_instant_client>`** [Only for MacOS users]
      * Abosolute path of your instant client directory.
      * Needed only for MacOS users.

* Start server  
  This steps starts the ReST listener and establishes connection with Oracle Database Instance.

  ~~~~
  $ npm start
  ~~~~

  If everything goes fine, you should see the following logs in the console:
  ~~~~
  > musprint@1.0.0 start
  > node router/controller.js

  > Database connection pool initialized.
  > Stories collection created.
  > Pinging the database server...
  > Database service reachable.
  > MuSprint stories service listening at http://localhost:5000/stories/
  ~~~~

#### 5.2 Run frontend server [Console - 2]

Frontend server uses React.

* Start server  
  ~~~~
  $ npm start
  ~~~~

  If everything goes fine, you should see the following logs in the server:
  ~~~~
  > musprint@1.0.0 start
  > react-scripts start

  Starting the development server...

  Compiled successfully!

  You can now view musprint in the browser.

    Local:            http://localhost:3000
    On Your Network:  http://10.0.0.172:3000

  Note that the development build is not optimized.
  To create a production build, use npm run build.
  ~~~~

The application is ready to view on a browser:  http://localhost:3000/