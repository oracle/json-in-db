# Microservice using Spring Boot and the Autonomous JSON Database

This directory contains an example of how to create a SpringBoot microservice using the Autonomous Database. Spring Boot is a popular Java framework that can be used to create REST services with minimal coding. See [Spring Boot](https://spring.io/projects/spring-boot).  

# Prerequisites

This example works best if you run it from an OCI compute node that is in the same data center as the Autonomous Database it is connecting to.  Instructions on how to create an Autonomous Database and a compute node can be found here: [Using Oracle Database API for MongoDB](https://oracle.github.io/learning-library/data-management-library/database/json/mongodb-api/workshops/freetier/index.html). 
* Lab 1 - shows how to create a compute node.  The compute node created in this lab can also be used to run this Spring Boot example.  
* Lab 2 - shows how to provision an Autonomous JSON Database.  
* Lab 3 - shows how to connect to your database from the compute node using `mongosh`

Note, an *always-free* database and compute node are sufficient to run this example.

# Loading Data

This example service accesses real data from a bike sharing company. Oracle is not affiliated with this company.  We use their data in this example because they have cleanly exposed JSON data about their bike sharing stations (see [https://github.com/NABSA/gbfs/blob/master/gbfs.md](https://github.com/NABSA/gbfs/blob/master/gbfs.md))

Specifically, this example uses two of their data sets:

* *stations* - JSON data about each bike sharing station including things like its name, location, maximum capacity, etc.
* *status* - JSON data about the current state of a bike sharing station and includes data like the current number of bikes available.

To initially load these data sets, we will use `mongoimport`. You can obtain mongoimport as follows:

```
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-rhel70-x86_64-100.5.2.tgz
tar -xvf mongodb-database-tools-rhel70-x86_64-100.5.2.tgz
export PATH="`pwd`/mongodb-database-tools-rhel70-x86_64-100.5.2/bin/:$PATH"
```

Run the following commands on your compute node:

```
# substitute the actual URI of your database
export URI=mongodb://XXXYYYZZZ-DEMODB.adb.us-ashburn-1.oraclecloudapps.com:27017/admin?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true

# use jq (https://stedolan.github.io/jq/) to unwrap the nested documents and change
# the station_id field to _id
curl https://gbfs.citibikenyc.com/gbfs/en/station_information.json | \
jq -c '.data.stations[] | .["_id"] = .["station_id"] | del(.station_id)' | \
mongoimport -u ADMIN -p <password> --collection station --uri $URI

curl https://gbfs.citibikenyc.com/gbfs/en/station_status.json | \
jq -c '.data.stations[]' | \
mongoimport -u ADMIN -p <password> --collection status --uri $URI

```

If successful, you should have two collections in your database: station and status.  Note, you may want to run the status command a few times over time to get more interesting (varying) data to work with.  The data loaded is the state of the stations at the time the command is run.

# Viewing the data

You can view the data you just loaded in a web browser using Database Actions ([Lab 4](https://oracle.github.io/learning-library/data-management-library/database/json/mongodb-api/workshops/freetier/index.html?lab=dbactions))  or from the command line using `mongosh` ([Lab 3](https://oracle.github.io/learning-library/data-management-library/database/json/mongodb-api/workshops/freetier/index.html?lab=mongoshell)).  For example:

```
mongosh -u ADMIN -p <password> $URI
admin> show collections
station
status

admin> db.station.find({_id:120})
[
  {
    _id: '120',
    region_id: '71',
    lon: -73.95928168,
  ...
  
admin> db.station.updateOne({_id:120}, {$set:{capacity:24}});
...
admin> db.station.find({_id:120});
```

# Building the service

Install Java, maven, and git:
```
 sudo yum install maven java-17-openjdk git
 export JAVA_HOME=/usr/lib/jvm/jre-17/
 export PATH=$JAVA_HOME/bin:$PATH
```

Clone this repository:

```
git clone https://github.com/oracle/json-in-db.git
```

Build the service:

```
cd json-in-db/MongoExamples/SpringBoot/
mvn clean package
```

# Running the service

To start the service, run the following command:

```
java -jar ./target/bikes-0.0.1.jar \
   --spring.data.mongodb.uri='mongodb://ADMIN:<password>@XXXYYYZZZ-DEMODB.adb.us-ashburn-1.oraclecloudapps.com:27017/admin?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true' \
   --spring.data.mongodb.database=admin 
```

But substitute the value of `uri` with your actual connection string.  These properties can alternatively be set from [application.properties](src/main/resources/application.properties).

# Testing the service

By running the previous command in the background or by starting a 
new shell process, you can test the service using cURL:

```
# get station with id 120
curl http://localhost:8080/station/120
{
  "name" : "Lexington Ave & Classon Ave",
  "region_id" : "71",
  "lon" : -73.95928168,
  "lat" : 40.68676793,
  ...

# get the status data for station 120
curl  http://localhost:8080/status/search/findByStationId/?id=120 
"_embedded" : {
  "status" : [ {
    "station_id" : "120",
    "num_bikes_available" : 2,
   ..

# atomically delete station 120 and all associated status documents using a transaction
curl -i -X DELETE http://localhost:8080/station/120
 HTTP/1.1 200 
 ...

# station 120 is no longer found 
curl -i http://localhost:8080/station/120
 HTTP/1.1 404 
 ...
```




