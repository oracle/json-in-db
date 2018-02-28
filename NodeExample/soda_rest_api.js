/* ================================================
 *
 * Copyright (c) 2016 Oracle and/or its affiliates.  All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * ================================================
 */

"use strict";

const fs = require('fs');
const http = require('http');
const uuidv4 = require('uuid/v4');
const request = require('request-promise-native');

const constants = require('./constants.js');
// const docStore = require('./docStore_api.js');
const errorLibrary = require('./error_library.js');

const driverName = "SODA-REST"

module.exports.initialize                  = initialize
module.exports.setDatabaseName             = setDatabaseName
module.exports.getSupportedFeatures        = getSupportedFeatures
module.exports.getDBDriverName             = getDBDriverName
module.exports.processError                = processError
module.exports.getDocumentContent          = getDocumentContent
module.exports.getCollection               = getCollection
module.exports.queryByExample              = queryByExample
module.exports.postDocument                = postDocument
module.exports.bulkInsert                  = bulkInsert
module.exports.putDocument                 = putDocument
module.exports.deleteDocument              = deleteDocument
module.exports.createIndex                 = createIndex
module.exports.createIndexes               = createIndexes
module.exports.collectionExists            = collectionExists
module.exports.createCollection            = createCollection
module.exports.collectionNotFound          = collectionNotFound 
module.exports.dropCollection              = dropCollection

let applicationName   
let connectionProperties = {}
let collectionMetadata   = {}
let documentStoreURL     = "";
let sodaPath             = "";
let docStore             = undefined
const supportedFeatures  = {}

function writeLogEntry(module,comment) {
	
const message = ( comment === undefined) ? module : `${module}: ${comment}`
  console.log(`${new Date().toISOString()}: ${driverName}.${message}`);
}

function getDBDriverName() {
	
   return driverName
   
}

function getConnectionProperties() {

  return connectionProperties;

}

function getCollectionMetadata(collectionName) {

  let metadata = collectionMetadata[collectionName];
  if (metadata != null) {
    metadata = Object.assign({},metadata);
    delete(metadata.indexes);
  }
  return metadata

}

function setSodaPath(ordsRoot, schemaName, sodaRoot) {
	
  sodaPath = `${ordsRoot}/${schemaName.toLowerCase()}/${sodaRoot}`;

}

function setDatabaseName(databaseName) {
	
	
  setSodaPath(connectionProperties.ordsRoot,databaseName,connectionProperties.sodaRoot);

}

function getSodaPath() {
	
  return sodaPath;
  
}

function getCollectionLink(collectionName) {

  return `${getSodaPath()}/${collectionName}`;

}

function getDocumentLink(collectionName,key) {

  return `${getCollectionLink(collectionName)}/${key}`;

}

function setHeaders(contentType, etag) {

   var headers = {};

   if (contentType === undefined) {
     contentType = 'application/json';
   }

   if (contentType !== null) {
     headers['Content-Type'] = contentType;
   }

   if (etag !== undefined) {
     headers["If-Match"] = etag;
   }

   return headers;
}

function getLimitAndFields(queryProperties, limit, fields, includeTotal) {

  if (fields === undefined) {
    fields = 'all';
  }

  queryProperties.fields = fields;

  if (limit !== undefined) {
    queryProperties.limit = limit;
  }

  if (includeTotal) {
    queryProperties.totalResults = true;
  }

  return queryProperties;
}

function processError(invokerId, logRequest, e) {

  const moduleId = `processError()`;
  // writeLogEntry(moduleId,JSON.stringify(e));
  
  if ((e.statusCode) && (e.error) && (typeof e.error === "string")) {
	try {
      e.error = JSON.parse(e.error);
	} catch (e) {}
  }

  const details = { driver           : driverName
                  , module           : invokerId
				  , elapsedTime      : e.elapsedTime ? e.elapsedTime : new Date().getTime() - logRequest.startTime 
                  , request          : logRequest.logEntry ? logRequest.logEntry.request : null
                  , stack            : logRequest.logEntry.stack ? logRequest.logEntry.stack : null
                  , underlyingCause  : errorLibrary.makeSerializable(e)
                  , status           : docStore.interpretHTTPStatusCode(e.statusCode) 
                  }

  return new errorLibrary.GenericException(`${driverName}: Unexpected exception encountered`,details)
  
}

