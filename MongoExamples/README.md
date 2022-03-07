# Oracle API for MongoDB - Java Examples

This directory contains examples of how to store and access JSON
collections from a Java program using a MongoDB client.

  * [emp.CreateCollection](src/main/java/emp/CreateCollection.java) - Creates the employee collection `employees` used by all the examples.
  * [emp.Insert](src/main/java/emp/Insert.java) - Inserts three JSON values into the `employees` collection.
  * [emp.GetAll](src/main/java/emp/GetAll.java) - Gets all the JSON values from the `employees` collection.
  * [emp.Filter](src/main/java/emp/Filter.java) - Selects employees from the `employees` collection where the salary attribute is greater than 30,000.
  * [emp.Update](src/main/java/emp/Update.java) - Updates an employee document using whole document replacement.
  * [emp.RunAll](src/main/java/emp/RunAll.java) - Runs all the examples at once.
  * [emp.DropCollection](src/main/java/emp/DropCollection.java) - Drops the collection used by the examples.

See also:

  * [Documentation: Using Oracle Database API for MongoDB](https://docs.oracle.com/en/cloud/paas/autonomous-database/adbsa/mongo-using-oracle-database-api-mongodb.html)
  * [Documentation: Oracle Database API for MongoDB](https://docs.oracle.com/en/database/oracle/mongodb-api/mgapi/overview-oracle-database-api-mongodb.html)
  * [Video: Oracle Database API for MongoDB](https://asktom.oracle.com/pls/apex/asktom.search?oh=15144)

Need help?
  * Talk to us on Slack: [#oracle-db-json](https://oracledevrel.slack.com/#oracle-db-json)

## Running the examples

### Create a database

These steps show how to create an always-free Autonomous Database but any 21c or later version of Oracle Database will also work.

1. Create a free cloud account:<br/>
   [https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/). 
   
   _It will ask for a credit card for identification purposes.  Your card will not be charged unless you manually choose to upgrade out of the free-tier limits._
   
2. Sign-in to the cloud console and click on **Autonomous JSON Database** under **Oracle Database**. <br/>
    <img src="img/one.png" width="500px"/>

3. Click **Create Autonomous Database**.  When creating the database, ensure that workload type **Transaction Processing** or **JSON** is selected
   and **Always Free** is selected.
   
   <img src="img/two.png" width="500px"/>
    
   You must define network access control in order to use the Oracle API for MongoDB.  Add your current IP address.
   
   <img src="../JdbcExamples/img/acl.png" width="500px"/>

4. Once the database is created, click on **Service Console**

   <img src="img/four.png" width="500px"/>
   
   Click on **Development**:
   
   <img src="img/five.png" width="500px"/>
   
   Copy the connection string for your database:
   
   <img src="img/six.png" width="500px"/>

### Setup the examples

1. Clone these examples from github.  For example:
    ```
    git clone https://github.com/oracle/json-in-db.git
    cd json-in-db/MongoExamples/
    ```
    If you don't have `git` you can alternatively download them here:
    [https://github.com/oracle/json-in-db/archive/master.zip](https://github.com/oracle/json-in-db/archive/master.zip)
   
2. Install [Java](https://www.oracle.com/java/technologies/javase-downloads.html#JDK8) and [Maven](https://maven.apache.org/install.html)

3. Build the examples:

    ```
    mvn package
    ``` 

### Run the examples


1. Run all the examples using the connection string from above.  Set the username to "admin" and the database to "admin":

    ```
     mvn -q exec:java \
      -Dexec.mainClass="emp.RunAll" \
      -Dexec.args='mongodb://admin:mypassword@TR8SOWHVOZCU675-DEMO.adb.us-ashburn-1.oraclecloudapps.com:27017/admin?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true'
    ```
    But replace ``mypassword`` with the ``ADMIN`` password you specified when you created the database


2. Drop the collection used by the examples:

    ```
     mvn -q exec:java \
      -Dexec.mainClass="emp.DropCollection" \
      -Dexec.args='mongodb://admin:mypassword@TR8SOWHVOZCU675-DEMO.adb.us-ashburn-1.oraclecloudapps.com:27017/admin?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true'
    ```

3. You can also run specific examples, one at a time:

    ```
     mvn -q exec:java \
      -Dexec.mainClass="emp.CreateCollection" \
      -Dexec.args='mongodb://admin:mypassword@TR8SOWHVOZCU675-DEMO.adb.us-ashburn-1.oraclecloudapps.com:27017/admin?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true'
    ```
