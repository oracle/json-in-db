var http = require('http');

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
module.exports.getCollection               = getCollection
module.exports.getJSON                     = getJSON
module.exports.getDocument                 = getDocument
module.exports.queryByExample              = queryByExample
module.exports.featureDetection            = featureDetection;

var fullTextSearchSupported  = true;
var spatialIndexSupported    = true;

// Create a new object, that prototypally inherits from the Error constructor

function SodaError(details) {
  this.name    = 'SodaError';
  this.message = 'Unexpected Error while invoking Oracle Soda for Rest';
  if (details.statusCode) {
    this.statusCode = details.statusCode
  }
  this.stack   = details.cause.stack;
  this.details = details
}

SodaError.prototype = Object.create(Error.prototype);
SodaError.prototype.constructor = SodaError;

var disableSodaLogging = {sodaLoggingEnabled : false}

function generateURL(options) {

  return options.hostname 
       + ":" + options.port
       + options.path;
         
}

function newLogEntry(sessionId, operationId, options, content) {

  return {
     module              : null,
     method              : options.method,
     url                 : generateURL(options),
     request             : {
       headers           : options.headers,
       body              : content
     },
     response            : {
       statusCode        : null,
       statusText        : null,
       headers           : null,
       body              : null,
       json              : null
     },
     sessionId           : sessionId,
     operationId         : operationId,
     startTime           : (new Date()).getTime(),
     elapsedTime         : null
   }
}

function logRequest(sessionState, options, contentType, content) {

  // console.log('logRequest(' + JSON.stringify(sessionState) + ')');
  
  var logRequest = null;

  if (sessionState.sodaLoggingEnabled) {
    logRequest = { 
      logCollection : sessionState.logCollectionName,
      logEntry      : newLogEntry(sessionState.sodaSessionId, sessionState.operationId, options, contentType, content)
    }
  }   

  return logRequest;

}

function logResponse(cfg, response, endTime, logOptions) {
  
  // console.log('logResponse(' + JSON.stringify(logOptions) + ')');

  if (logOptions != null) {

    logOptions.logEntry.module               = response.module;
    logOptions.logEntry.elapsedTime          = endTime - logOptions.logEntry.startTime 
    logOptions.logEntry.response.statusCode  = response.statusCode;
    logOptions.logEntry.response.statusText  = response.statusText;
    logOptions.logEntry.response.headers     = response.headers;
    logOptions.logEntry.response.body        = response.body
    logOptions.logEntry.response.json        = response.json

    
    // console.log('logResponse(' + logOptions.logCollection + ')');

    postJSON(disableSodaLogging, cfg, logOptions.logCollection, logOptions.logEntry);
  }

}

function responseFactory(cfg, moduleName, options, logOptions, resolve, reject) {
  
  // return a custom readResponse method

  return function /* readResponse */ (sodaResponse) {

    var json = null
    var body = ""
    var chunks = []

    // console.log(moduleName + '.readResponse(): statusCode = ' + sodaResponse.statusCode + ', content-length = ' + sodaResponse.headers["content-length"] +', content-type = ' + sodaResponse.headers["content-type"]);

    if (sodaResponse.headers["content-type"] == 'application/json') {
      sodaResponse.on(
        'data' ,
        function(chunk) {
          body += chunk;
        }
      )
    }
    else {
      sodaResponse.on(
        'data' ,
        function(chunk) {
          chunks.push(chunk);
        }
      )
    }
    
    sodaResponse.on(
      'end', 
      function () {

        var endTime = new Date();
        
        if ((sodaResponse.statusCode == 200) || (sodaResponse.statusCode == 201)) {

          if (sodaResponse.headers["content-type"] == 'application/json') {
            json = JSON.parse(body);
            body = null;
            if ((json != null) && (json.items)) {
              json = json.items;
            }
          }
          else {
            if (chunks.length > 0) {
              body = Buffer.concat(chunks);
            }
          }
          
          var response = {
            module         : moduleName,
            path           : options.path,
            statusCode     : sodaResponse.statusCode,
            statusText     : http.STATUS_CODES[sodaResponse.statusCode],
            contentType    : sodaResponse.headers["content-type"],
            headers        : sodaResponse.headers,
            json           : json,
            text           : body
          }

          // console.log(JSON.stringify(response));
          logResponse(cfg, response, endTime, logOptions);
          resolve(response)
        }
        else {
          var response = { 
            module         : moduleName + '.readResponse(end)',
            statusCode     : sodaResponse.statusCode,
            statusText     : http.STATUS_CODES[sodaResponse.statusCode],
            options        : options,
            headers        : sodaResponse.headers,
            bytesRecieved  : body == null ? 0 : body.length,
            responseText   : body,
            cause          : new Error()
          }
          logResponse(cfg, response, endTime, logOptions);
          reject(new SodaError(response));
        }
      }
    );
  }
}