async function sendRequest(invokerId, sessionState, options, logContainer) {

  const moduleId = `${invokerId}.sendRequest("${options.method}","${options.uri}")`;
  // writeLogEntry(moduleId);
  
  options.resolveWithFullResponse = true
  options.simple = true
 
  if (getConnectionProperties().useProxy) {
    options.proxy = `http://${getConnectionProperties().proxy.hostname}:${getConnectionProperties().proxy.port}`
  }
  
  logContainer.logRequest = docStore.createLogRequest(moduleId, sessionState, options)
	
  let startTime = null
  try {	
    startTime = new Date().getTime()
    const rawResponse = await request(options).auth(getConnectionProperties().username, getConnectionProperties().password, true);
	// mwriteLogEntry(moduleId,`Success : HTTP statusCode = ${rawResponse.statusCode} Elapsed time: ${rawResponse.elapsedTime}`);
	// writeLogEntry(moduleId,`Response:\n"${JSON.stringify(rawResponse.toJSON()," ",2)}`)
	
	// elapsedTime is lost for PUT and POST when calling toJSON()
	const response = rawResponse.toJSON()
	response.elapsedTime = rawResponse.elapsedTime
    return response
  } catch (e) {
	const endTime = new Date().getTime();
	if (e.elapsedTime === undefined) {
	  e.elapsedTime = endTime - startTime
	}
	
	if (typeof e.toJSON === 'function') {
      const elapsedTime = e.elapsedTime
	  e = e.toJSON()
	  e.elapsedTime = elapsedTime
	}
	// writeLogEntry(moduleId,`Exception:\n"${JSON.stringify(e," ",2)}`);
	throw processError(moduleId,logContainer.logRequest,e);
  }    					 
}

