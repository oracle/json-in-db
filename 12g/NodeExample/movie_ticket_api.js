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

const APPLICATION_NAME       = "MovieTicketing"
const LOG_COLLECTION_NAME     = 'MovieTicketLog';

const docStoreAPI = require('./docStore_API.js');
const constants = require('./constants.js');

module.exports.createTheaterCollection           = createTheaterCollection;
module.exports.dropTheaterCollection             = dropTheaterCollection;
module.exports.recreateTheaterCollection         = recreateTheaterCollection;
module.exports.recreateLoadTheaterCollection     = recreateLoadTheaterCollection;
module.exports.insertTheaters                    = insertTheaters
module.exports.getTheaters                       = getTheaters;
module.exports.getTheater                        = getTheater;
module.exports.getTheaterById                    = getTheaterById;
module.exports.queryTheaters                     = queryTheaters
module.exports.bulkInsertTheaters                = bulkInsertTheaters
module.exports.indexTheaters                     = indexTheaters

module.exports.createMovieCollection             = createMovieCollection;
module.exports.dropMovieCollection               = dropMovieCollection;
module.exports.recreateMovieCollection           = recreateMovieCollection;
module.exports.recreateLoadMovieCollection       = recreateLoadMovieCollection;
module.exports.insertMovies                      = insertMovies;
module.exports.getMovies                         = getMovies;
module.exports.moviesByReleaseDateService        = moviesByReleaseDateService;
module.exports.getMovie                          = getMovie;
module.exports.getMovieById                      = getMovieById
module.exports.updateMovie                       = updateMovie;
module.exports.queryMovies                       = queryMovies
module.exports.bulkInsertMovies                  = bulkInsertMovies
module.exports.indexMovies                       = indexMovies
                                             
module.exports.createScreeningCollection         = createScreeningCollection;
module.exports.dropScreeningCollection           = dropScreeningCollection;
module.exports.recreateScreeningCollection       = recreateScreeningCollection;
module.exports.recreateLoadScreeningCollection   = recreateLoadScreeningCollection;
module.exports.insertScreenings                  = insertScreenings;
module.exports.getScreenings                     = getScreenings;
module.exports.getScreening                      = getScreening;
module.exports.queryScreenings                   = queryScreenings;
module.exports.updateScreening                   = updateScreening;
module.exports.bulkInsertScreenings              = bulkInsertScreenings
module.exports.indexScreenings                   = indexScreenings
                                             
module.exports.createTicketSaleCollection        = createTicketSaleCollection;
module.exports.dropTicketSaleCollection          = dropTicketSaleCollection;
module.exports.insertTicketSales                 = insertTicketSales;
module.exports.insertTicketSale                  = insertTicketSale;
module.exports.queryTicketSales                  = queryTicketSales;
module.exports.updateTicketSale                  = updateTicketSale;
                                             
module.exports.createPosterCollection            = createPosterCollection;
module.exports.dropPosterCollection              = dropPosterCollection;
module.exports.recreatePosterCollection          = recreatePosterCollection;
module.exports.insertPoster                      = insertPoster;
module.exports.getPosters                        = getPosters;
module.exports.getPoster                         = getPoster;
                                             
module.exports.getLogRecordByOperationId         = getLogRecordByOperationId
                                             
module.exports.logError                          = logError;
module.exports.writeLogEntry                     = writeLogEntry;

module.exports.initialize                        = initialize;
module.exports.getDBDriverName                   = getDBDriverName;
module.exports.getSupportedFeatures              = getSupportedFeatures
module.exports.setDatabaseName                   = setDatabaseName

async function initialize(sessionState) {

  if ((sessionState.dbLoggingEnabled) && (sessionState.logCollectionName == null)) {
    sessionState.logCollectionName = LOG_COLLECTION_NAME;
  }

  await docStoreAPI.initialize(APPLICATION_NAME);
  await createEmptyCollections();
  return
}

async function getSupportedFeatures() {
	
	return docStoreAPI.getSupportedFeatures();

}

function getDBDriverName() {
	
	return docStoreAPI.getDBDriverName();

}

function setDatabaseName(databaseName) {
	
	return docStoreAPI.setDatabaseName(databaseName);

}

// Theater Collection

function createTheaterCollection(sessionState, createIndexes) {
	
	if ((createIndexes === undefined) || (createIndexes)) {
	  return docStoreAPI.createCollectionWithIndexes(sessionState, 'Theater');
    }
	else {
	   return docStoreAPI.createCollection(sessionState,'Theater');
	}

}

