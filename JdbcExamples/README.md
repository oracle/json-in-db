# JDBC and JSON in Oracle Database 20c

This directory contains examples on how to store and access JSON type values in Oracle Database.   JDBC 20c introduces a new package for working with JSON type values in Oracle Database.  For documentation, see: <br>
[oracle.sql.json](https://docs.oracle.com/en/database/oracle/oracle-database/20/jajdb/oracle/sql/json/package-summary.html)

## Running the examples

1. Create a 20.3 database.  Instructions: <br>
   https://blogs.oracle.com/jsondb/how-to-get-an-oracle-20c-preview-release-on-the-oracle-cloud-and-how-to-connect-to-it-with-sql-developer

2. Clone the examples from github.  For example:
   ```
   git clone https://github.com/oracle/json-in-db.git
   cd json-in-db/JdbcExamples/
   ```
3. Install [Java](https://www.oracle.com/java/technologies/javase-downloads.html#JDK8) and [Maven](https://maven.apache.org/)

4. Copy the JDBC jar from from the database and add it to your local Maven repository

   ```
   sftp -i ./key \
       opc@123.256.256.123:/u01/app/oracle/product/20.0.0/dbhome_1/jdbc/lib/ojdbc8.jar ojdbc8.jar

   mvn -X install:install-file -Dfile=ojdbc8.jar -Dpackaging=jar \
       -DgroupId=com.oracle.database.jdbc -DartifactId=ojdbc8 -Dversion=20.3.0.0
   ```

5. Build the examples:

   ```
   mvn package
   ```

6. Run the example:

   ```
    mvn -q exec:java \
     -Dexec.mainClass="emp.CreateTable" \
     -Dexec.args="jdbc:oracle:thin:user/pass@123.256.256.123:1521/mydb_pdb1.sub1234567890.demonet.oraclevcn.com"
   ```
  You can get the actual connection string information in the cloud console.  This example runs the `emp.CreateTable` example.  The following examples are also included:

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
