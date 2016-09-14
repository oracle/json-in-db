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
module.exports.createIndex                 = createIndex
module.exports.createCollectionWithIndexes = createCollectionWithIndexes
module.exports.recreateCollection          = recreateCollection
module.exports.dropCollection              = dropCollection
module.exports.bulkInsert                  = bulkInsert
module.exports.postJSON                    = postJSON
module.exports.postDocument                = postDocument
module.exports.putJSON                     = putJSON
module.exports.putDocument                 = putDocument
module.exports.deleteJSON                  = deleteDocument
module.exports.deleteDocument              = deleteDocument
module.exports.getCollection               = getCollection
module.exports.getJSON                     = getJSON
module.exports.getDocument                 = getDocument
module.exports.getBinaryDocument           = getBinaryDocument
module.exports.queryByExample              = queryByExample
module.exports.featureDetection            = featureDetection;

var fullTextSearchSupported  = true;
var spatialIndexSupported    = true;

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
  
function addLimitAndFields(queryProperties,limit,fields) {
 
  if (fields === undefined) {
    fields = 'all';
  }

  queryProperties.fields = fields;      
      
  if (limit !== undefined) {
  	queryProperties.limit = limit;
  }
    
  return queryProperties;
}

function newLogEntry(sessionId, operationId, requestOptions) {

  return {
     sessionId           : sessionId,
     operationId         : operationId,
     module              : null,
     method              : requestOptions.method,
     uri                 : requestOptions.uri,
     request             : {
       headers           : requestOptions.headers,
       body              : requestOptions.json || requestOptions.body
     },
     response            : {
       statusCode        : null,
       statusText        : null,
       headers           : null,
       body              : null,
       json              : null
     },
     startTime           : (new Date()).getTime(),
     elapsedTime         : null
   }
}

function createLogRequest(sessionState, cfg, requestOptions) {

  // console.log('createLogRequest(' + JSON.stringify(sessionState) + ')');
  
  var logRequest = null;

  if (sessionState.sodaLoggingEnabled) {
    logRequest = { 
      logCollection    : sessionState.logCollectionName
    , cfg              : cfg
    , logEntry         : newLogEntry(sessionState.sodaSessionId, sessionState.operationId, requestOptions)
    }
  }   

  return logRequest;
}

function logResponse(response, logRequest) {
  
  // console.log('logResponse(' + JSON.stringify(logRequest) + ')');

  if ((logRequest !== undefined) && (logRequest != null)) {

    logRequest.logEntry.module               = response.module;
    logRequest.logEntry.elapsedTime          = response.elapsedTime;
    logRequest.logEntry.response.statusCode  = response.statusCode;
    logRequest.logEntry.response.statusText  = response.statusText;
    logRequest.logEntry.response.headers     = response.headers;
    logRequest.logEntry.response.body        = response.body
    logRequest.logEntry.response.json        = response.json

    postJSON(disableSodaLogging, logRequest.cfg, logRequest.logCollection, logRequest.logEntry);
  }
}

function getDocumentStoreURI(cfg,collectionName) {
	
	return "http://" + cfg.hostname + ":" + cfg.port + cfg.path + "/" + collectionName;
	
}

function getSodaError(moduleName,path,e) {
	
	console.log("getSodaError(): " + moduleName)
	console.log(JSON.stringify(e));

	var details = { 
    module         : moduleName,
    requestOptions : path,
    cause          : e
  }
  
  return new SodaError(details);
  
}

function processSodaResponse(moduleName, requestOptions, logRequest, sodaResponse, body, resolve, reject) {
		
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
  	if (response.contentType === "application/json") {
		  // console.log('processSodaResponse("' + moduleName + '","' + response.contentType + '","' + typeof body + '")');
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
  		if ((response.json) && (response.json.items)) {
 		  	response.json = response.json.items;
 			}
 		}
 		else {
		  // console.log('processSodaResponse("' + moduleName + '","' + response.contentType + '","' + Buffer.byteLength(body) + '")');	
 			response.body = body;
 		}
  }

  logResponse(response, logRequest);

	if ((sodaResponse.statusCode === 200) || (sodaResponse.statusCode === 201)) {
		resolve(response);
	}
  else {
    response.cause = new Error()
    reject(new SodaError(response));
  }
}
    
function generateRequest(moduleId, sessionState, cfg, requestOptions) {
  
  return new Promise(function(resolve, reject) {
	  // console.log('Execute Promise: ' + moduleId);
 	  var logRequest = createLogRequest(sessionState, cfg, requestOptions)
    request(requestOptions, function(error, response, body) {
 	  	if (error) {
  		  reject(getSodaError(moduleId,requestOptions,error));
			}
			else {
			  processSodaResponse(moduleId, requestOptions, logRequest, response, body, resolve, reject);
			}
		}).auth(cfg.username, cfg.password, true);
  });
}