async function processQuery(sessionState, options, limit) {
  
  const moduleId = `processQuery()`
  
  const logContainer = {}
  
  const startTime = new Date().getTime()
  const results = await sendRequest(moduleId, sessionState, options, logContainer);

  if (sessionState.sqlTrace) {
	sessionState.qbeRewrite = results.body.sqlStatement
  }
  
  if ((limit !== 'unlimited') && (limit === 0)) {
	results.body.items = []
	results.body.count = 0
  }
  else {
	if ((limit === 'unlimited') || (results.body.count < limit)) {
	  let batchCount = 1;
      while (results.body.hasMore) {
		batchCount++
		if (limit !== 'unlimited') {
		  options.qs.limit = limit - results.body.count
		}
	    options.qs.offset = results.body.count
        const moreResults = await sendRequest(moduleId, sessionState, options, logContainer);
        if (sessionState.sqlTrace) {
	      sessionState.qbeRewrite = moreResults.body.sqlStatement
        }
	    results.body.items = results.body.items.concat(moreResults.body.items);
	    results.body.count = results.body.items.length
		results.body.hasMore = moreResults.body.hasMore
		if (results.body.count === limit) {
		  break;
	    }
      }
      logContainer.logRequest.endTime = new Date().getTime()
      logContainer.logRequest.startTime = startTime
	  results.elapsedTime = logContainer.logRequest.endTime - logContainer.logRequest.startTime
      logContainer.logRequest.batchCount = batchCount
    } 
  }
  
  return docStore.processResultsHTTP(moduleId, results, logContainer.logRequest);    

}
async function getSupportedFeatures() {
  
  /*
  ** Test for $CONTAINS support
  */
  
  const moduleId = `getSupportedFeatures()`
 
  if (Object.keys(supportedFeatures).length > 0) {
	 return supportedFeatures
  }
  				   
  var collectionName = 'TMP_' + uuidv4();

  try {
    const sodaResponse = await createCollection(constants.DB_LOGGING_DISABLED, collectionName);
	
    var indexDef = {
          name         : "TEST_IDX"
        , unique       : true
        , fields       : [{
            path       : "id"
          , datatype : "number"
          , order    : "asc"
          }]
        }

    supportedFeatures.nullOnEmptySupported = true;
	try {
      await createIndex(constants.DB_LOGGING_DISABLED, collectionName, indexDef.name, indexDef);
	}
	catch (sodaError) {
      if (sodaError.status === constants.BAD_REQUEST) {
        var sodaException = sodaError.details.underlyingCause.error;
        if (sodaException['o:errorCode'] === 'SQL-00907') {
          supportedFeatures.nullOnEmptySupported = false;
		} else {
		  throw sodaError;
		}
      }	
      else {
        throw sodaError;
      }		
    }	

    var qbe = {id : {"$contains" : 'XXX'}}

    supportedFeatures.$containsSupported = true;
    try {
      await queryByExample(constants.DB_LOGGING_DISABLED, collectionName, qbe)
    }
    catch (sodaError) {
      if (sodaError.status === constants.BAD_REQUEST) {
        var sodaException = sodaError.details.underlyingCause.error;
        if (sodaException.title === 'The field name $contains is not a recognized operator.') {
          supportedFeatures.$containsSupported = false;
        }
		else {
		  throw sodaError;
		}
      }	
      else {
        throw sodaError;
      }		
    }

    var qbe = {
          geoCoding          : {
            $near            : {
              $geometry        : {
                 type        : "Point",
                 coordinates : [-122.12469369777311,37.895215209615884]
              },
              $distance      : 5,
              $unit          : "mile"
            }
          } 
        }

    supportedFeatures.$nearSupported = true;
    try {
      await queryByExample(constants.DB_LOGGING_DISABLED, collectionName, qbe)
    }
    catch (sodaError) {
      if (sodaError.status === constants.BAD_REQUEST) {
        var sodaException = sodaError.details.underlyingCause.error;
        // writeLogEntry(moduleId,'Error: ' + JSON.stringify(sodaException));
        // if (sodaException['o:errorCode'] === 'SODA-02002') {
        if (sodaException.title === 'The field name $near is not a recognized operator.') {
          supportedFeatures.$nearSupported = false;
		} else {
		  throw sodaError;
		}
      }	
      else {
        throw sodaError;
      }		
    }

    /*
    ** Create Text Index with language specification (12.2 Format with langauge and dataguide)
    **
    ** ToDo : Can we use alternative index metadata if we encounter "DRG-10700: preference does not exist: CTXSYS.JSONREST_ENGLISH_LEXER"
    **
    */

    var indexDef = {
          name      : "FULLTEXT_INDEX"
        , dataguide : "on"
        , language  : "english"
        }
            
    supportedFeatures.textIndexSupported = true;
	try {
		await createIndex(constants.DB_LOGGING_DISABLED, collectionName, indexDef.name, indexDef)
	}
	catch (sodaError) {
	  console.log(sodaError)
      if ((sodaError.status === constants.FATAL_ERRROR)) {
        var sodaException = sodaError.details.underlyingCause.error;
        if (sodaException['o:errorCode'] === 'SQL-29855') {
          supportedFeatures.textIndexSupported = false;
		} else {
		  throw sodaError;
		}
      }	
      else {
        throw sodaError;
      }		
    }
	
    await dropCollection(constants.DB_LOGGING_DISABLED, collectionName);
	
    writeLogEntry(moduleId,`$contains operator supported:  ${supportedFeatures.$containsSupported}`);
    writeLogEntry(moduleId,`$near operatator   supported:  ${supportedFeatures.$nearSupported}`);
    writeLogEntry(moduleId,`Text Index         supported:  ${supportedFeatures.textIndexSupported}`);
    writeLogEntry(moduleId,`"NULL ON EMPTY"    supported:  ${supportedFeatures.nullOnEmptySupported}`);
	
	return supportedFeatures
  }
  catch(err) {
    writeLogEntry(moduleId,`Exception encountered at:\n${err.stack ? err.stack : err}`);
    throw err;
  };

}