function dropTheaterCollection(sessionState) {
	
	return docStoreAPI.ensureDropCollection(sessionState, 'Theater');

}

function recreateTheaterCollection(sessionState) {
	
	return docStoreAPI.recreateCollection(sessionState, 'Theater');

}
function insertTheaters(sessionState, theaterList) {
	
	return docStoreAPI.bulkInsert(sessionState, 'Theater',theaterList);

}

function getTheaters(sessionState, limit, fields, includeTotal) {
  
   return docStoreAPI.getCollection(sessionState, 'Theater', limit, fields, includeTotal)
     
}

function getTheater(sessionState, key, etag) {
	
	return docStoreAPI.getJSON(sessionState, 'Theater', key, etag);

}

async function getTheaterById(sessionState, id) {

  var qbe = {'id': id};
  
  let httpResponse = await docStoreAPI.queryByExample(sessionState, 'Theater', qbe, 1);
  if (httpResponse.json.count ===  1) {
    httpResponse.json = httpResponse.json.items[0]
  }
  return httpResponse;
}

function queryTheaters(sessionState, qbe, limit, fields, includeTotal) {
	
	return docStoreAPI.queryByExample(sessionState, 'Theater', qbe, limit, fields, includeTotal);

}

function bulkInsertTheaters(sessionState,documents) {
	
	return docStoreAPI.bulkInsert(sessionState, 'Theater', documents)

}

function indexTheaters(sessionState) {
	
	return docStoreAPI.createIndexes(sessionState, 'Theater')

}

// Movie Collection

function createMovieCollection(sessionState,createIndexes) {
	
	if ((createIndexes === undefined) || (createIndexes)) {
      return docStoreAPI.createCollectionWithIndexes(sessionState, 'Movie');
	  return docStoreAPI.createCollectionWithIndexes(sessionState, 'Theater');
    }
	else {
       return docStoreAPI.createCollection(sessionState, 'Movie');
	}

}

function dropMovieCollection(sessionState) {
	
	return docStoreAPI.ensureDropCollection(sessionState, 'Movie');

}

function recreateMovieCollection(sessionState) {
	
	return docStoreAPI.recreateCollection(sessionState, 'Movie');

}

function insertMovies(sessionState, movieList) {
	
	return docStoreAPI.bulkInsert(sessionState, 'Movie',movieList);

}

function getMovies(sessionState,  limit, fields, includeTotal) {
  
   return docStoreAPI.getCollection(sessionState, 'Movie', limit, fields, includeTotal)
     
}

function getMovie(sessionState, key, etag) {
	
	return docStoreAPI.getJSON(sessionState, 'Movie', key, etag);

}

function updateMovie(sessionState, key, movie, etag) {
	
	return docStoreAPI.putJSON(sessionState, 'Movie', key, movie, etag);

}

async function getMovieById(sessionState,id) {

  var qbe = {'id': id};
   
  let httpResponse = await docStoreAPI.queryByExample(sessionState, 'Movie', qbe, 1)
  if (httpResponse.json.count ===  1) {
    httpResponse.json = httpResponse.json.items[0]
  }
  return httpResponse;
}

function moviesByReleaseDateService(sessionState) {

  var qbe = {"$query" : {}, $orderby :{"releaseDate" :-1}};
  return docStoreAPI.queryByExample(sessionState, 'Movie', qbe)
}

function queryMovies(sessionState, qbe, limit, fields, includeTotal) {
	
	return docStoreAPI.queryByExample(sessionState, 'Movie', qbe, limit, fields, includeTotal);

}

// Screening Collection

function bulkInsertMovies(sessionState,documents) {
	
	return docStoreAPI.bulkInsert(sessionState, 'Movie', documents)

}

function indexMovies(sessionState) {
	
	return docStoreAPI.createIndexes(sessionState, 'Movie')

}

function createScreeningCollection(sessionState) {
	
	return docStoreAPI.createCollectionWithIndexes(sessionState, 'Screening');

}

function dropScreeningCollection(sessionState) {
	
	return docStoreAPI.ensureDropCollection(sessionState, 'Screening');

}

function recreateScreeningCollection(sessionState) {
	
	return docStoreAPI.recreateCollection(sessionState, 'Screening');

}

function insertScreenings(sessionState, screeningList) {
	
	return docStoreAPI.bulkInsert(sessionState, 'Screening',screeningList);

}

function getScreenings(sessionState,  limit, fields, includeTotal) {
  
   return docStoreAPI.getCollection(sessionState, 'Screening', limit, fields, includeTotal)
     
}

