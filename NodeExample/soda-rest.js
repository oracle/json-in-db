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

var http = require('http');
var request = require('request');

module.exports.SodaError                   = SodaError;
module.exports.createCollection            = createCollection
module.exports.createIndexes               = createIndexes
module.exports.createCollectionWithIndexes = createCollectionWithIndexes
module.exports.recreateCollection          = recreateCollection
module.exports.dropCollection              = dropCollection
module.exports.dropCollectionCatch404      = dropCollectionCatch404
module.exports.bulkInsert                  = bulkInsert
module.exports.postJSON                    = postJSON
module.exports.postJSONCatch404            = postJSONCatch404
module.exports.postDocument                = postDocument
module.exports.postDocumentCatch404        = postDocumentCatch404
module.exports.putJSON                     = putJSON
module.exports.putDocument                 = putDocument
module.exports.deleteJSON                  = deleteDocument
module.exports.deleteDocument              = deleteDocument
module.exports.getCollection               = getCollection
module.exports.getJSON                     = getJSON
module.exports.getDocument                 = getDocument
module.exports.getBinaryDocument           = getBinaryDocument
module.exports.queryByExample              = queryByExample
module.exports.getDetectedFeatures         = getDetectedFeatures
module.exports.recreateLoadIndex           = recreateLoadIndex

module.exports.initialize                  = initialize

var textIndexSupported        = true;
var $containsSupported        = true;
var $nearSupported            = true;
var nullOnEmptySupported      = true;

var collectionProperties = {}
var connectionProperties = {}
var documentStoreRoot     = "";

function writeLogEntry(module,message) {
  module = ( message === undefined) ? module : module + ": " + message
  console.log(new Date().toISOString() + ": sodaRest." + module);
}

function initialize(connectionProps, collectionProps) {

  var moduleId = 'initialize()'

  connectionProperties = connectionProps;
  collectionProperties = collectionProps;

  if (connectionProperties.port === null) {
    documentStoreRoot = connectionProperties.protocol + "://" + connectionProperties.hostname + connectionProperties.path + "/"
  }
  else {
    documentStoreRoot = connectionProperties.protocol + "://" + connectionProperties.hostname + ":" + connectionProperties.port + connectionProperties.path + "/"
  }

  writeLogEntry(moduleId,'Document Store URI = "' + documentStoreRoot + '".');
  return featureDetection();

}

function getConnectionProperties() {

  return connectionProperties;

}

function getCollectionProperties(collectionName) {

  var properties = collectionProperties[collectionName];
  if (properties != null) {
    properties = JSON.parse(JSON.stringify(properties))
    delete(properties.indexes);
  }
  return properties

}