function createCollection(sessionState, cfg, collectionName, collectionProperties) {

  var moduleId = 'createCollection("' + collectionName + '")';

  var requestOptions = {
  	method  : 'PUT'
  , uri     : getDocumentStoreURI(cfg,collectionName)
  , json    : collectionProperties
  , time    : true
  };

  return generateRequest(moduleId, sessionState, cfg, requestOptions);
}
   
function createIndex(sessionState, cfg, collectionName, indexProperties) {

  var moduleId = 'createIndex("' + collectionName + '","' + indexProperties.name + '")'; 

  // Skip Spatial Indexes in environments where spatial operations on Geo-JSON are not supported

  if ((indexProperties.spatial) && !spatialIndexSupported) {
    console.log(moduleId + 'Skipped creation of unsupported spatial index');
    return new Promise(function(resolve, reject) {resolve()});
  }

  var requestOptions = {
  	method  : 'POST'
  , uri     : getDocumentStoreURI(cfg,collectionName) 
  , qs      : {action : 'index'}
  , json    : indexProperties
  , time    : true
  };

  return generateRequest(moduleId, sessionState, cfg, requestOptions);
}

function dropCollection(sessionState, cfg, collectionName) {

  var moduleId = 'dropCollection("' + collectionName + '")';

  var requestOptions = {
  	method  : 'DELETE'
  , uri     : getDocumentStoreURI(cfg,collectionName)
  , time    : true
  };

  return generateRequest(moduleId, sessionState, cfg, requestOptions);
}

function getCollection(sessionState, cfg, collectionName,limit,fields) {

  var moduleId = 'getCollection("' + collectionName + '")';
  
	var requestOptions = {
  	method  : 'GET'
  , uri     : getDocumentStoreURI(cfg,collectionName)
  , qs      : addLimitAndFields({},limit,fields)
  , headers : setHeaders()
  , time    : true
  , json    : true
  };

  return generateRequest(moduleId, sessionState, cfg, requestOptions);
}

function getDocumentContent(sessionState, cfg, collectionName, key, binary, eTag) {

  var moduleId = 'getDocument("' + collectionName + '","' + key +'")';

	var requestOptions = {
  	method  : 'GET'
  , uri     : getDocumentStoreURI(cfg,collectionName) + '/' + key
  , headers : setHeaders(null, eTag)
  , time    : true
  };

  if (binary) {
  	requestOptions.encoding = null;
  }
  
  return generateRequest(moduleId, sessionState, cfg, requestOptions);
}

function postJSON(sessionState, cfg, collectionName, json) {

  // console.log('postJSON("' + collectionName + '")');
   
  return postDocument(sessionState, cfg, collectionName, json, 'application/json');
   
}

function postDocument(sessionState, cfg, collectionName, document, contentType) {

  var moduleId = 'postDocument("' + collectionName + '","' + contentType + '")';

	var requestOptions = {
  	method  : 'POST'
  , uri     : getDocumentStoreURI(cfg,collectionName)
  , headers : setHeaders(contentType , undefined)
  , time    : true
  };
  
  if (contentType === 'application/json') {
  	requestOptions.json = document
 	}
 	else {
 		requestOptions.body = document
 	}

  return generateRequest(moduleId, sessionState, cfg, requestOptions);
}

function bulkInsert(sessionState, cfg, collectionName, documents) {

  var moduleId = 'bulkInsert("' + collectionName + '")';
  
  var requestOptions = {
  	method  : 'POST'
  , uri     : getDocumentStoreURI(cfg,collectionName)
  , qs      : {action : 'insert'}
  , json    : documents
  , time    : true
  };
  
  return generateRequest(moduleId, sessionState, cfg, requestOptions);
}

function putDocument(sessionState, cfg, collectionName, key, document, contentType, eTag) {

  var moduleId = 'putDocument(' + collectionName + '","' + key + '","' + contentType + '")';
	var requestOptions = {
  	method  : 'PUT'
  , uri     : getDocumentStoreURI(cfg,collectionName) + '/' + key
  , headers : setHeaders(contentType , eTag)
  , time    : true
  };
  
  if (contentType === 'application/json') {
  	requestOptions.json = document
 	}
 	else {
 		requestOptions.body = document
 	}

  return generateRequest(moduleId, sessionState, cfg, requestOptions);
}

function deleteDocument(sessionState, cfg, collectionName, key, eTag) {

  var moduleId = 'deleteDocument("' + collectionName + '","' + key + '")';

	var requestOptions = {
  	method  : 'DELETE'
  , uri     : getDocumentStoreURI(cfg,collectionName) + '/' + key
  , headers : setHeaders(undefined, eTag)
  , time    : true
  };
  
  return generateRequest(moduleId, sessionState, cfg, requestOptions);
}

