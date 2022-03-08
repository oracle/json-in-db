# Example - loading dump files

This directory contains an example of how to transform and load 
JSON dump files into the Autonomous JSON Database.
Specifically, it uses a dump file from 
[DynamoDB](https://docs.aws.amazon.com/dynamodb/index.html).

## Prerequsites

This example assumes you have created an Autonomous JSON Database
and have installed Java and Maven.  Detailed instructions can
be found here: [MongoExamples](https://github.com/oracle/json-in-db/tree/master/MongoExamples)

## Overview

DynamoDB has a data export feature:<br/>
[https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DataExport.Output.html](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DataExport.Output.html)

This feature allows you to export tables to line-delimited JSON files in S3.
The export files contain a line with a JSON object for each row in the table. 
DynamoDB has data types which are not in standard JSON so it adds
"annotation objects" to the exported data that describe the type of the value.  For
example, an object representing a person in standard JSON might look
as follows:

```
  {"name" : "John", "age" : 47}
```

This same data, when exported from DynamoDB would be:

```
  {"name" : {"S" : "John"}, "age" : {"N" : "47"}}
```

The steps below will run a small Java program to remove these annotations
before inserting the data into the Autonomous JSON Database.


## Step 1: export data

Export your data to obtain a compressed, line-delimited JSON file as described here:
[https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DataExport.Output.html](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DataExport.Output.html)

If you want to skip this step, you can use the example file included here:<br/>
[data/tsbjkabcrunxjklwod7noqdy.json.gz](data/tsbjkabcrunxjklwod7noqdy.json.gz)

## Step 2: build the example

Compile the example code in this directory.

```
mvn clean install
```

This will produce a jar: `target/DynamoToEJson.jar`

You can optionally test the jar as follows:

```
> echo ' {"name" : {"S" : "John"}, "age" : {"N" : "47"}}' | java -jar target/DynamoToEJson.jar
{"name":"John","age":47}

> gunzip --stdout ./data/tsbjkabcrunxjklwod7noqdy.json.gz
{"Item":{"id":{"S":"d1"},"stringSet":{"SS":["s3","s1","s2"]},"numberValue":{"N":"123.456"},"numberValue2":{"N":"123"},...
{"Item":{"id":{"S":"d3"},"stringSet":{"SS":["s3","s1","s2"]},"numberValue":{"N":"3464"},"numberValue2":{"N":"28391874367839"},...
{"Item":{"id":{"S":"d2"},"stringSet":{"SS":["s3","s1","s2"]},"numberValue":{"N":"8888"},"numberValue2":{"N":"434.23432"},...

> gunzip --stdout ./data/tsbjkabcrunxjklwod7noqdy.json.gz | java -jar target/DynamoToEJson.jar
{"id":"d1","stringSet":["s3","s1","s2"],"numberValue":123.456,"numberValue2":123,
{"id":"d3","stringSet":["s3","s1","s2"],"numberValue":3464,"numberValue2":28391874367839,
{"id":"d2","stringSet":["s3","s1","s2"],"numberValue":8888,"numberValue2":434.23432,

```

## Step 3: load the data

To load the data into the Autonomous JSON Database, we will use `mongoimport`.

```
gunzip --stdout ./data/tsbjkabcrunxjklwod7noqdy.json.gz | \
java -jar target/DynamoToEJson.jar | \
mongoimport --uri 'mongodb://admin:<password>!@NNRTBQRBDZWLH1O-XYZ.adb.us-phoenix-1.oraclecloudapps.com:27016/admin?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false' --collection=example --writeConcern '{w:0}'
```

* `gunzip` uncompresses the file and prints it to standard output
* The example code in [DynamoToEJson.java](src/main/java/example/DynamoToEJson.java) removes the annotations and prints the modified objects to standard output
* `mongoimport` reads the output and loads it into a collection named `example`

After running the above command, you should see your data in the collection without the DynamoDB type annotations:

```
  mongosh ...
  admin> db.example.find().limit(1);
  [
    {
      _id: ObjectId("62150acf797fba6cffc81bdc"),
      mapValue: { f2: 456, f3: { hello: 'world' }, f1: 's1' },
      binaryValue: Binary(Buffer.from("68656c6c6f776f726c64", "hex"), 0),
      listValue: [ 's1', 0 ],
      numberValue: 123.456,
      stringSet: [ 's3', 's1', 's2' ],
      numberValue2: 123,
      stringValue: 'hello world',
      numberSet: [ 1.34, 3, 2 ],
      booleanValue: false,
      nullValue: null,
      id: 'd1',
      binarySet: [
        Binary(Buffer.from("627965", "hex"), 0),
        Binary(Buffer.from("68656c6c6f776f726c64", "hex"), 0)
      ]
    }
  ]
```