async function initialize(appName, ds) {

  const moduleId = `initialize()`

  if (Object.keys(connectionProperties).length === 0) {
  	
    try {
	  if ((appName === undefined) || (appName === null)) {
		 throw new Error (`${moduleId}: Application name is NULL or undefined.`)
	  }
	  if ((ds === undefined) || (ds === null)) {
		 throw new Error (`${moduleId}: Document Store object is NULL or undefined.`)
	  }
	  applicationName = appName
	  docStore = ds;
      const connectionDetails = fs.readFileSync(`${__dirname}/${applicationName}.connectionProperties.soda.json`);
      connectionProperties = JSON.parse(connectionDetails);

      const collectionDetails = fs.readFileSync(`${__dirname}/${applicationName}.collectionMetadata.soda.json`);
      collectionMetadata    = JSON.parse(collectionDetails);
  
      documentStoreURL = `${connectionProperties.protocol}://${connectionProperties.hostname}`
      if (connectionProperties.port !== null) {
        documentStoreURL =  `${documentStoreURL}:${connectionProperties.port}`
      }

	  setSodaPath(connectionProperties.ordsRoot,connectionProperties.schemaName,connectionProperties.sodaRoot);
	
      writeLogEntry(moduleId,`Document Store URL = "${documentStoreURL}".`);

	  await getSupportedFeatures()
	
    } catch (e) {
      const details = {
              module           : moduleId
            , applicationName  : applicationName
            , underlyingCause  : errorLibrary.makeSerializable(e)
            }
      throw new errorLibrary.GenericException(`${driverName}: Driver Intialization Failure`,details)
    }
  }
}

async function getDocumentContent(sessionState, collectionName, key, binary, etag) {

  const moduleId = `getDocumentContent("${collectionName}","${key}")`;

  const options = { method  : 'GET'
                  , baseUrl : documentStoreURL
                  , uri     : getDocumentLink(collectionName,key)
                  , headers : setHeaders(null, etag)
                  , time    : true
                  };

  if (binary) {
    options.encoding = null;
  }

  const logContainer = {}
  const results = await sendRequest(moduleId, sessionState, options, logContainer);
  return docStore.processResultsHTTP(moduleId, results, logContainer.logRequest);
}

async function getCollection(sessionState, collectionName, limit, fields, includeTotal) {

  const moduleId = `getCollection("${collectionName}")`;

  let sodaLimit = limit
  if ((limit !== undefined) && (limit === 0)) {
	sodaLimit = 1
  }

  const options = { method  : 'GET'
                  , baseUrl : documentStoreURL
                  , uri     : getCollectionLink(collectionName)
                  , qs      : getLimitAndFields({}, sodaLimit, fields, includeTotal)
                  , headers : setHeaders()
                  , time    : true
                  , json    : true
                  };

  return processQuery(sessionState,options,limit)

}

async function queryByExample(sessionState, collectionName, qbe, limit, fields, includeTotal) {

  const moduleId = `queryByExample("${collectionName}","${JSON.stringify(qbe)}")`;
  // writeLogEntry(moduleId);

  const options = { method  : 'POST'
                  , baseUrl : documentStoreURL
                  , uri     : getCollectionLink(collectionName)
                  , qs      : getLimitAndFields({action : "query"}, limit, fields, includeTotal)
                  , json    : qbe
                  , time    : true
                  };

  if (sessionState.sqlTrace) {
	 options.qs["sqlStatement"] = true
  }
  return processQuery(sessionState,options,limit)
}