function queryByExample(sessionState, cfg, collectionName, qbe, limit, fields) {

  var moduleId = 'queryByExample("' + collectionName + '",' + JSON.stringify(qbe) + ')'; 
  // console.log(moduleId);
   
	var requestOptions = {
  	method  : 'POST'
  , uri     : getDocumentStoreURI(cfg,collectionName)
  , qs      : addLimitAndFields({action : "query"},limit,fields)
  , json    : qbe
  , time    : true
  };
  
  return generateRequest(moduleId, sessionState, cfg, requestOptions);
}

function putJSON(sessionState, cfg, collectionName, key, json, eTag) {

  // console.log('putJSON("' + collectionName + '","' + key + '")');

  return putDocument(sessionState, cfg, collectionName, key, json, 'application/json', eTag);   
}

function getJSON(sessionState, cfg, collectionName, key, eTag) {
  
  return getDocument(sessionState, cfg, collectionName, key, eTag);
}

function getDocument(sessionState, cfg, collectionName, key, eTag) {

  return getDocumentContent(sessionState, cfg, collectionName, key, false, eTag);
}

function getBinaryDocument(sessionState, cfg, collectionName, key, eTag) {
 
  return getDocumentContent(sessionState, cfg, collectionName, key, true, eTag);
}

function createCollectionWithIndexes(sessionState, cfg, collectionName, collectionProperties) {

  var indexes = collectionProperties.hasOwnProperty('indexes') ? collectionProperties.indexes : [];
  delete(collectionProperties.indexes);

  // Removed disabled Indexes
  for (var i=0; i < indexes.length;  ) {
    if ((indexes[i].hasOwnProperty('disabled')) && (indexes[i].disabled === true))  {
      indexes.splice(i,1);
    }
    else {
      delete(indexes[i].disabled);
      i++;
    }
  }
   
  return createCollection(sessionState, cfg, collectionName,collectionProperties).then(function() {
    return indexes.reduce(
      function(sequence, index) {
        return sequence.then(function() {
          return createIndex(sessionState, cfg, collectionName,index);
        }).catch(function(e) {
          console.log('Broken Promise. createCollectionWithIndexes(): ');
          throw e;
        })  
      },
      Promise.resolve()
    )
  })
}  

function recreateCollection(sessionState, cfg, collectionName,collectionProperties) {
   
  return dropCollection(sessionState, cfg, collectionName).catch(function(e){
     if ((e) && (e.statusCode) && (e.statusCode === 404)) {
       console.log('recreateCollection(' + collectionName + '): Not Found.');
    }
    else {
      console.log('Broken Promise: recreateCollection(' + collectionName + ').dropCollection().');
      throw e;
    }
  }).then(function() {
     return createCollectionWithIndexes(sessionState, cfg, collectionName,collectionProperties)
  }).catch(function(e) {
     console.log('Broken Promise: recreateCollection(' + collectionName + ').createCollectionWithIndexes().');
     console.log(e);
     throw e;
  })
}

function generateRandomName(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function featureDetection(cfg) {

  /*
  ** Test for $CONTAINS support
  */ 
  
  var collectionName = 'TMP-' + generateRandomName();
  
  return createCollection(disableSodaLogging, cfg, collectionName).then(function(){
    var qbe = {id : {"$contains" : 'XXX'}}
    return queryByExample(disableSodaLogging, cfg, collectionName, qbe).catch(function(sodaError){
      if ((sodaError.details !== undefined ) && ( sodaError.details.statusCode === 400)) {
        var sodaErrorDetails = sodaError.details.json;
        // if (sodaErrorDetails['o:errorCode'] === 'SODA-02002') {
        if (sodaErrorDetails.title === 'The field name $contains is not a recognized operator.') {
          fullTextSearchSupported = false;
        }
      }
    }).then(function() {

      /*
      ** Test for $NEAR support and spatial indexes.
      */ 
  
      var qbe = {
        geoCoding          : {
        	$near            : {
            $geometry      : {
            	 type        : "Point", 
            	 coordinates : [-122.12469369777311,37.895215209615884]
            },
            $distance      : 5,
            $unit          : "mile"
          }
        }
      }
    
      return queryByExample(disableSodaLogging, cfg, collectionName, qbe).catch(function(sodaError){
        if ((sodaError.details !== undefined ) && ( sodaError.details.statusCode === 400)) {
          var sodaErrorDetails = sodaError.details.json;
          // console.log(JSON.stringify(sodaErrorDetails));
          // if (sodaErrorDetails['o:errorCode'] === 'SODA-02002') {
          if (sodaErrorDetails.title === 'The field name $near is not a recognized operator.') {
            spatialIndexSupported = false;
          }
        }
      })
    })
  }).then(function() {
  	return dropCollection(disableSodaLogging, cfg, collectionName)
  }).then(function() {
    console.log(new Date().toISOString() + ': Full Text Search Supported: ' + fullTextSearchSupported);
    console.log(new Date().toISOString() + ': Spatial Indexing Supported: ' + spatialIndexSupported);
  }).catch(function(e) {
    console.log('Broken Promise : featureDetection().');
    console.log(e);
    console.log(e.stack);
    throw e;
  });
};