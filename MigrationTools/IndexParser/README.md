# JSON Index Parser

## Purpose
The purpose of this package is to help during migrations. Particularly in the index creation from Json format to oracle SQL, so this can be used with your collections.

## Some considerations

* This is a *PL/SQL* package that requires to be installed in you Oracle database.
* Before executing this package, you should migrate all your documents into the desired collection.
* **Small inputs are recommended**, otherwise the execution time can take longer than expected.

## Installation

1. Go to a SQL shell and run the `install.sql` file
```
SQL> @install.sql
```

## Demo

1. To use the PL/SQL package in a practical way, we require an Object Storage Bucket. Check [here](https://oracle-base.com/articles/vm/oracle-cloud-infrastructure-oci-create-an-object-storage-bucket).
    1. Remember to set **Visibility** to **Public**.
1. Add a file with the indexes descriptions. Example `shows.metadata.json`
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
3. Add the Json into a `indexes` collection
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
4. Get the SQL indexes from the main function of the package `ora_idx_parser.getSQLIndexes`
    1. The inputs for the functions are `collection_name` and the `index_spec`, both varchar2
    1. The index_spec can be an array with all the indexes or you can pass each index from the array as an object
    
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
5. The result of the function is a clob with the indexes parsed and comments with errors if a index cannot be parsed.
```
create index "$ora:shows.summary_1" on shows(
	json_value(data, '$.summary.stringOnly()' error on error null on empty) asc
, 1);

/* Execution finished: 1 indexes parsed, 0 failures in collection 'shows' */
```