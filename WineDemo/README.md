

# Instructions

* Get Node.js.  For example:
~~~~
   wget "https://nodejs.org/dist/v10.16.3/node-v10.16.3-linux-x64.tar.xz"
   tar -xvf node-v10.16.3-linux-x64.tar.xz
   setenv PATH "/scratch/local/jsondb/node-v10.16.3-linux-x64/bin:$PATH"
~~~~

* Install JET
   npm -g install @oracle/ojet-cli  

* Run `npm install` from WineDemo.

* Add client libraries to LD_LIBRARY_PATH
  https://github.com/oracle/node-oracledb/blob/master/INSTALL.md

* Set database connection information

~~~~
   export NODE_ORACLEDB_USER=scott
   export NODE_ORACLEDB_PASSWORD=tiger
   export NODE_ORACLEDB_CONNECTIONSTRING=localhost:8012/rdbms.regress.rdbms.dev.us.oracle.com
~~~~

* Build with `ojet build`

* Start node.js
  
~~~~
   node server.js
~~~~

* Open demo app
  http://localhost:3001