function createCollection(sessionState, cfg, collectionName, collectionProperties) {

  var serializedJSON = "";
  
  if ((typeof collectionProperties === "object") & (collectionProperties != null)) {
    serializedJSON = JSON.stringify(collectionProperties);
  }

  var moduleId = 'createCollection(' + collectionName + ',' + serializedJSON + ')';

  var path = cfg.path 
           + '/' + collectionName;
 
  var options = {
    hostname : cfg.hostname,
    port     : cfg.port,
    method   : 'PUT',
    path     : path,
    auth     : cfg.username + ":" + cfg.password,
    headers  : {
     'Content-Type': 'application/json',
     'Content-Length' : Buffer.byteLength(serializedJSON, 'utf8')
    }
  };
  
  var logOptions = logRequest(sessionState, options, serializedJSON);

  return new Promise(
  
    function(resolve, reject) {
 
      // console.log('Execute promise: ' + moduleId);
      
      var request = http.request(options,responseFactory(cfg, moduleId, options, logOptions, resolve, reject));

      request.on(
        'error', 
        (e) => {
          if ((e.code) && (e.code == 'HPE_UNEXPECTED_CONTENT_LENGTH')) {
            resolve()
          }
          else {
            var details = { 
              module         : moduleId + '.request(error)',
              requestOptions : options,
              cause          : e
            }
            reject(new SodaError(details));
          }
        }
      );
      if (serializedJSON.length > 0) {
        request.write(serializedJSON);
      }
      request.end();
    }
  )   
}

