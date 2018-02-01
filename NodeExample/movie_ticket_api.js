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

const dbAPI = require('./cloudDB_api.js');
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
                                             
module.exports.createScreeningCollection         = createScreeningCollection;
module.exports.dropScreeningCollection           = dropScreeningCollection;
module.exports.recreateScreeningCollection       = recreateScreeningCollection;
module.exports.recreateLoadScreeningCollection   = recreateLoadScreeningCollection;
module.exports.insertScreenings                  = insertScreenings;
module.exports.getScreenings                     = getScreenings;
module.exports.getScreening                      = getScreening;
module.exports.queryScreenings                   = queryScreenings;
module.exports.updateScreening                   = updateScreening;
                                             
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
                                             
module.exports.initialize                        = initialize;
module.exports.getDBDriverName                   = getDBDriverName;
module.exports.logError                          = logError;
module.exports.writeLogEntry                     = writeLogEntry;
module.exports.getSupportedFeatures              = getSupportedFeatures

async function initialize(sessionState) {

  if ((sessionState.dbLoggingEnabled) && (sessionState.logCollectionName == null)) {
    sessionState.logCollectionName = LOG_COLLECTION_NAME;
  }

  await dbAPI.initialize(APPLICATION_NAME);
  await createEmptyCollections();
  return
}

async function getSupportedFeatures() {
	
	return dbAPI.getSupportedFeatures();

}

function getDBDriverName() {
	
	return dbAPI.getDBDriverName();

}

// Theater Collection

function createTheaterCollection(sessionState) {
	
	return dbAPI.createCollectionWithIndexes(sessionState, 'Theater');

}

function dropTheaterCollection(sessionState) {
	
	return dbAPI.ensureDropCollection(sessionState, 'Theater');

}

function recreateTheaterCollection(sessionState) {
	
	return dbAPI.recreateCollection(sessionState, 'Theater');

}
function insertTheaters(sessionState, theaterList) {
	
	return dbAPI.bulkInsert(sessionState, 'Theater',theaterList);

}

function getTheaters(sessionState, limit, fields, includeTotal) {
  
   return dbAPI.getCollection(sessionState, 'Theater', limit, fields, includeTotal)
     
}

function getTheater(sessionState, key, etag) {
	
	return dbAPI.getJSON(sessionState, 'Theater', key, etag);

}

async function getTheaterById(sessionState, id) {

  var qbe = {'id': id};
  
  let httpResponse = await dbAPI.queryByExample(sessionState, 'Theater', qbe, 1);
  httpResponse.json = httpResponse.json.items[0]
  return httpResponse;
}

function queryTheaters(sessionState, qbe, limit, fields, includeTotal) {
	
	return dbAPI.queryByExample(sessionState, 'Theater', qbe, limit, fields, includeTotal);

}

// Movie Collection

function createMovieCollection(sessionState) {
	
	return dbAPI.createCollectionWithIndexes(sessionState, 'Movie');

}

function dropMovieCollection(sessionState) {
	
	return dbAPI.ensureDropCollection(sessionState, 'Movie');

}

function recreateMovieCollection(sessionState) {
	
	return dbAPI.recreateCollection(sessionState, 'Movie');

}

function insertMovies(sessionState, movieList) {
	
	return dbAPI.bulkInsert(sessionState, 'Movie',movieList);

}

function getMovies(sessionState,  limit, fields, includeTotal) {
  
   return dbAPI.getCollection(sessionState, 'Movie', limit, fields, includeTotal)
     
}

function getMovie(sessionState, key, etag) {
	
	return dbAPI.getJSON(sessionState, 'Movie', key, etag);

}

function updateMovie(sessionState, key, movie, etag) {
	
	return dbAPI.putJSON(sessionState, 'Movie', key, movie, etag);

}

async function getMovieById(sessionState,id) {

  var qbe = {'id': id};
   
  let httpResponse = await dbAPI.queryByExample(sessionState, 'Movie', qbe, 1)
  httpResponse.json = httpResponse.json.items[0]
  return httpResponse;
}

function moviesByReleaseDateService(sessionState) {

  var qbe = {"$query" : {}, $orderby :{"releaseDate" :-1}};
  return dbAPI.queryByExample(sessionState, 'Movie', qbe)
}

function queryMovies(sessionState, qbe, limit, fields, includeTotal) {
	
	return dbAPI.queryByExample(sessionState, 'Movie', qbe, limit, fields, includeTotal);

}

// Screening Collection

function createScreeningCollection(sessionState) {
	
	return dbAPI.createCollectionWithIndexes(sessionState, 'Screening');

}