async function postDocument(sessionState, collectionName, document, contentType) {

  const moduleId = `postDocument("${collectionName}","${contentType}")`;
  
  const options = { method  : 'POST'
                  , baseUrl : documentStoreURL
                  , uri     : getCollectionLink(collectionName)
                  , headers : setHeaders(contentType , undefined)
                  , time    : true
                  };

  if (contentType === 'application/json') {
    options.json = document
  }
  else {
    options.body = document
  }

  
  const logContainer = {}
  const results = await sendRequest(moduleId, sessionState, options, logContainer);
  
  // Appears BODY is a string when the payload was not JSON
  return docStore.processResultsHTTP(moduleId, results, logContainer.logRequest);  
}

async function bulkInsert(sessionState, collectionName, documents) {

  const moduleId = `bulkInsert("${collectionName}")`;
  
  const options = { method  : 'POST'
                  , baseUrl : documentStoreURL
                  , uri     : getCollectionLink(collectionName)
                  , qs      : {action : 'insert'}
                  , json    : documents
                  , time    : true
                  };

  const logContainer = {}
  const results = await sendRequest(moduleId, sessionState, options, logContainer);
  return docStore.processResultsHTTP(moduleId, results, logContainer.logRequest);  
}

async function putDocument(sessionState, collectionName, key, document, contentType, etag) {

  const moduleId = `putDocument("${collectionName}","${key}","${contentType}")`;

  const options = { method  : 'PUT'
                  , baseUrl : documentStoreURL
                  , uri     : getDocumentLink(collectionName,key)
                  , headers : setHeaders(contentType , etag)
                  , time    : true
                  };

  if (contentType === 'application/json') {
    options.json = document
  }
  else {
    options.body = document
  }

  const logContainer = {}
  const results = await sendRequest(moduleId, sessionState, options, logContainer);

  const updateResponse = { id             : key
                         , etag           : results.headers.etag
						 , lastModified   : results.headers["last-modified"]
                         , location       : results.headers.location
                         }
						 
  results.body = docStore.formatSingleInsert(updateResponse)
  return docStore.processResultsHTTP(moduleId, results, logContainer.logRequest);  
}

async function deleteDocument(sessionState, collectionName, key, etag) {

  const moduleId = `deleteDocument("${collectionName}","{key}")`;
  writeLogEntry(moduleId)
  
  const options = { method  : 'DELETE'
                  , baseUrl : documentStoreURL
                  , uri     : getDocumentLink(collectionName,key)
                  , headers : setHeaders(undefined, etag)
                  , time    : true
                  };

  const logContainer = {}
  const results = await sendRequest(moduleId, sessionState, options, logContainer);
  return docStore.processResultsHTTP(moduleId, results, logContainer.logRequest);  
}


async function createIndex(sessionState, collectionName, indexName, indexMetadata) {

  const moduleId = `createIndex("${collectionName}","${indexName}")`;
  
  // Skip Spatial Indexes in environments where spatial operations on Geo-JSON are not supported

  if ((indexMetadata.spatial) && !supportedFeatures.$nearSupported) {
    writeLogEntry(moduleId,'Skipped creation of unsupported spatial index')
    return constants.HTTP_RESPONSE_SUCCESS
  }

  // Skip Text Indexes in environments where text index syntax is not supported

  if ((indexMetadata.language) && !supportedFeatures.textIndexSupported) {
    writeLogEntry(moduleId,'Skipped creation of unsupported text index' || indexMetadata.name);
    return constants.HTTP_RESPONSE_SUCCESS
  }
  
  // Remove the Singleton Key from the index definition if we are in a Pre 12.2 database

  if ((!supportedFeatures.nullOnEmptySupported) && (indexMetadata.fields !== undefined) && (!indexMetadata.scalarRequired))  {
    indexMetadata.scalarRequired = true;
  }

  const options = { method  : 'POST'
                  , baseUrl : documentStoreURL
                  , uri     : getCollectionLink(collectionName)
                  , qs      : {action : 'index'}
                  , json    : indexMetadata
                  , time    : true
                  };

  const logContainer = {}
  const results = await sendRequest(moduleId, sessionState, options, logContainer);
  return docStore.processResultsHTTP(moduleId, results, logContainer.logRequest);
}

