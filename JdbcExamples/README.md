# JDBC and JSON in Oracle Database 23c 

This directory contains examples of how to store and access JSON type values in Oracle Database from a Java program. 

  * [movie.CreateTable](src/main/java/movie/CreateTable.java) - Creates the movie table `movie` used by all the examples.
  * [movie.Insert](src/main/java/movie/Insert.java) - Inserts three JSON values into the `movie` table.
  * [movie.GetAll](src/main/java/movie/GetAll.java) - Gets all the JSON values from the `movie` table.
  * [movie.Filter](src/main/java/movie/Filter.java) - Selects movies from the `movie` table where the salary attribute is greater than 30,000.
  * [movie.Filter2](src/main/java/movie/Filter2.java) - Selects movies from the `movie` table that have the `created` attribute.
  * [movie.Update](src/main/java/movie/Update.java) - Updates an movie record using whole document replacement.
  * [movie.UpdateMerge](src/main/java/movie/UpdateMerge.java) - Performs a partial update using JSON_MERGEPATCH().
  * [movie.UpdateTransform](src/main/java/movie/UpdateTransform.java) - Performs a partial update using JSON_TRANSFORM().
  * [movie.JSONP](src/main/java/movie/JSONP.java) - Inserts and retrieves a value using [JSON-P (javax.json)](https://javaee.github.io/jsonp/) interfaces.
  * [movie.JSONB](src/main/java/movie/JSONB.java) - Stores and retrieves a plain/custom Java object as JSON using [JSON-B (javax.json.bind)](https://javaee.github.io/jsonb-spec/).
  * [movie.Jackson](src/main/java/movie/Jackson.java) - Encodes JSON from an external source, in this case a Jackson parser, as Oracle binary JSON and inserts it into the table.
  * [movie.BinaryJson](src/main/java/movie/BinaryJson.java) - Encodes JSON text as Oracle binary JSON, stores it in a file, and then reads it back again.
  * [movie.RunAll](src/main/java/movie/RunAll.java) - Runs all the examples at once.
  * [movie.DropTable](src/main/java/movie/DropTable.java) - Drops the table used by the examples.

See also:
  * Documentation: [The API for JSON type in Oracle Database (oracle.sql.json)](https://javadoc.io/static/com.oracle.database.jdbc/ojdbc8/21.4.0.0/oracle/sql/json/package-summary.html#package.description)
  * Video (YouTube): [AskTom Office Hours: The Java API for JSON type in Oracle JDBC](https://youtu.be/jg5d15-2K3Y)

Need help, talk to us on Slack:
  * Join oracledevrel: https://join.slack.com/t/oracledevrel/shared_invite/zt-1h0fhz7f8-gHM298rFasYzlTn0Nii2sQ
  * Channel: #oracle-db-json

## Running the examples

### Create a database

These examples should be run against Oracle Database 23c.  
See:
[https://www.oracle.com/database/free/get-started/](https://www.oracle.com/database/free/get-started/)

### Setup the examples

1. Clone these examples from github.  For example:
    ```
    git clone https://github.com/oracle/json-in-db.git
    cd json-in-db/JdbcExamples/
    ```
    If you don't have `git` you can alternatively download them here:
    [https://github.com/oracle/json-in-db/archive/master.zip](https://github.com/oracle/json-in-db/archive/master.zip)
   
2. Install [Java](https://www.oracle.com/java/technologies/javase-downloads.html#JDK8) and [Maven](https://maven.apache.org/install.html)

3. Build the examples:

    ```
    mvn package
    ``` 

### Run the examples

1. Run all the examples:

    ```
     mvn -q exec:java \
      -Dexec.mainClass="movie.RunAll" \
      -Dexec.args='jdbc:oracle:thin:user/password@//localhost:1521/freepdb1'
    ```

2. Drop the table used by the examples:

    ```
     mvn -q exec:java \
      -Dexec.mainClass="movie.DropTable" \
      -Dexec.args='jdbc:oracle:thin:user/password@//localhost:1521/freepdb1'

    ```

3. You can also run specific examples, one at a time:

    ```
     mvn -q exec:java \
      -Dexec.mainClass="movie.CreateTable" \
      -Dexec.args='jdbc:oracle:thin:user/password@//localhost:1521/freepdb1'
    ```
