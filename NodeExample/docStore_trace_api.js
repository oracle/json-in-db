"use strict";

const driverMapper = require('./driver_mapper.js')
const dbAPI = require(`${getDBAPI()}`);

const TRACE_RESULTS = false
const TRACE_PROMISE_EXECUTION = false;
const TRACE_EXCEPTIONS = false;

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


function writeLogEntry(module,comment) {
	
  const message = ( comment === undefined) ? module : `${module}: ${comment}`
  console.log(`${new Date().toISOString()}: docStore.TRACE.${message}`);
}

function getDBAPI() {
 
  let driver = process.argv[process.argv.length-1]

  if ( driver === 'TRACE') {
    driver = process.argv[process.argv.length-2]
  }

  let driverMapping = driverMapper.getDriverMapping(driver)
  return driverMapping

  }

function getDBDriverName() {

    return dbAPI.getDBDriverName();
	
}

function getSupportedFeatures() {

  const moduleId = `getSupportedFeatures()`

  return new Promise(async function(resolve,reject) {
    let startTime = null;
	try {
 	  startTime = new Date().getTime()
      const results = dbAPI.getSupportedFeatures();
      const elapsedTime = new Date().getTime() - startTime
	  if (TRACE_RESULTS) writeLogEntry(moduleId,JSON.stringify(results," ",2))
      writeLogEntry(moduleId,`Returned features in ${elapsedTime} ms.`);  
	  resolve(results)
    } catch (e) {
 	  reject(e)
    }
  })
  
}

function setDatabaseName(databaseName) {
	
	return dbAPI.setDatabaseName(databaseName);

}

function processError(invokerId, logRequest, e) {

   return dbAPI.processError(invokerId, logRequest, e)
   
}

async function initialize(applicationName,docStore) {

  const moduleId = `initialize()`
  writeLogEntry(moduleId,`Database Driver = ${dbAPI.getDBDriverName()}. Application = "${applicationName}".`)
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    let startTime = null;
    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  startTime = new Date().getTime()
	  const results = await dbAPI.initialize(applicationName,docStore)
      const elapsedTime = new Date().getTime() - startTime
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)	
      writeLogEntry(moduleId,`Initialization completed in ${elapsedTime} ms.`);  
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
      const elapsedTime = new Date().getTime() - startTime
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${elapsedTime} ms.`);
	  reject(e)
    }
  })        
  
}

function getDocumentContent(sessionState, collectionName, key, binary, etag) {

  const moduleId = `getDocumentContent("${collectionName}","${key}",${binary},"${etag}")`
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  const results = await dbAPI.getDocumentContent(sessionState,collectionName, key, binary, etag) 
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)
      if (results.contentType === 'application/json') {
        writeLogEntry(moduleId,`Returned document in ${results.elapsedTime} ms.`);  
	  } 
	  else {
  	    try {
		  writeLogEntry(moduleId,`Returned ${Buffer.byteLength(results.body.length)} bytes of media in ${results.elapsedTime} ms. ContentType "${results.contentType}.`);
		} catch (e) {
		  writeLogEntry(moduleId,`Returned unusable media in ${results.elapsedTime} ms. ContentType "${results.contentType}.`);
		}
      }
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  }) 
}

function getCollection(sessionState, collectionName, limit, fields, includeTotal) {

  const moduleId = `getCollection("${collectionName}",${limit},${fields},${includeTotal})`
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  const results = await dbAPI.getCollection(sessionState, collectionName, limit, fields, includeTotal)
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)	
      writeLogEntry(moduleId,`Returned ${results.json.items.length} documents in ${results.elapsedTime} ms. ${results.batchCount > 1 ? `Executed ${results.batchCount} operations.` : ""}`);  
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  })        
}