function dropScreeningCollection(sessionState) {
	
	return dbAPI.ensureDropCollection(sessionState, 'Screening');

}

function recreateScreeningCollection(sessionState) {
	
	return dbAPI.recreateCollection(sessionState, 'Screening');

}

function insertScreenings(sessionState, screeningList) {
	
	return dbAPI.bulkInsert(sessionState, 'Screening',screeningList);

}

function getScreenings(sessionState,  limit, fields, includeTotal) {
  
   return dbAPI.getCollection(sessionState, 'Screening', limit, fields, includeTotal)
     
}

function getScreening(sessionState, key, etag) {
	
	return dbAPI.getJSON(sessionState, 'Screening', key, etag);

}

function queryScreenings(sessionState, qbe, limit, fields, includeTotal) {
	
	return dbAPI.queryByExample(sessionState, 'Screening', qbe, limit, fields, includeTotal);

}

function updateScreening(sessionState, key,screening,etag) {
	
	return dbAPI.putJSON(sessionState, 'Screening',key,screening,etag);

}

// Ticket Sale Collection

function createTicketSaleCollection(sessionState) {
	
	return dbAPI.createCollectionWithIndexes(sessionState, 'TicketSale');

}

function dropTicketSaleCollection(sessionState) {
	
	return dbAPI.ensureDropCollection(sessionState, 'TicketSale');

}

function recreateTicketSaleCollection(sessionState) {
	
	return dbAPI.recreateCollection(sessionState, 'TicketSale');

}

function insertTicketSales(sessionState, ticketSaleList) {
	
	return dbAPI.bulkInsert(sessionState, 'TicketSale', ticketSaleList);

}

function insertTicketSale(sessionState, ticketSale) {
	
	return dbAPI.ensurePostJSON(sessionState, 'TicketSale', ticketSale);

}

function updateTicketSale(sessionState, key,ticketSale,etag) {
	
	return dbAPI.putJSON(sessionState, 'TicketSale', key, ticketSale,etag);

}

function queryTicketSales(sessionState, qbe, limit, fields, includeTotal) {
	
	return dbAPI.queryByExample(sessionState, 'TicketSale', qbe, limit, fields, includeTotal);

}


// Poster Collection

function createPosterCollection(sessionState) {
	
	return dbAPI.createCollectionWithIndexes(sessionState, 'Poster');

}

function dropPosterCollection(sessionState) {
	
	return dbAPI.ensureDropCollection(sessionState, 'Poster');

}

function recreatePosterCollection(sessionState) {
	
	return dbAPI.recreateCollection(sessionState, 'Poster');

}

function insertPoster(sessionState, poster) {
	
	return dbAPI.postDocument(sessionState, 'Poster',poster,'image/jpeg');

}

function getPosters(sessionState, limit, fields, includeTotal) {
  
   return dbAPI.getCollection(sessionState, 'Poster', limit, fields, includeTotal)
     
}

function getPoster(sessionState, key) {
	
	return dbAPI.getBinaryDocument(sessionState, 'Poster',key);

}

function createLogRecordCollection() {
	
	return dbAPI.createCollectionWithIndexes(constants.DB_LOGGING_DISABLED, LOG_COLLECTION_NAME);

}

async function createEmptyCollections() {

  try {
    await createLogRecordCollection();
    await createTicketSaleCollection(constants.DB_LOGGING_DISABLED);
  } catch (e) {
   	console.log('movie_ticket_api.js: Error during Collection Creation.');
	console.log(JSON.stringify(e));
    throw e;
  };
}



function writeLogEntry(logEntry) {
	 
	 return dbAPI.ensurePostJSON(constants.DB_LOGGING_DISABLED, LOG_COLLECTION_NAME, logEntry);
	 
}

function logError(error, body) {
	 
	 error.body = body;	
	 writeLogEntry(error);
	 
}

function getLogRecordByOperationId(id) {

  var qbe = {'operationId': id, '$orderby' : {'startTime':1}};
  
  let httpResponse;
  
  httpResponse = dbAPI.queryByExample(constants.DB_LOGGING_DISABLED, LOG_COLLECTION_NAME, qbe)
  return httpResponse;
}

function recreateLoadMovieCollection(sessionState, movieCache) {
	
	return dbAPI.recreateLoadCollection(sessionState, 'Movie', movieCache);
	
}

function recreateLoadTheaterCollection(sessionState, theaterList) {
	
	return dbAPI.recreateLoadCollection(sessionState, 'Theater', theaterList);
	
}

function recreateLoadScreeningCollection(sessionState, screenings) {
	
	return dbAPI.recreateLoadCollection(sessionState, 'Screening', screenings);
	
}