function getIndexProperties(collectionName) {

  var properties = collectionProperties[collectionName];
  if ((properties != null) && (properties.hasOwnProperty('indexes'))) {

    var indexes = JSON.parse(JSON.stringify(properties.indexes));
    // Remove disabled Indexes
    for (var i=0; i < indexes.length; /* i is only incremented when not splicing */  ) {
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

function getDocumentStoreURI(collectionName) {

  return documentStoreRoot + collectionName;

}

function collectionNotFound(e) {

  if ((e) && (e.statusCode) && (e.statusCode === 404)) {
    if ((e.details) && (e.details.json) && (e.details.json['o:errorCode'] === 'REST-02000')) {
      return true;
    }
  }
  return false;
}

// Create a new object, that prototypally inherits from the Error constructor

function SodaError(details) {
  this.name    = 'SodaError';
  this.message = 'Unexpected Error while invoking Oracle Soda for Rest';
  if (details.statusCode !== undefined ) {
    this.statusCode = details.statusCode
  }
  this.stack   = details.cause.stack;
  this.details = details
}

SodaError.prototype = Object.create(Error.prototype);
SodaError.prototype.constructor = SodaError;

var disableSodaLogging = {sodaLoggingEnabled : false}

function setHeaders(contentType, eTag) {

   var headers = {};

   if (contentType === undefined) {
     contentType = 'application/json';
   }

   if (contentType !== null) {
     headers['Content-Type'] = contentType;
   }

   if (eTag !== undefined) {
     headers["If-Match"] = eTag;
   }

   return headers;
}

function addLimitAndFields(queryProperties, limit, fields, total) {

  if (fields === undefined) {
    fields = 'all';
  }

  queryProperties.fields = fields;

  if (limit !== undefined) {
    queryProperties.limit = limit;
  }

  if (total) {
    queryProperties.totalResults = true;
  }

  return queryProperties;
}

function newLogEntry(moduleId, sessionId, operationId, requestOptions) {

  return {
      sessionId           : sessionId
    , operationId         : operationId
    , module              : moduleId
    , request             : requestOptions
    , response            : {
       statusCode         : null
     , statusText         : null
     , headers            : null
     , body               : null
     , json               : null
     }
   , startTime           : (new Date()).getTime()
   , elapsedTime         : null
   }
}

function createLogRequest(moduleId, sessionState, requestOptions) {

  var moduleId = 'createLogRequest()';
  // writeLogEntry(moduleId,JSON.stringify(sessionState));

  var logRequest = null;

  if (sessionState.sodaLoggingEnabled) {
    logRequest = {
      logCollection    : sessionState.logCollectionName
    , cfg              : connectionProperties
    , logEntry         : newLogEntry(moduleId, sessionState.sodaSessionId, sessionState.operationId, requestOptions)
    }
  }

  return logRequest;
}

function logResponse(response, logRequest) {

  var moduleId = 'logResponse()';
  // writeLogEntry(moduleId,JSON.stringify(logRequest));

  if ((logRequest !== undefined) && (logRequest != null)) {

    logRequest.logEntry.elapsedTime          = response.elapsedTime;
    logRequest.logEntry.response.statusCode  = response.statusCode;
    logRequest.logEntry.response.statusText  = response.statusText;
    logRequest.logEntry.response.headers     = response.headers;
    logRequest.logEntry.response.body        = response.body
    logRequest.logEntry.response.json        = response.json

    return postJSONCatch404(disableSodaLogging, logRequest.logCollection, logRequest.logEntry);
  }
  else {
    return Promise.resolve();
    }
}

function getSodaError(moduleName,path,e) {


  var moduleId = 'getSodaError("' + moduleName + '")';
  // writeLogEntry(moduleId,JSON.stringify(e));

  var details = {
    module         : moduleName,
    requestOptions : path,
    cause          : e
  }

  return new SodaError(details);

}

async function processSodaResponse(moduleName, requestOptions, logRequest, sodaResponse, body, resolve, reject) {

  var moduleId = 'processSodaResponse("' + moduleName + '")';

  var response = {
    module         : moduleName
  , requestOptions : requestOptions
  , statusCode     : sodaResponse.statusCode
  , statusText     : http.STATUS_CODES[sodaResponse.statusCode]
  , contentType    : sodaResponse.headers["content-type"]
  , headers        : sodaResponse.headers
  , elapsedTime    : sodaResponse.elapsedTime
  }

  if ((body !== undefined) && (body !== null)) {
    if ((response.contentType !== undefined) && (response.contentType.startsWith("application/json"))) {
          // writeLogEntry(moduleId,'Type = ' + typeof body);
        if (typeof body === 'object') {
            response.json = body
        }
        else {
            try {
                response.json = JSON.parse(body);
          }
          catch (e) {
                response.body = body;
            }
        }
        }
        else {
          // writeLogEntry(moduleId,'Length = ' + Buffer.byteLength(body));
            response.body = body;
        }
  }

  await logResponse(response, logRequest);
  if ((sodaResponse.statusCode === 200) || (sodaResponse.statusCode === 201)) {
    resolve(response);
  }
  else {
    // writeLogEntry(moduleId,'Error. Status code = ' + sodaResponse.statusCode);
    response.cause = new Error()
    reject(new SodaError(response));
  }
}

function generateRequest(moduleName, sessionState, requestOptions) {

  var moduleId = 'generateRequest("' + moduleName + '")';

    if (getConnectionProperties().useProxy) {
        requestOptions.proxy = 'http://' + getConnectionProperties().proxy.hostname + ':' + getConnectionProperties().proxy.port
    }

  var e = new Error()
  requestOptions.stack = e.stack;

  return new Promise(function(resolve, reject) {
    // writeLogEntry('Execute Promise: Method = "' + requestOptions.method + '". URI = "' + requestOptions.uri + '".');
    var logRequest = createLogRequest(moduleId, sessionState, requestOptions)
    request(requestOptions, function(error, response, body) {
    if (error) {
      reject(getSodaError(moduleId,requestOptions,error));
    }
    else {
      processSodaResponse(moduleId, requestOptions, logRequest, response, body, resolve, reject);
    }
    }).auth(getConnectionProperties().username, getConnectionProperties().password, true);
  });
}

function createCollection(sessionState, collectionName) {

  var moduleId = 'createCollection("' + collectionName + '")';

  var requestOptions = {
    method  : 'PUT'
  , uri     : getDocumentStoreURI(collectionName)
  , json    : getCollectionProperties(collectionName)
  , time    : true
  };

  return generateRequest(moduleId, sessionState, requestOptions);
}

function createIndex(sessionState, collectionName, indexProperties) {

  var moduleId = 'createIndex("' + collectionName + '","' + indexProperties.name + '")';

  // Skip Spatial Indexes in environments where spatial operations on Geo-JSON are not supported

  if ((indexProperties.spatial) && !$nearSupported) {
    writeLogEntry(moduleId,'Skipped creation of unsupported spatial index');
    return new Promise(function(resolve, reject) {resolve()});
  }

  // Skip Text Indexes in environments where text index syntax is not supported

  if ((indexProperties.language) && !textIndexSupported) {
    writeLogEntry(moduleId,'Skipped creation of unsupported text index' || indexProperties.name);
    return new Promise(function(resolve, reject) {resolve()});
  }
    // Remove the Singleton Key from the index definition if we are in a Pre 12.2 database

  if ((!nullOnEmptySupported) && (indexProperties.fields !== undefined) && (!indexProperties.scalarRequired))  {
    indexProperties.scalarRequired = true;
  }

  var requestOptions = {
    method  : 'POST'
  , uri     : getDocumentStoreURI(collectionName)
  , qs      : {action : 'index'}
  , json    : indexProperties
  , time    : true
  };

  return generateRequest(moduleId, sessionState, requestOptions);
}

function createIndexes(sessionState, collectionName) {

  var moduleId = 'createIndexes("' + collectionName + '")';

  var indexes = getIndexProperties(collectionName);
  return indexes.reduce(
    async function(sequence, index) {
      return sequence.then(async function() {
        try {
		  await createIndex(sessionState, collectionName, index);
        } catch (e) {
          writeLogEntry(moduleId,'Broken Promise. createIndexes(): ');
          throw e;
        }
      })
    },
    Promise.resolve()
  )
}

async function createCollectionWithIndexes(sessionState, collectionName) {

  var indexes = getIndexProperties(collectionName);

  try {
    await createCollection(sessionState, collectionName);
    await createIndexes(sessionState, collectionName);
  } catch (e) {
    writeLogEntry(moduleId,'Broken Promise. createCollectionWithIndexes(): ');
 	throw e;
  }
}

function dropCollection(sessionState, collectionName) {

  var moduleId = 'dropCollection("' + collectionName + '")';

  var requestOptions = {
    method  : 'DELETE'
  , uri     : getDocumentStoreURI(collectionName)
  , time    : true
  };

  return generateRequest(moduleId, sessionState, requestOptions);
}

async function dropCollectionCatch404(sessionState, collectionName) {

  var moduleId = 'dropCollectionCatch404("' + collectionName + '")';
  
  try {
    await dropCollection(sessionState, collectionName)
  } catch (e) {
    if (collectionNotFound(e)) {
      return Promise.resolve(e);
    }
    else {
      throw e;
    }
  };
}

async function recreateCollection(sessionState, collectionName) {

  var moduleId = 'recreateCollection("' + collectionName + '")';

  try {
    await dropCollectionCatch404(sessionState, collectionName)
    await createCollectionWithIndexes(sessionState, collectionName)
  } catch(e) {
    writeLogEntry(moduleId,'.createCollectionWithIndexes() Broken Promise.' + JSON.stringify(e));
    throw e;
  };
}

function getCollection(sessionState, collectionName, limit, fields, total) {

  var moduleId = 'getCollection("' + collectionName + '")';

  var requestOptions = {
    method  : 'GET'
  , uri     : getDocumentStoreURI(collectionName)
  , qs      : addLimitAndFields({}, limit, fields, total)
  , headers : setHeaders()
  , time    : true
  , json    : true
  };

  return generateRequest(moduleId, sessionState, requestOptions);
}

function getDocumentContent(sessionState, collectionName, key, binary, eTag) {

  var moduleId = 'getDocument("' + collectionName + '","' + key +'")';

  var requestOptions = {
    method  : 'GET'
  , uri     : getDocumentStoreURI(collectionName) + '/' + key
  , headers : setHeaders(null, eTag)
  , time    : true
  };

  if (binary) {
    requestOptions.encoding = null;
  }

  return generateRequest(moduleId, sessionState, requestOptions);
}

function postJSON(sessionState, collectionName, json) {

  var moduleId = 'postJSON("' + collectionName + '")';
  // writeLogEntry(moduleId);

  return postDocument(sessionState, collectionName, json, 'application/json');

}

function postJSONCatch404(sessionState, collectionName, json) {

    return postDocumentCatch404(sessionState, collectionName, json, 'application/json');

}

async function postDocumentCatch404(sessionState, collectionName, document, contentType) {

  let soadResponse;
  try {
    await postDocument(sessionState, collectionName, document, contentType)
  } catch (e) {	
    if (collectionNotFound(e)) {
      soadResponse = await createCollectionWithIndexes(sessionState,collectionName);
      await postDocument(sessionState, collectionName, document, contentType);
	  return sodaResponse;
	}
	else {
	  throw e;
    }
  };
  
  return soadResponse;  
}

function postDocument(sessionState, collectionName, document, contentType) {

  var moduleId = 'postDocument("' + collectionName + '","' + contentType + '")';

    var requestOptions = {
    method  : 'POST'
  , uri     : getDocumentStoreURI(collectionName)
  , headers : setHeaders(contentType , undefined)
  , time    : true
  };

  if (contentType === 'application/json') {
    requestOptions.json = document
    }
    else {
        requestOptions.body = document
    }

  return generateRequest(moduleId, sessionState, requestOptions);
}

function bulkInsert(sessionState, collectionName, documents) {

  var moduleId = 'bulkInsert("' + collectionName + '")';

  var requestOptions = {
    method  : 'POST'
  , uri     : getDocumentStoreURI(collectionName)
  , qs      : {action : 'insert'}
  , json    : documents
  , time    : true
  };

  return generateRequest(moduleId, sessionState, requestOptions);
}

function putDocument(sessionState, collectionName, key, document, contentType, eTag) {

  var moduleId = 'putDocument(' + collectionName + '","' + key + '","' + contentType + '")';
  var requestOptions = {
    method  : 'PUT'
  , uri     : getDocumentStoreURI(collectionName) + '/' + key
  , headers : setHeaders(contentType , eTag)
  , time    : true
  };

  if (contentType === 'application/json') {
    requestOptions.json = document
    }
    else {
        requestOptions.body = document
    }

  return generateRequest(moduleId, sessionState, requestOptions);
}

function deleteDocument(sessionState, collectionName, key, eTag) {

  var moduleId = 'deleteDocument("' + collectionName + '","' + key + '")';

    var requestOptions = {
    method  : 'DELETE'
  , uri     : getDocumentStoreURI(collectionName) + '/' + key
  , headers : setHeaders(undefined, eTag)
  , time    : true
  };

  return generateRequest(moduleId, sessionState, requestOptions);
}

function queryByExample(sessionState, collectionName, qbe, limit, fields, total) {

  var moduleId = 'queryByExample("' + collectionName + '",' + JSON.stringify(qbe) + ')';
  // writeLogEntry(moduleId);

  var requestOptions = {
    method  : 'POST'
  , uri     : getDocumentStoreURI(collectionName)
  , qs      : addLimitAndFields({action : "query"}, limit, fields, total)
  , json    : qbe
  , time    : true
  };

  return generateRequest(moduleId, sessionState, requestOptions);
}

function putJSON(sessionState, collectionName, key, json, eTag) {

  var moduleId = 'putJSON("' + collectionName + '","' + key + '")';
  // writeLogEntry(moduleId);

  return putDocument(sessionState, collectionName, key, json, 'application/json', eTag);
}

function getJSON(sessionState, collectionName, key, eTag) {
  return getDocumentContent(sessionState, collectionName, key, false, eTag);
}

function getDocument(sessionState, collectionName, key, eTag) {
  return getDocumentContent(sessionState, collectionName, key, false, eTag);
}

function getBinaryDocument(sessionState, collectionName, key, eTag) {
  return getDocumentContent(sessionState, collectionName, key, true, eTag);
}

function generateRandomName(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid.toUpperCase();
}

async function featureDetection() {

  /*
  ** Test for $CONTAINS support
  */

  var moduleId = 'feaureDetection()'

  var collectionName = 'TMP_' + generateRandomName();

  try {
    await createCollection(disableSodaLogging, collectionName);
	
    var qbe = {id : {"$contains" : 'XXX'}}
    try {
      await queryByExample(disableSodaLogging, collectionName, qbe)
    }
    catch (sodaError) {
      if ((sodaError.details !== undefined ) && ( sodaError.details.statusCode === 400)) {
        var sodaErrorDetails = sodaError.details.json;
        if (sodaErrorDetails.title === 'The field name $contains is not a recognized operator.') {
          $containsSupported = false;
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

    try {
      await queryByExample(disableSodaLogging, collectionName, qbe)
    }
    catch (sodaError) {
      if ((sodaError.details !== undefined ) && ( sodaError.details.statusCode === 400)) {
        var sodaErrorDetails = sodaError.details.json;
        // writeLogEntry(moduleId,'Error: ' + JSON.stringify(sodaErrorDetails));
        // if (sodaErrorDetails['o:errorCode'] === 'SODA-02002') {
        if (sodaErrorDetails.title === 'The field name $near is not a recognized operator.') {
          $nearSupported = false;
		} else {
		  throw sodaError;
		}
      }	
      else {
        throw sodaError;
      }		
    }

    var indexDef = {
          name         : "TEST_IDX"
        , unique       : true
        , fields       : [{
            path       : "id"
          , datatype : "number"
          , order    : "asc"
          }]
        }

	try {
      await createIndex(disableSodaLogging, collectionName, indexDef);
	}
	catch (sodaError) {
      if ((sodaError.details !== undefined ) && ( sodaError.details.statusCode === 400)) {
        var sodaErrorDetails = sodaError.details.json;
        if (sodaErrorDetails['o:errorCode'] === 'SQL-00907') {
          nullOnEmptySupported = false;
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
    ** ToDo : Can we use alternative index properties if we encounter "DRG-10700: preference does not exist: CTXSYS.JSONREST_ENGLISH_LEXER"
    **
    */

    var indexDef = {
          name      : "FULLTEXT_INDEX"
        , dataguide : "on"
        , language  : "english"
        }
            
	try {
		await createIndex(disableSodaLogging, collectionName, indexDef)
	}
	catch (sodaError) {
      if ((sodaError.details !== undefined ) && ( sodaError.details.statusCode === 500)) {
        var sodaErrorDetails = sodaError.details.json;
        if (sodaErrorDetails['o:errorCode'] === 'SQL-29855') {
          textIndexSupported = false;
		} else {
		  throw sodaError;
		}
      }	
      else {
        throw sodaError;
      }		
    }
	
    await dropCollection(disableSodaLogging, collectionName);
	
    writeLogEntry(moduleId,'$contains operator supported:  ' + $containsSupported);
    writeLogEntry(moduleId,'$near operatator   supported:  ' + $nearSupported);
    writeLogEntry(moduleId,'Text Index         supported:  ' + textIndexSupported);
    // writeLogEntry(moduleId,'"NULL ON EMPTY"    supported:  ' + nullOnEmptySupported);
  }
  catch(err) {
    console.error('Broken Promise : featureDetection().');
    console.error( err.stack ? err.stack : err);
    if ((err instanceof SodaError) || (err instanceof externalInterfaces.ExternalError)) {
      console.error(JSON.stringify(err));
    }
    throw err;
  };
};

function getDetectedFeatures() {

    return {
        $contains : $containsSupported
      , $near     : $nearSupported
      // , $near     : false
  }

}

async function recreateLoadIndex(sessionState, collectionName, contents) {

    var moduleId = 'recrateLoadIndex("' + collectionName + ',' + contents.length + ')';

  // Workaround for Bug 24907922
  try {
    await dropCollectionCatch404(sessionState, collectionName);
    await createCollection(sessionState, collectionName);
    await bulkInsert(sessionState, collectionName, contents);
    await createIndexes(sessionState, collectionName);
  } catch(e) {
    writeLogEntry(moduleId,JSON.stringify(e));
    throw e;
  };

}
