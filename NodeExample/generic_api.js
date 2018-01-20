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
const http = require('http');
const dbAPI = require('./soda_rest_api.js');
const constants = require('./constants.js');
const errorLibrary = require('./error_library.js');

// High Level Helper Functins : Local Implementation

module.exports.getJSON                     = getJSON
module.exports.getDocument                 = getDocument
module.exports.getBinaryDocument           = getBinaryDocument

module.exports.postJSON                    = postJSON
module.exports.ensurePostJSON              = ensurePostJSON
module.exports.ensurePostDocument          = ensurePostDocument
module.exports.putJSON                     = putJSON
module.exports.deleteJSON                  = deleteDocument

module.exports.createCollectionWithIndexes = createCollectionWithIndexes
module.exports.recreateCollection          = recreateCollection
module.exports.recreateLoadCollection      = recreateLoadCollection
module.exports.ensureDropCollection        = ensureDropCollection

// API Generic functionality : Local Implimentation

module.exports.createLogRequest            = createLogRequest
module.exports.logResponse                 = logResponse
module.exports.generateSummary             = generateSummary
module.exports.insert2Item                 = document2Item
module.exports.document2Item               = document2Item
module.exports.documents2Items             = documents2Items
module.exports.formatResults               = formatResults
module.exports.formatSingleInsert          = formatSingleInsert
module.exports.processSingleInsert         = processSingleInsert
module.exports.processResults              = processResults
module.exports.processResultsJSON          = processResultsJSON
module.exports.processResultsHTTP          = processResultsHTTP
module.exports.processBulkFetch            = processBulkFetch
module.exports.processBulkInsert           = processBulkInsert
module.exports.interpretHTTPStatusCode     = interpretHTTPStatusCode

// Native Functions : Pass Through

module.exports.initialize                  = initialize
module.exports.getSupportedFeatures        = getSupportedFeatures
module.exports.getCollection               = getCollection
module.exports.queryByExample              = queryByExample
module.exports.postDocument                = postDocument
module.exports.bulkInsert                  = bulkInsert
module.exports.putDocument                 = putDocument
module.exports.deleteDocument              = deleteDocument
module.exports.createIndexes               = createIndexes
module.exports.createCollection            = createCollection
module.exports.dropCollection              = dropCollection


function writeLogEntry(module,comment) {
	
  const message = ( comment === undefined) ? module : `${module}: ${comment}`
  console.log(`${new Date().toISOString()}: genericAPI.${message}`);
}

function getCollectionProperties(collectionName) {

  var properties = collectionProperties[collectionName];
  if (properties != null) {
    properties = JSON.parse(JSON.stringify(properties))
    delete(properties.indexes);
  }
  return properties

}

function interpretHTTPStatusCode(statusCode) {
	
  // Map HTTP Status codes into generic error numbers.

  switch (statusCode) {
    case 200: 
	  return constants.SUCCESS
	case 201:
	  return constants.CREATED
    case 204: 
	  return constants.SUCCESS
	case 400:
	  return constants.BAD_REQUEST
	case 401:
	  return constants.UNAUTHORIZED
	case 404:
	  return constants.NOT_FOUND
	case 409:
	  return constants.DUPLICATE_ENTRY
	case 412:
	  return constants.CONFLICTING_UPDATE
	case 413:
	  return constants.DOCUMENT_TOO_LARGE
	case 500:
	  return constants.FATAL_ERRROR
	default:
	  return constants.UNKNOWN_ERROR
  }
}

function createLogRequest(invokerId, sessionState, details) {

  const moduleId = `${dbAPI.getDBDriverName()}.${invokerId}.createLogRequest()`;
  // writeLogEntry(moduleId,JSON.stringify(sessionState));

  let logRequest = {
	                 logEntry         : {
                       sessionId      : sessionState.sessionId ? sessionState.sessionId : null
                     , operationId    : sessionState.operationId ? sessionState.operationId : null
                     , module         : `${dbAPI.getDBDriverName()}.${invokerId}`
		             , stack          : new Error().stack
		             , request        : details
                     , startTime      : (new Date()).getTime()
		             , response       : {}
                     , elapsedTime    : null
                     } 
				   , status           : {
					   enabled        : false
				     }
                   }       
 
  if (sessionState.dbLoggingEnabled) {
	 logRequest.status = {
		                   enabled              : true
                         , collectionName       : sessionState.logCollectionName
                         }
  }

  return logRequest;
}

async function logResponse(logRequest, response, elapsedTime) {

  const moduleId = `${dbAPI.getDBDriverName()}.logResponse()`;

  logRequest.logEntry.response = response;
  logRequest.logEntry.elapsedTime = elapsedTime
  
  if (!logRequest.status.enabled) {
	return
  }

  await ensurePostJSON(constants.DB_LOGGING_DISABLED, logRequest.status.collectionName, logRequest.logEntry);
  
}

function generateSummary(documents) {
	
	return { documentCount : documents.length, firstDocument: documents[0], lastDocument : documents[documents.length-1]}

}

function insert2Item(document) {

  return { id   :  document.id
	     };
								   
}

