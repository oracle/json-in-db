# JSON Index Parser

## Purpose
The purpose of this package is to help migrating indexes from MongoDB to Oracle Database collections. 

## Some considerations

* This is a *PL/SQL* package that may be installed in Oracle Database.
* Before using this package, you should migrate all your data from MongoDB to Oracle Database using the Oracle API for MongoDB and mongorestore.  
See: [Oracle Database API for MongoDB](https://docs.oracle.com/en/database/oracle/mongodb-api/mgapi/oracle-database-api-mongodb.pdf)
* This package will scan all your data and suggest SQL indexes to create based on a combination of your MongoDB index definitions and the actual data types used.
* If your data is large, running this package may take some time as it must scan all of your collection data. 

## Installation

Go to a SQL shell and run the `install.sql` file
```
SQL> @install.sql
```

## Example Usage

1. The index definitions that were created during execution of mongodump may be uploaded to the Oracle Object Store
See [Overview of Object Storage](https://docs.oracle.com/en-us/iaas/Content/Object/Concepts/objectstorageoverview.htm).
The index definition files end with `.metadata.json`.  For example `shows.metadata.json`
	```
	{
	    "indexes": [
	        {
	            "v": {
	                "$numberInt": "2"
	            },
	            "key": {
	                "summary": {
	                    "$numberInt": "1"
	                }
	            },
	            "name": "summary_1"
	        },
	        .
	        .
	        .
	    ],
	    "uuid": "389308a0df2146e1bd45c88692d806da",
	    "collectionName": "shows",
	    "type": "collection"
	}
	```
 
2. Copy the index definitions from the Object Store into an `indexes` collection
	```
	BEGIN 
	  DBMS_CLOUD.COPY_COLLECTION(    
	    collection_name => 'indexes',    
	    file_uri_list => 'https://objectstorage.url.com/n/yz6dzkwrrw66/b/demo_idx/o/*.metadata.json',
	    format => '{"recorddelimiter" : "0x''01''", "maxdocsize" : "10240000", "type":"ejson"}'
	  );
	END;
	/
	```
If your Object Store bucket is not public, you must also specify a credential.  See:
[Load JSON on Autonomous Database](https://docs.public.oneportal.content.oci.oraclecloud.com/en-us/iaas/autonomous-database-serverless/doc/load-data-cloud-json.html#GUID-1BD92A34-C54A-4A35-8DC6-73430CB48F93)

3. Execute the function `ora_idx_parser.getSQLIndexes` to get the SQL index definitions. The function takes two input parameters:
   - `collection_name` (varchar2) - the name of the collection to generate indexes for
   - `index_spec` (varchar2) - the MongoDB index definitions.  This may be a JSON array with all the indexes from the index metadata file or a single index definition.

	```
	-- Pass as an array
	select doc as spec, ora_idx_parser.getSQLIndexes(collectionName, doc) as SQL_Idx
	from "INDEXES", json_table(
	    json_document, '$' columns (
	        collectionName, 
	        nested '$.indexes[*]' columns(doc format json path '$')
	    )
	);
	```
	```
	-- Pass each object from the indexes array
	select  ora_idx_parser.getSQLIndexes(collectionName, indexes) as SQL_Idx
	from "INDEXES", json_table(
	    json_document, '$' columns (
	        collectionName, indexes format json 
	    )
	);
	```
 
4. The result of the function is a clob containing the SQL "create index" statements that should be executed.  That is, the function does not actually create indexes on the collection but generates statments that may be executed subsequently.  The result may also contain error messages if an index could not be converted.

Example result:

```
	create index "$ora:shows.summary_1" on shows(
		json_value(data, '$.summary.stringOnly()' error on error null on empty) asc
	, 1);

	/* Execution finished: 1 indexes parsed, 0 failures in collection 'shows' */
```