function queryByExample(sessionState, collectionName, qbe, limit, fields, includeTotal) {
 
  const moduleId = `queryByExample("${collectionName}",${limit},"${fields}",${includeTotal})`
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
      sessionState.sqlTrace = true;  
	  const qbeClone = JSON.parse(JSON.stringify(qbe))
	  const results = await dbAPI.queryByExample(sessionState, collectionName, qbe, limit, fields, includeTotal)
      delete sessionState.sqlTrace
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)	
      writeLogEntry(moduleId,`\nQBE expression:\n${JSON.stringify(qbeClone)}${sessionState.qbeRewrite !== undefined ? `\nQuery translation:\n${JSON.stringify(sessionState.qbeRewrite)}` : ""}`);  
      writeLogEntry(moduleId,`Returned ${results.json.items.length} documents in ${results.elapsedTime} ms. ${results.batchCount > 1 ? `Executed ${results.batchCount} operations.` : ""}`);  
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
      delete sessionState.sqlTrace
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  })   
}

function postDocument(sessionState, collectionName, document, contentType) {

  const moduleId = `postDocument("${collectionName}","${contentType}")`
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  const results = await dbAPI.postDocument(sessionState, collectionName, document, contentType)
      writeLogEntry(moduleId,`Inserted document in ${results.elapsedTime} ms.`);  
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  }) 
}

function bulkInsert(sessionState, collectionName, documents) {

  const moduleId = `bulkInsert("${collectionName}",${documents.length})`
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  const results = await dbAPI.bulkInsert(sessionState, collectionName, documents);
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)	
      writeLogEntry(moduleId,`Inserted ${results.json.items.length} documents in ${results.elapsedTime} ms. ${results.batchCount > 1 ? `Executed ${results.batchCount} operations.` : ""}`);  
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  })        

}

function putDocument(sessionState, collectionName, key, document, contentType, etag) {

  const moduleId = `putDocument("${collectionName}","${key}","${contentType}",${etag}")`
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  const results = await dbAPI.putDocument(sessionState, collectionName, key, document, contentType, etag)
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)	
      writeLogEntry(moduleId,`Updated document in ${results.elapsedTime} ms.`);  
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  })   
}  

async function deleteDocument(sessionState, collectionName, key, etag) {

  const moduleId = `putDocument("${collectionName}","${key}","${etag}")`
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  const results = await dbaAPI.deleteDocument(sessionState,collectionName, key, etag)
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)	
      writeLogEntry(moduleId,`Deleted document in ${results.elapsedTime} ms.`);  
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  })   
}
	
function createIndex(sessionState, collectionName, indexName, metadata) {
  
  const moduleId = `createIndex("${collectionName}","${indexName}")`;
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  const results = await dbAPI.createIndex(sessionState, collectionName, indexName, metadata);
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)	
      writeLogEntry(moduleId,`Created Index in ${results.elapsedTime} ms.`);
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  })        

}
function createIndexes(sessionState, collectionName) {
  
  const moduleId = `createIndexes("${collectionName}")`;
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  const results = await dbAPI.createIndexes(sessionState, collectionName);
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)		  
      writeLogEntry(moduleId,`Created Indexes in ${results.elapsedTime} ms.`);
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  })        

}

function collectionExists(e) {
	
  return dbAPI.collectionExists(e)

}

function createCollection(sessionState, collectionName) {
  
  const moduleId = `createCollection("${collectionName}")`;
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  const results = await dbAPI.createCollection(sessionState, collectionName);
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)	
      writeLogEntry(moduleId,`Created collection in ${results.elapsedTime} ms.`);
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  })        

}

function collectionNotFound(e) {
	
  return dbAPI.collectionNotFound(e)

}

function dropCollection(sessionState, collectionName) {
  
  const moduleId = `dropCollection("${collectionName}")`;
  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,'Generating Promise')
  
  return new Promise(async function(resolve,reject) {

    try {
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executing Promise`)	
	  const results = await dbAPI.dropCollection(sessionState, collectionName);
	  if (TRACE_PROMISE_EXECUTION) writeLogEntry(moduleId,`Executed Promise`)	
      writeLogEntry(moduleId,`Dropped collection in ${results.elapsedTime} ms.`);
	  if (TRACE_RESULTS) writeLogEntry(JSON.stringify(results," ",2))
	  resolve(results)
    } catch (e) {
	  if (TRACE_EXCEPTIONS) console.log(e)
      writeLogEntry(moduleId,`Exception: status ${e.status}. Execution Time ${e.elapsedTime} ms.`);
	  reject(e)
    }
  })        

}