function document2Item(document) {

  return { id    : document.id
         , value : document
	     };
								   
}

function documents2Items(documents) {
	
	return results.map(function(document) {
                         return document2Item(document)
                       })
}

function formatResponseJSON(invokerId, status, json, contentType, elapsedTime) {
					
  return { module         : invokerId
         , elapsedTime    : elapsedTime
         , contentType    : contentType
	 	 , status         : status
	     , json           : json
         }    
}

function formatResponseBody(invokerId, status, body, contentType, elapsedTime) {
					
  return { module         : invokerId
         , elapsedTime    : elapsedTime
         , contentType    : contentType
	 	 , status         : status
	     , body           : body
         }    
}

function formatSingleInsert(invokerId, item, elapsedTime) {

  // Generates the expected response to an INSERT operation	

  const json = { items : [item]
               , count : 1
               }

  return formatResponseJSON(invokerId, constants.CREATED, json, "application/json", elapsedTime);
}

function formatResults(invokerId, status, body, contentType, elapsedTime) {

  const moduleId = `${dbAPI.getDBDriverName()}.${invokerId}.formatResults("${typeof body}","${contentType}")`;
  // writeLogEntry(moduleId);
  
  if (((body !== undefined) && (body !== null)) && ((contentType !== undefined) && (contentType.startsWith("application/json")))) {
    // writeLogEntry(moduleId,`Type = ${typeof body)}`;
    if (typeof body === 'object') {
      return formatResponseJSON(invokerId, status, body, contentType, elapsedTime)
	}    
    else {
      try {
        return formatResponseJSON(invokerId, status, JSON.parse(body), contentType, elapsedTime)
      } catch (e) {
        return formatResponseBody(invokerId, status, body, contentType, elapsedTime)
      }
    }
  }
  else {
    // writeLogEntry(moduleId,`Byte Length = ${Buffer.byteLength(body)}`);
    return formatResponseBody(invokerId, status, body, contentType, elapsedTime)
  }
}

function formatHTTPResults(invokerId, status, results, contentType, elapsedTime) {  

   // Assumes results are an HTTP Response with a body object

  const moduleId = `${dbAPI.getDBDriverName()}${invokerId}.formatResponse("${contentType}","${status}")`;
  // writeLogEntry(moduleId);

  if (results !== undefined) {
    if (results.body !== undefined) {	  
      return formatBody(moduleId,status,results.body,contentType,elapsedTime) 
    }
    else {
      writeLogEntry(moduleId,`Byte Length = ${Buffer.byteLength(results)}`);
      return formatBody(moduleId,status,results,contentType,elapsedTime) 
    }    
  }
  else { 
    return formatBody(moduleId,status,"",contentType,elapsedTime) 
  }

}

function processBulkInsert(invokerId, items, elapsedTime, logRequest) {

  const json = { items: items
               , count : items.length
			   }

  const response = formatResponseJSON(invokerId, constants.CREATED, json, "application/json", elapsedTime)  
  logResponse(logRequest, response);
  return response
}

function processBulkFetch(invokerId, items, metadata, elapsedTime, logRequest) {
   
  const json = { items : items
               , count : items.length
			   , totalResults : metadata.totalResults
               }
			 
  const response = formatResponseJSON(invokerId, constants.CREATED, json, "application/json", elapsedTime);
  logResponse(logRequest, response, elapsedTime);
  return response
}
  
function processSingleInsert(invokerId, item, elapsedTime, logRequest) {
	
  const response = formatSingleInsert(invokerId,item,elapsedTime)
  logResponse(logRequest,response,elapsedTime);
  return response
}

function processResults(invokerId, status, results, contentType, elapsedTime, logRequest) {
	
  const response = formatResults(invokerId,status,results,contentType,elapsedTime)
  logResponse(logRequest,response,elapsedTime);
  return response

}

function processResultsJSON(invokerId, status, results, elapsedTime, logRequest) {
	
  const response = formatResponseJSON(invokerId,status,results,"application/json",elapsedTime)
  logResponse(logRequest,response,elapsedTime);
  return response

}
  
function processResultsHTTP(moduleId, results, logRequest) {

  logRequest.logEntry.http = { statusCode : results.statusCode 
                             , statusText : http.STATUS_CODES[results.statusCode]
                             }
  
  const response = formatResults(moduleId, interpretHTTPStatusCode(results.statusCode), results.body, results.headers["content-type"], results.elapsedTime) 
  logResponse(logRequest,response,results.elapsedTime);
  return response

}

function getDocument(sessionState, collectionName, key, eTag) {

  const moduleId = `${dbAPI.getDBDriverName()}.getDocument("${collectionName}","${key}")`;
  // writeLogEntry(moduleId);

  return getDocumentContent(sessionState, collectionName, key, false, eTag);
}

function getBinaryDocument(sessionState, collectionName, key, eTag) {

  const moduleId = `${dbAPI.getDBDriverName()}.getBinaryDocument("${collectionName}","${key}")`;
  // writeLogEntry(moduleId);

  return getDocumentContent(sessionState, collectionName, key, true, eTag);
}