function createIndex(sessionState, cfg, collectionName, indexDefinition) {

  var serializedJSON  = JSON.stringify(indexDefinition);

  var moduleId = 'createIndex(' + collectionName + ',' + indexDefinition.name + ')'; 

  var path = cfg.path 
          + '/' + collectionName
          + '?' + 'action=' + 'index'
 
  var options = {
    hostname : cfg.hostname,
    port     : cfg.port,
    method   : 'POST',
    path     : path,
    auth     : cfg.username + ":" + cfg.password,
    headers  : {
     'Content-Type': 'application/json',
     'Content-Length' : Buffer.byteLength(serializedJSON, 'utf8')
    }
  };
              
  var logOptions = logRequest(sessionState, options, serializedJSON);

  // Skip Spatial Indexes in environments where spatial operations on Geo-JSON are not supported

  if ((indexDefinition.spatial) && !spatialIndexSupported) {
    console.log('Skipped creation of unsupported spatial index : ' + indexDefinition.name);
    return new Promise(function(resolve, reject) {resolve()});
  }

  return new Promise(
  
    function(resolve, reject) {
      
      // console.log('Execute promise: ' + moduleId + '. [' + serializedJSON + ']');
           
      var request = http.request(options, responseFactory(cfg, moduleId, options, logOptions, resolve, reject));

      request.on(
        'error', 
        (e) => {
          if ((e.code) && (e.code == 'HPE_UNEXPECTED_CONTENT_LENGTH')) {
            resolve()
          }
          else {
            var details = { 
              module         : moduleId + '.request(error)',
              requestOptions : options,
              cause          : e
            }
            reject(new SodaError(details));
          }
        }
      );
      request.write(serializedJSON);      
      request.end();
    }
  )   
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

function dropCollection(sessionState, cfg, collectionName) {

  var moduleId = 'dropCollection(' + collectionName + ')';
 
  var options = {
    hostname : cfg.hostname,
    port     : cfg.port,
    method   : 'DELETE',
    path     : cfg.path + '/' + collectionName,
    auth     : cfg.username + ":" + cfg.password,
    headers  : {'Content-Type': 'application/json'}
  };    
        
  var logOptions = logRequest(sessionState, options);
 
  return new Promise(
  
    function(resolve, reject) {

      // console.log('Execute promise: ' + moduleId);

      var request = http.request(options, responseFactory(cfg, moduleId, options, logOptions, resolve, reject));

      request.on(
        'error', 
        (e) => {
          if ((e.code) && (e.code == 'HPE_UNEXPECTED_CONTENT_LENGTH')) {
            resolve()
          }
          else {
            var details = { 
              module         : moduleId + '.request(error)',
              requestOptions : options,
              cause          : e
            }
            reject(new SodaError(details));
          }
        }
      );
      request.end();
    }
  )   
}

function getCollection(sessionState, cfg, collectionName,limit,fields) {

  var moduleId = 'getCollection(' + collectionName + ')';

  var path = cfg.path 
           + '/' + collectionName
           + addLimitAndFields(limit,fields);
     
  var options = {
    hostname : cfg.hostname,
    port     : cfg.port,
    method   : 'GET',
    path     : path,
    auth     : cfg.username + ":" + cfg.password,
    headers  : {'Content-Type': 'application/json'}
  };    
        
  var logOptions = logRequest(sessionState, options);

  return new Promise(
  
    function(resolve, reject) {

      // console.log('Execute Promise: ' + moduleId);
          
      var request = http.request(options, responseFactory(cfg, moduleId, options, logOptions, resolve, reject));
      
      request.on(
        'error', 
        (e) => {
          var details = { 
            module         : moduleId + '.request(error)',
            requestOptions : options,
            cause          : e
          }
          reject(new SodaError(details));
        }
      );
      request.end();
    }
  )   
}

function getJSON(sessionState, cfg, collectionName, key, eTag) {
  
  return getDocument(sessionState, cfg, collectionName, key, eTag)
  
}

function getDocument(sessionState, cfg, collectionName, key, eTag) {

  var moduleId = 'getDocument(' + collectionName + ',' + key +')';

  var options = {
    hostname : cfg.hostname,
    port     : cfg.port,
    method   : 'GET',
    path     : cfg.path+ '/' + collectionName + '/' + key,
    auth     : cfg.username + ":" + cfg.password,
    headers  : {'Content-Type': 'application/json'}
  };    
         
  var logOptions = logRequest(sessionState, options);
  
  return new Promise(
  
    function(resolve, reject) {

      // console.log('Execute promise : ' + moduleId);
      
      var request = http.request(options, responseFactory(cfg, moduleId, options, logOptions, resolve, reject));

      request.on(
        'error', 
        (e) => {
          var details = { 
            module         : moduleId + '.request(error)',
            requestOptions : options,
            cause          : e
          }
          reject(new SodaError(details));
        }
      );
      request.end();
    }
  )   
}

function postJSON(sessionState, cfg, collectionName,json) {

  // console.log('postJSON(' + collectionName + ')');

  var serializedJSON = JSON.stringify(json);
  // console.log(serializedJSON);
   
  return postDocument(sessionState, cfg, collectionName,serializedJSON,'application/json');
   
}

function postDocument(sessionState, cfg, collectionName,document,contentType) {

  var moduleId = 'postDocument(' + collectionName + ',' + contentType + ')';

  var path = cfg.path+ '/' + collectionName;

  var options = {
    hostname : cfg.hostname,
    port     : cfg.port,
    method   : 'POST',
    path     : path,
    auth     : cfg.username + ":" + cfg.password,
    headers  : {
     'Content-Type'   : contentType,
     'Content-Length' : Buffer.byteLength(document)
    }
  }    

  var logOptions = logRequest(sessionState, options,document);

  return new Promise(

    function(resolve, reject) {
      
      // console.log('Execute promise: ' + moduleId);

      var request = http.request(options, responseFactory(cfg, moduleId, options, logOptions, resolve, reject));
  
      request.on(
        'error', 
        (e) => {
          var details = { 
            module         : moduleId + '.request(error)',
            requestOptions : options,
            cause          : e
          }
          reject(new SodaError(details));
        }
      );
      request.write(document);
      request.end();
      // console.log('postDocument(' + collectionName + '): Bytes written = ' + Buffer.byteLength(document));
    }
  )   
}


function bulkInsert(sessionState, cfg, collectionName,documents) {

  var moduleId = 'bulkInsert(' + collectionName + ')';
  
  var serializedJSON = JSON.stringify(documents);
  // console.log(serializedJSON);

  var path = cfg.path 
           + '/' + collectionName 
           + '?' + 'action=' + 'insert';

  var options = {
    hostname : cfg.hostname,
    port     : cfg.port,
    method   : 'POST',
    path     : path,
    auth     : cfg.username + ":" + cfg.password,
    headers  : {
     'Content-Type' : 'application/json',
     'Content-Length' : Buffer.byteLength(serializedJSON, 'utf8')
    }
  }    

  var logOptions = logRequest(sessionState, options, serializedJSON);

  return new Promise(

    function(resolve, reject) {

      // console.log('Execute promise: ' + moduleId);
      
      var request = http.request(options, responseFactory(cfg, moduleId, options, logOptions, resolve, reject));

      request.on(
        'error', 
        (e) => {
          var details = { 
            module         : moduleId + '.request(error)',
            requestOptions : options,
            cause          : e
          }
          reject(new SodaError(details));
        }
      );
      request.write(serializedJSON);
      request.end();
    }
  )   
}


function putJSON(sessionState, cfg, collectionName,key,json,eTag) {

  // console.log('putJSON(' + collectionName + ',' + key + ')');

  var serializedJSON = JSON.stringify(json);
  // console.log(serializedJSON);
   
  return putDocument(sessionState, cfg, collectionName,key,serializedJSON,'application/json',eTag);
   
}

function putDocument(sessionState, cfg, collectionName, key, document, contentType, eTag) {

  var moduleId = 'putDocument(' + collectionName + ')' + key + ',' + contentType + ')';
  
  var path = cfg.path 
           + '/' + collectionName 
           + '/' + key;

  var options = {
    hostname : cfg.hostname,
    port     : cfg.port,
    method   : 'PUT',
    path     : path,
    auth     : cfg.username + ":" + cfg.password,
    headers  : {
     'Content-Type' : contentType,
     'Content-Length' : Buffer.byteLength(document)
    }
  }    
  
  if (eTag) {
    headers["If-Match"] = eTag;
  }

  var logOptions = logRequest(sessionState, options, document);

  return new Promise(

    function(resolve, reject) {

      // console.log('Execute promise : ' + moduleId);
      
      var request = http.request(options, responseFactory(cfg, moduleId, options, logOptions, resolve, reject));

      request.on(
        'error', 
        (e) => {
          if ((e.code) && (e.code == 'HPE_UNEXPECTED_CONTENT_LENGTH')) {
            resolve({status:200})
          }
          else {
            var details = { 
              module         : moduleId + '.request(error)',
              requestOptions : options,
              cause          : e
            }
            reject(new SodaError(details));
          }
        }
      );
      request.write(document);
      request.end();
    }
  )   
}

function addLimitAndFields(limit,fields) {

      if (!fields) {
        fields = 'all';
      }
      
      var query = '?' + 'fields=' + fields;
       
      
      if (limit) {
        query = query
             + '&' + 'limit=' + limit;
      }
        
      return query;
  
}

function queryByExample(sessionState, cfg, collectionName, qbe, limit, fields) {

  var qbeText  = JSON.stringify(qbe);
  var moduleId = 'queryByExample(' + collectionName + ',' + qbeText +')';
  
  var path = cfg.path 
           + '/' + collectionName 
           + addLimitAndFields(limit,fields)
           + '&' + 'action=' + 'query';
  
  // console.log('queryByExample() path = ' + path);

  var options = {
    hostname : cfg.hostname,
    port     : cfg.port,
    method   : 'POST',
    path     : path,
    auth     : cfg.username + ":" + cfg.password,
    headers  : {
     'Content-Type' : 'application/json',
     'Content-Length' : Buffer.byteLength(qbeText, 'utf8')
    }
  }
      
  var logOptions = logRequest(sessionState, options, qbeText);
  
  return new Promise(

    function(resolve, reject) {
     
      // console.log('Execute promise : ' + moduleId);

      var request = http.request(options, responseFactory(cfg, moduleId, options, logOptions, resolve, reject));
      
      request.on(
        'error', 
        (e) => {
          var details = { 
            module         : moduleId + '.request(error)',
            requestOptions : options,
            cause          : e
          }
          reject(new SodaError(details));
        }
      );
      request.write(qbeText);
      request.end();
    }
  )   
}

function recreateCollection(sessionState, cfg, collectionName,collectionProperties) {
   
  return dropCollection(sessionState, cfg, collectionName).catch(function(e){
     if ((e) && (e.statusCode) && (e.statusCode == 404)) {
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
  
  createCollection(disableSodaLogging, cfg, collectionName).then(function(){;
    var qbe = {id : {"$contains" : 'XXX'}}
    return queryByExample(disableSodaLogging, cfg, collectionName, qbe)
  }).then(function(sodaResponse){
  }).catch(function(sodaError){
    if (sodaError.details.statusCode == 400) {
      sodaErrorDetails = JSON.parse(sodaError.details.responseText);
      // console.log(JSON.stringify(sodaErrorDetails));
      if (sodaErrorDetails.title == 'The field name $contains is not a recognized operator.') {
      // if (sodaErrorDetails['o:errorCode'] == 'SODA-02002') {
        fullTextSearchSupported = false;
      }
    }
  }).then(function() {

  /*
  ** Test for $NEAR support and spatial indexes.
  */ 
  
    var qbe = {
      "geoCoding":
      {
        "$near" :
        {
          "$geometry" : {"type" : "Point", "coordinates" : [-122.12469369777311,37.895215209615884]},
          "$distance" : 5,
          "$unit" : "mile"
        }
      }
    }
    return queryByExample(disableSodaLogging, cfg, collectionName, qbe)
  }).then(function(sodaResponse){
  }).catch(function(sodaError){
    if (sodaError.details.statusCode == 400) {
      sodaErrorDetails = JSON.parse(sodaError.details.responseText);
      // console.log(JSON.stringify(sodaErrorDetails));
      if (sodaErrorDetails.title == 'The field name $near is not a recognized operator.') {
      // if (sodaErrorDetails['o:errorCode'] == 'SODA-02002') {
        spatialIndexSupported = false;
      }
    }
  }).then(function() {
    return dropCollection(disableSodaLogging,cfg,collectionName);
  }).then(function() {
   console.log('Full Text Search Supported: ' + fullTextSearchSupported);
   console.log('Spatial Indexing Supported: ' + spatialIndexSupported);
  });

};

  
  
  
  