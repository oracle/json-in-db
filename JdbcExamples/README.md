# JDBC and JSON in Oracle Database 21c+

This directory contains examples of how to store and access JSON type values in Oracle Database from a Java program. 

  * [emp.CreateTable](src/main/java/emp/CreateTable.java) - Creates the employee table `emp` used by all the examples.
  * [emp.Insert](src/main/java/emp/Insert.java) - Inserts three JSON values into the `emp` table.
  * [emp.GetAll](src/main/java/emp/GetAll.java) - Gets all the JSON values from the `emp` table.
  * [emp.Filter](src/main/java/emp/Filter.java) - Selects employees from the `emp` table where the salary attribute is greater than 30,000.
  * [emp.Filter2](src/main/java/emp/Filter2.java) - Selects employees from the `emp` table that have the `created` attribute.
  * [emp.Update](src/main/java/emp/Update.java) - Updates an employee record using whole document replacement.
  * [emp.UpdateMerge](src/main/java/emp/UpdateMerge.java) - Performs a partial update using JSON_MERGEPATCH().
  * [emp.UpdateTransform](src/main/java/emp/UpdateTransform.java) - Performs a partial update using JSON_TRANSFORM().
  * [emp.JSONP](src/main/java/emp/JSONP.java) - Inserts and retrieves a value using [JSON-P (javax.json)](https://javaee.github.io/jsonp/) interfaces.
  * [emp.JSONB](src/main/java/emp/JSONB.java) - Stores and retrieves a plain/custom Java object as JSON using [JSON-B (javax.json.bind)](https://javaee.github.io/jsonb-spec/).
  * [emp.Jackson](src/main/java/emp/Jackson.java) - Encodes JSON from an external source, in this case a Jackson parser, as Oracle binary JSON and inserts it into the table.
  * [emp.BinaryJson](src/main/java/emp/BinaryJson.java) - Encodes JSON text as Oracle binary JSON, stores it in a file, and then reads it back again.
  * [emp.RunAll](src/main/java/emp/RunAll.java) - Runs all the examples at once.
  * [emp.DropTable](src/main/java/emp/DropTable.java) - Drops the table used by the examples.

See also:
  * Documentation: [The API for JSON type in Oracle Database (oracle.sql.json)](https://docs.oracle.com/en/database/oracle/oracle-database/21/jajdb/oracle/sql/json/package-summary.html)
  * Video (YouTube): [AskTom Office Hours: The Java API for JSON type in Oracle JDBC](https://youtu.be/jg5d15-2K3Y)


## Running the examples

### Create a database

These steps show how to create an always-free Autonomous Database but any 21c or later version of Oracle Database will also work.

1. Create a free cloud account:<br/>
   [https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/). 
   
   _It will ask for a credit card for identification purposes.  Your card will not be charged unless you manually choose to upgrade out of the free-tier limits._
   
2. Sign-in to the cloud console and click on **Autonomous Transaction Processing** under the drop-down menu. <br/>
    <img src="img/create1.png" width="400px"/>

3. Click **Create Autonomous Database**.  When creating the database, ensure that
    - Workload type **Transaction Processing** or **JSON** is selected
    - **Always Free** is selected
    - Version **21c** (or later) is selected
  
    <img src="img/create2.png" width="400px"/>

4. Once the database is created, click on **DB Connection** and download the database wallet. The database wallet enables encrypted access and provides the connection details.  Be sure to remember wallet password you enter as you will needed it in **Step 6**.
   
    <img src="img/create3.png" width="400px"/>
  
5. Unzip the wallet.  The remaining examples assume the wallet is unziped to the directory `/Users/test/Wallet_mydb`

6. **IMPORTANT**: Modify `ojdbc.properties` in the wallet directory.

    - Comment out the line that begins `oracle.net.wallet_location=...`:
    ```
    # Connection property for Oracle Wallets 
    # oracle.net.wallet_location=(SOURCE=(METHOD=FILE)(METHOD_DATA=(DIRECTORY=${TNS_ADMIN}))
    ```
    - Uncomment the lines starting ``javax.net...`` and set `trustStorePassword` and `keyStorePassword` to the password you entered in **Step 4**:
    ```
    javax.net.ssl.trustStore=${TNS_ADMIN}/truststore.jks 
    javax.net.ssl.trustStorePassword=welcome1
    javax.net.ssl.keyStore=${TNS_ADMIN}/keystore.jks 
    javax.net.ssl.keyStorePassword=welcome1
    ```
      
    For details on wallets and connection strings, see: [https://www.oracle.com/database/technologies/java-connectivity-to-atp.html](https://www.oracle.com/database/technologies/java-connectivity-to-atp.html)

### Setup the examples

1. Clone these examples from github.  For example:
    ```
    git clone https://github.com/oracle/json-in-db.git
    cd json-in-db/JdbcExamples/
    ```
    If you don't have `git` you can alternatively download them here:
    [https://github.com/oracle/json-in-db/archive/master.zip](https://github.com/oracle/json-in-db/archive/master.zip)
    <br/><br/>
   
2. Install [Java](https://www.oracle.com/java/technologies/javase-downloads.html#JDK8) and [Maven](https://maven.apache.org/install.html)

3. Build the examples:

    ```
    mvn package
    ``` 

### Run the examples


1. Run all the examples:

    ```
     mvn -q exec:java \
      -Dexec.mainClass="emp.RunAll" \
      -Dexec.args='jdbc:oracle:thin:ADMIN/mypassword@mydb_tp?TNS_ADMIN=/Users/test/Wallet_mydb'
    ```
    But replace the following values with your own:
    - Replace ``mypassword`` with the ``ADMIN`` password you specified when you created the database
    - Replace `/Users/test/Wallet_mydb` with the actual path to your wallet (see above) 
    - Replace `mydb_tp` with `[dbname]_tp` where dbname is the name of your database.  This is the name you chose when you created the database.  You can find the name in your wallet file `tnsnames.ora` if you have forgotten it.

2. Cleanup the examples:

    ```
     mvn -q exec:java \
      -Dexec.mainClass="emp.DropTable" \
      -Dexec.args='jdbc:oracle:thin:ADMIN/mypassword@mydb_tp?TNS_ADMIN=/Users/test/Wallet_mydb'
    ```

3. You can also run individual examples one at a time which is useful if you want to modify the code and rerun specific parts:

    ```
     mvn -q exec:java \
      -Dexec.mainClass="emp.CreateTable" \
      -Dexec.args='jdbc:oracle:thin:ADMIN/mypassword@mydb_tp?TNS_ADMIN=/Users/test/Wallet_mydb'
    ```