function getJSON(sessionState, collectionName, key, eTag) {	
  
  const moduleId = `${dbAPI.getDBDriverName()}.getJSON("${collectionName}","${key}")`;
  // writeLogEntry(moduleId);

  return getDocumentContent(sessionState, collectionName, key, false, eTag);
  
}

async function ensurePostDocument(sessionState, collectionName, document, contentType) {

  const moduleId = `${dbAPI.getDBDriverName()}.ensurePostDocument("${collectionName}"`;
  // writeLogEntry(moduleId);

  let response = null
  try {
    response = await postDocument(sessionState, collectionName, document, contentType)
  } catch (e) {	
    if (dbAPI.collectionNotFound(e)) {
      await createCollectionWithIndexes(sessionState,collectionName);
      response = postDocument(sessionState, collectionName, document, contentType);
	}
	else {
	  throw e;
    }
  };
  
  return response;  
}

function postJSON(sessionState, collectionName, json) {

  const moduleId = `${dbAPI.getDBDriverName()}.postJSON("${collectionName}")`;
  // writeLogEntry(moduleId);

  return postDocument(sessionState, collectionName, json, 'application/json');

}

function ensurePostJSON(sessionState, collectionName, json) {

  return ensurePostDocument(sessionState, collectionName, json, 'application/json');

}

function putJSON(sessionState, collectionName, key, json, eTag) {

  return putDocument(sessionState, collectionName, key, json, 'application/json', eTag);

}

async function deleteDocument(sessionState, collectionName, key, eTag) {

  return dbaAPI.deleteDocument(sessionState,collectionName, key, eTag)
  
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

async function createCollectionWithIndexes(sessionState, collectionName) {

  const moduleId = `${dbAPI.getDBDriverName()}createCollectionWithIndexes("${collectionName}")`;
  // writeLogEntry(moduleId);

  try {
    await dbAPI.createCollection(sessionState, collectionName);
    await dbAPI.createIndexes(sessionState, collectionName);
  } catch (e) {
 	throw e;
  }
}

async function ensureDropCollection(sessionState, collectionName) {

  const moduleId = `${dbAPI.getDBDriverName()}ensureDropCollection("${collectionName}")`

  let logRequest = {}
  
  try {
    logRequest = createLogRequest(moduleId, sessionState, {collectionName: collectionName})
    await dropCollection(sessionState, collectionName)
  } catch (e) {
	// Swallow a Collection Not Found condition
    // writeLogEntry(moduleId,`Exception:\n${JSON.stringify(e," ",2)}`);
    if (!dbAPI.collectionNotFound(e)) {
	  throw dbAPI.processError(moduleId,logRequest,e);  
    }
  }
}

async function recreateCollection(sessionState, collectionName) {

  const moduleId = `${dbAPI.getDBDriverName()}recreateCollection("${collectionName}")`;
  // writeLogEntry(moduleId);

  try {
    await ensureDropCollection(sessionState, collectionName)
    await createCollectionWithIndexes(sessionState, collectionName)
  } catch(e) {
    throw e;
  };
}


async function recreateLoadCollection(sessionState, collectionName, contents) {

  const moduleId = `${dbAPI.getDBDriverName()}recreateLoadCollection("${collectionName},${contents.length})`;

  // Create Collection without Indexes, Load Data and then Index.

  try {
    await ensureDropCollection(sessionState, collectionName);
    await createCollection(sessionState, collectionName);
    const response = await bulkInsert(sessionState, collectionName, contents);
    await createIndexes(sessionState, collectionName);
	return response
  } catch(e) {
    throw e;
  };

}

function initialize(applicationName) {

  return dbAPI.initialize(applicationName)
  
}

function getSupportedFeatures() {

    return dbAPI.getSupportedFeatures();
	
}

function getDocumentContent(sessionState, collectionName, key, binary, eTag) {

  return dbAPI.getDocumentContent(sessionState,collectionName, key, binary, eTag) 

}

function getCollection(sessionState, collectionName, limit, fields, total) {

  return dbAPI.getCollection(sessionState, collectionName, limit, fields, total)
  
}

function queryByExample(sessionState, collectionName, qbe, limit, fields, total) {

  return dbAPI.queryByExample(sessionState, collectionName, qbe, limit, fields, total)
  
}

function postDocument(sessionState, collectionName, document, contentType) {

  return dbAPI.postDocument(sessionState, collectionName, document, contentType)

}

function bulkInsert(sessionState, collectionName, documents) {

  return dbAPI.bulkInsert(sessionState, collectionName, documents);

}

function putDocument(sessionState, collectionName, key, document, contentType, eTag) {

  return dbAPI.putDocument(sessionState, collectionName, key, document, contentType, eTag)
  
}  

function createCollection(sessionState, collectionName) {
  
  return dbAPI.createCollection(sessionState, collectionName);

}

function createIndexes(sessionState, collectionName) {
  
  return dbAPI.createIndexes(sessionState, collectionName);

}
function dropCollection(sessionState, collectionName) {
  
  return dbAPI.dropCollection(sessionState, collectionName);

}