function getScreening(sessionState, key, etag) {
	
	return docStoreAPI.getJSON(sessionState, 'Screening', key, etag);

}

function queryScreenings(sessionState, qbe, limit, fields, includeTotal) {
	
	return docStoreAPI.queryByExample(sessionState, 'Screening', qbe, limit, fields, includeTotal);

}

function updateScreening(sessionState, key,screening,etag) {
	
	return docStoreAPI.putJSON(sessionState, 'Screening',key,screening,etag);

}

function bulkInsertScreenings(sessionState,documents) {
	
	return docStoreAPI.bulkInsert(sessionState, 'Screening', documents)

}

function indexScreenings(sessionState) {
	
	return docStoreAPI.createIndexes(sessionState, 'Screening')

}

// Ticket Sale Collection

function createTicketSaleCollection(sessionState) {
	
	return docStoreAPI.createCollectionWithIndexes(sessionState, 'TicketSale');

}

function dropTicketSaleCollection(sessionState) {
	
	return docStoreAPI.ensureDropCollection(sessionState, 'TicketSale');

}

function recreateTicketSaleCollection(sessionState) {
	
	return docStoreAPI.recreateCollection(sessionState, 'TicketSale');

}

function insertTicketSales(sessionState, ticketSaleList) {
	
	return docStoreAPI.bulkInsert(sessionState, 'TicketSale', ticketSaleList);

}

function insertTicketSale(sessionState, ticketSale) {
	
	return docStoreAPI.ensurePostJSON(sessionState, 'TicketSale', ticketSale);

}

function updateTicketSale(sessionState, key,ticketSale,etag) {
	
	return docStoreAPI.putJSON(sessionState, 'TicketSale', key, ticketSale,etag);

}

function queryTicketSales(sessionState, qbe, limit, fields, includeTotal) {
	
	return docStoreAPI.queryByExample(sessionState, 'TicketSale', qbe, limit, fields, includeTotal);

}


// Poster Collection

function createPosterCollection(sessionState) {
	
	return docStoreAPI.createCollectionWithIndexes(sessionState, 'Poster');

}

function dropPosterCollection(sessionState) {
	
	return docStoreAPI.ensureDropCollection(sessionState, 'Poster');

}

function recreatePosterCollection(sessionState) {
	
	return docStoreAPI.recreateCollection(sessionState, 'Poster');

}

function insertPoster(sessionState, poster) {
	
	return docStoreAPI.postDocument(sessionState, 'Poster',poster,'image/jpeg');

}

function getPosters(sessionState, limit, fields, includeTotal) {
  
   return docStoreAPI.getCollection(sessionState, 'Poster', limit, fields, includeTotal)
     
}

function getPoster(sessionState, key) {
	
	return docStoreAPI.getBinaryDocument(sessionState, 'Poster',key);

}

function createLogRecordCollection() {
	
	return docStoreAPI.createCollectionWithIndexes(constants.DB_LOGGING_DISABLED, LOG_COLLECTION_NAME);

}

async function createEmptyCollections() {

  try {
    await createLogRecordCollection();
    await createTicketSaleCollection(constants.DB_LOGGING_DISABLED);
  } catch (e) {
    throw e;
  };
}



function writeLogEntry(logEntry) {
	 
	 return docStoreAPI.ensurePostJSON(constants.DB_LOGGING_DISABLED, LOG_COLLECTION_NAME, logEntry);
	 
}

function logError(error, body) {
	 
	 error.body = body;	
	 writeLogEntry(error);
	 
}

function getLogRecordByOperationId(sessionId, operationId) {

  var qbe = {'sessionId' : sessionId, 'operationId': operationId, '$orderby' : {'startTime':1}};
  
  let httpResponse;
  
  httpResponse = docStoreAPI.queryByExample(constants.DB_LOGGING_DISABLED, LOG_COLLECTION_NAME, qbe)
  return httpResponse;
}

function recreateLoadMovieCollection(sessionState, movieCache) {
	
	return docStoreAPI.recreateLoadCollection(sessionState, 'Movie', movieCache);
	
}

function recreateLoadTheaterCollection(sessionState, theaterList) {
	
	return docStoreAPI.recreateLoadCollection(sessionState, 'Theater', theaterList);
	
}

function recreateLoadScreeningCollection(sessionState, screenings) {
	
	return docStoreAPI.recreateLoadCollection(sessionState, 'Screening', screenings);
	
}