function getIndexMetadata(collectionName) {

  const metadata = collectionMetadata[collectionName];
  if ((metadata != null) && (metadata.hasOwnProperty('indexes'))) {
    const indexes = metadata.indexes.slice(0)
    // Remove disabled Indexes
    for (let i=0; i < indexes.length; /* i is only incremented when not splicing */  ) {
      if ((indexes[i].hasOwnProperty('disabled')) && (indexes[i].disabled === true))  {
        indexes.splice(i,1);
      }
      else {
        delete(indexes[i].disabled);
        i++;
      }
    }
    return indexes;
  }
  return []
}

async function createIndexes(sessionState, collectionName) {

  const moduleId = 'createIndexes("' + collectionName + '")';
  
  const indexes = getIndexMetadata(collectionName);
  
  const createIndexOperations = indexes.map(function(indexMetadata) {
	                                          return docStore.createIndex(sessionState,collectionName,indexMetadata.name,indexMetadata)
                                           })

  const logRequest = docStore.createLogRequest(moduleId, sessionState, indexes)

  logRequest.startTime = new Date().getTime();
  const createIndexResults = await Promise.all(createIndexOperations)
  logRequest.endTime = new Date().getTime()
  const results = Object.assign({},constants.HTTP_RESPONSE_SUCCESS)
  results.elapsedTime = logRequest.endTime - logRequest.startTime
  results.json = createIndexResults
  return docStore.processResultsHTTP(moduleId, results, logRequest);  

}

function collectionExists(e) {
	
  return true;

}

async function createCollection(sessionState, collectionName) {

  const moduleId = `createCollection("${collectionName}")`;
  
  const options = { method  : 'PUT'
                  , baseUrl : documentStoreURL
                  , uri     : getCollectionLink(collectionName)
                  , json    : getCollectionMetadata(collectionName)
                  , time    : true
                  };

  const logContainer = {}
  const results = await sendRequest(moduleId, sessionState, options, logContainer);
  return docStore.processResultsHTTP(moduleId, results, logContainer.logRequest);  
}

function collectionNotFound(e) {

  if ((e.status) && (e.status === constants.NOT_FOUND)) {
    if ((e.details) && (e.details.underlyingCause)) {
	  const sodaError = e.details.underlyingCause
	  if ((sodaError.statusCode) && (sodaError.statusCode === 404) && (sodaError.error) && (sodaError.error['o:errorCode'] === 'REST-02000')) {
        return true;
	  }
    }
  }
  return false;
}

async function dropCollection(sessionState, collectionName) {

  const moduleId = `dropCollection("${collectionName}")`;
  
  const options = { method  : 'DELETE'
                  , baseUrl : documentStoreURL
                  , uri     : getCollectionLink(collectionName)
                  , time    : true
                  };

  const logContainer = {}
  try {
    const results = await sendRequest(moduleId, sessionState, options, logContainer);
    return docStore.processResultsHTTP(moduleId, results, logContainer.logRequest);
  } catch (e) {
 	if (collectionNotFound(e)) {
      writeLogEntry(moduleId,`NOT-FOUND: ${e.status}. Returning success.`)
	  const results = Object.assign({},constants.HTTP_RESPONSE_SUCCESS)
	  results.elapsedTime = e.elapsedTime
      return docStore.processResultsHTTP(moduleId, results, logContainer.logRequest);
    }
	throw processError(moduleId,logContainer.logRequest,e);	
  }
}
