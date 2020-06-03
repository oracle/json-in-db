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

const util = require('util');
const uuidv4 = require('uuid/v4')
const cfg = require('./config.js');
const constants = require('./constants.js');
const movieAPI = require('./movie_ticket_api.js');

module.exports.theatersService               = theatersService;
module.exports.theaterService                = theaterService;
module.exports.theaterByIdService            = theaterByIdService;
module.exports.searchTheatersService         = searchTheatersService;
module.exports.moviesByTheaterService        = moviesByTheaterService;
module.exports.locateTheatersService         = locateTheatersService;
module.exports.moviesService                 = moviesService;
module.exports.movieService                  = movieService;
module.exports.moviesByReleaseDateService    = moviesByReleaseDateService
module.exports.movieByIdService              = movieByIdService;
module.exports.searchMoviesService           = searchMoviesService;
module.exports.theatersByMovieService        = theatersByMovieService;
module.exports.moviesInTheatersService       = moviesInTheatersService;
module.exports.screeningService              = screeningService
module.exports.bookTicketService             = bookTicketService;
module.exports.posterService                 = posterService;
module.exports.logRecordsByOperationService  = logRecordsByOperationService
module.exports.applicationStatusService      = applicationStatusService
module.exports.updateDataSourcesService      = updateDataSourcesService
                                             
module.exports.initialize                    = initialize;
module.exports.setSessionState               = setSessionState;

function writeLogEntry(module,comment) {
	
  const message = ( comment === undefined) ? module : module + ": " + comment
  console.log(new Date().toISOString() + ": movieTicketing." + message);
}

function dateWithTZOffset(date) {
  var tzo = -date.getTimezoneOffset()
  var dif = tzo >= 0 ? '+' : '-'
  var pad = function(num) {
    var norm = Math.abs(Math.floor(num));
    return (norm < 10 ? '0' : '') + norm;
  };
  
   return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${dif}${pad(tzo / 60)}:${pad(tzo % 60)}`;
}

function generateGUID(){
    return uuidv4();
}

function sendStatus(response, e, status, httpStatusCode) {
    
    if ((e.status) && (e.status === status)) {
        response.status(httpStatusCode);
        response.end();
        return true;
    }
    return false
}   

function writeResponse(response, content, operationId) {

  const moduleId = `writeResponse("${operationId}")`;
  // writeLogEntry(moduleId,)
  
  response.setHeader('X-SODA-LOG-TOKEN',operationId);
  response.json(content);
  response.end();
}

async function theatersService(sessionState, response, next) {

  const moduleId = `theatersService()`
  writeLogEntry(moduleId);
  
  try {
    const httpResponse = await movieAPI.getTheaters(sessionState);
    // writeLogEntry(moduleId,`Items.length = ${httpResponse.json.items.length}`);
	writeResponse(response,httpResponse.json.items,sessionState.operationId);
  } catch (e) {
    if (!sendStatus(httpResponse, e, constants.NOT_FOUND, 404)) {
      next(e);
    }
  };
} 

async function theaterService(sessionState, response, next, key) {

  const moduleId = `theaterService(${key})`;
  writeLogEntry(moduleId);

  try {
    const httpResponse = await movieAPI.getTheater(sessionState, key)
	writeResponse(response,httpResponse.json,sessionState.operationId);
  } catch (e) {
    next(e);
  }
}

async function theaterByIdService(sessionState, response, next, id) {

  const moduleId = `theaterByIdService(${id})`;
  writeLogEntry(moduleId);
  
  try {
    const httpResponse = await movieAPI.getTheaterById(sessionState, id)
	writeResponse(response,httpResponse.json.value,sessionState.operationId);
  } catch (e){
    next(e);
  };
} 


async function searchTheatersService(sessionState, response, next, qbe) {

  const moduleId = `searchTheaterService(${JSON.stringify(qbe)})`;
  writeLogEntry(moduleId);

  try {
    const httpResponse = await movieAPI.queryTheaters(sessionState, qbe, 'unlimited')
	writeResponse(response,httpResponse.json.items,sessionState.operationId);
  } catch (e){
    next(e);
  };
} 


async function locateTheatersService(sessionState, response, next, lat, long, distance) {

  var qbe = {
    "location.geoCoding": {
      "$near"           : {
        "$geometry"    : {
             "type"      : "Point", 
             "coordinates" : [long,lat]
        },
        "$distance" : distance,
        "$unit" : "mile"
      }
    }
  };

  const moduleId = `locateTheatersService(${JSON.stringify(qbe)})`;
  writeLogEntry(moduleId);

  try {
    const httpResponse = await movieAPI.queryTheaters(sessionState, qbe, 'unlimited')
	writeResponse(response,httpResponse.json.value,sessionState.operationId);
  } catch (e){
    next(e);
  };
} 

async function moviesByTheaterService(sessionState, response, next, id, dateStr) {

  const moduleId = `moviesByTheaterService(${id },${dateStr})`;
  writeLogEntry(moduleId);
  
  try {
    const httpResponse = await movieAPI.getTheater(sessionState, id)
    const theater = httpResponse.json;
    delete(theater.screens);    

    const moviesByTheater = await getMoviesByTheaterAndDate(sessionState,theater,dateStr)
	writeResponse(response,moviesByTheater,sessionState.operationId);
  } catch (e){
    next(e);
  };
} 

async function moviesService(sessionState, response, next) {

  const moduleId = `moviesService()`;
  writeLogEntry(moduleId);

  try {
    const httpResponse = await movieAPI.getMovies(sessionState)
	writeResponse(response,httpResponse.json.items,sessionState.operationId);
  } catch (e){
    if (!sendStatus(response, e, constants.NOT_FOUND, 404)) {
      next(e);
    }
  };
} 

async function movieService(sessionState, response, next, key) {

  const moduleId = `movieService(${key})`;
  writeLogEntry(moduleId);

  try {
    const httpResponse = await movieAPI.getMovie(sessionState, key)
	writeResponse(response,httpResponse.json,sessionState.operationId);
  } catch (e) {
    next(e);
  }
}

async function moviesByReleaseDateService(sessionState, response, next) {

  const moduleId = `moviesByReleaseDateService()`;
  writeLogEntry(moduleId);

  try {
    const httpResponse = await movieAPI.moviesByReleaseDateService(sessionState)
    // writeLogEntry(moduleId,"Items.length = " + httpResponse.json.items.length);
    writeResponse(response,httpResponse.json.items,sessionState.operationId);
  } catch (e){
    if (!sendStatus(response, e, constants.NOT_FOUND, 404)) {
      next(e);
    }
  };
}

async function movieByIdService(sessionState, response, next, id) {

  const moduleId = `movieByIdService(${id})`;
  writeLogEntry(moduleId);

  try {
    const httpResponse = await movieAPI.getMovieById(sessionState, id)                                   
	writeResponse(response,httpResponse.json.value,sessionState.operationId);
  } catch (e){
    next(e);
  };
}                                                                                                                                    

async function searchMoviesService(sessionState, response, next, qbe) {

  const moduleId = `searchMoviesService(${JSON.stringify(qbe)})`;
  writeLogEntry(moduleId);
  
  try {
    const httpResponse = await movieAPI.queryMovies(sessionState, qbe, 'unlimited')
	writeResponse(response,httpResponse.json.items,sessionState.operationId);
  } catch (e){
    next(e);
  };
} 

async function theatersByMovieService(sessionState, response, next, id, dateStr) {
  
  const moduleId = `theatersByMovieService(${id },${dateStr})`;
  writeLogEntry(moduleId);
  
  try {
    const httpResponse = await movieAPI.getMovie(sessionState, id)
    var movie = httpResponse.json;
    let theatersByMovie = await getTheatersByMovieAndDate(sessionState,movie,dateStr)
	writeResponse(response,theatersByMovie,sessionState.operationId);
  } catch (e){
    next(e);
  };
} 

async function moviesInTheatersService(sessionState, response, next) {

  const moduleId = `moviesInTheatersService()`;
  writeLogEntry(moduleId);

  try {
    const httpResponse = await movieAPI.queryMovies(sessionState, {inTheaters : true} , 'unlimited')
 	writeResponse(response,httpResponse.json,sessionState.operationId);
  } catch (e){
    next(e);
  };
} 
  
async function bookTicketService(sessionState, response, next, bookingRequest) {

  const moduleId = `bookTicketService(${JSON.stringify(bookingRequest)})`;
  writeLogEntry(moduleId);

  try {
    let bookingStatus = await bookTickets(sessionState, bookingRequest)
	// console.log(bookingStatus);
	writeResponse(response,bookingStatus,sessionState.operationId);
  } catch (err) {
    next(err);
  };
 
}

async function screeningService(sessionState, response, next, key) {

  const moduleId = `screeningService(${key})`;
  // writeLogEntry(moduleId);

  try {
    const httpResponse = await movieAPI.getScreening(sessionState, key)
	writeResponse(response,httpResponse.json,sessionState.operationId);
  } catch (e) {
    next(e);
  }
}

async function applicationStatusService(sessionState, response, next) {
    
  const moduleId = `applicationStatusService()`;
  writeLogEntry(moduleId);
  
  var status = {
        googleKey         : cfg.dataSources.google.apiKey
      , tmdbKey           : cfg.dataSources.tmdb.apiKey
      , supportedFeatures : await movieAPI.getSupportedFeatures()
      , geocodingService  : cfg.dataSources.geocodingService
      , mappingService    : cfg.dataSources.mappingService
      , movieCount        : 0
      , theaterCount      : 0
      , screeningCount    : 0
      , posterCount       : 0 
      , currentPosition   : {
          coords          : {
            latitude      : 0.0
          , longitude     : 0.0
          }
        }
      }

  try {  

    try {
      const httpResponse = await movieAPI.getMovies(constants.DB_LOGGING_DISABLED,0,undefined,true)
	  status.movieCount=httpResponse.json.totalResults;
    } catch (e) {
	  // TODO : This should be caught and handled by the database interface layer !!!
      if (e.status) {
        if (e.status !== constants.NOT_FOUND) {
          if (e.status !== constants.BAD_REQUEST) {
            throw e;
          }
        }
      }
      else {
        if ((e.json) && (e.json['o:errorCode'])) {
          if (e.json['o:errorCode'] !== 'SQL-00942'){
            throw e;
          }
        }
        else {
          throw e;
        }
      }
    }
    
    try {
      const httpResponse = await movieAPI.getTheaters(constants.DB_LOGGING_DISABLED,0,undefined,true)
	  // writeLogEntry(moduleId,"Theaters:\n" + JSON.stringify(httpResponse," ",2))
	  // writeLogEntry(moduleId,"Theater Count:" + httpResponse.json.totalResults)
      status.theaterCount=httpResponse.json.totalResults;
    } catch (e) {
      if (e.status) {
        if (e.status !== constants.NOT_FOUND) {
          if (e.status !== constants.BAD_REQUEST) {
            throw e;
          }
        }
      }
      else {
        if ((e.json) && (e.json['o:errorCode'])) {
          if (e.json['o:errorCode'] !== 'SQL-00942'){
            throw e;
          }
        }
        else {
          throw e;
        }
      }
    }
    
    try {
      const httpResponse = await movieAPI.getScreenings(constants.DB_LOGGING_DISABLED,0,undefined,true)
      status.screeningCount=httpResponse.json.totalResults;
    } catch (e) {
      // console.log(e);
      if (e.status) {
        if (e.status !== constants.NOT_FOUND) {
          if (e.status !== constants.BAD_REQUEST) {
            throw e;
          }
        }
      }
      else {
        if ((e.json) && (e.json['o:errorCode'])) {
          if (e.json['o:errorCode'] !== 'SQL-00942'){
            throw e;
          }
        }
        else {
          throw e;
        }
      }
    }
    
    try {
      const httpResponse = await movieAPI.getPosters(constants.DB_LOGGING_DISABLED,0,undefined,true)
      status.posterCount=httpResponse.json.totalResults;
    } catch (e) {
      // console.log(e);
      if (e.status) {
        if (e.status !== constants.NOT_FOUND) {
          if (e.status !== constants.BAD_REQUEST) {
            throw e;
          }
        }
      }
      else {
        if ((e.json) && (e.json['o:errorCode'])) {
          if (e.json['o:errorCode'] !== 'SQL-00942'){
            throw e;
          }
        }
        else {
          throw e;
        }
      }
    }
      
    if (status.theaterCount > 0) {      
      let centroid = await getTheaterCentroid(constants.DB_LOGGING_DISABLED)
      // writeLogEntry(moduleId','CentroId = ` + JSON.stringify(centroid));
      status.currentPosition = centroid
    }

    response.json(status);
    response.end();
  } catch (e){
	  
    writeLogEntry(moduleId,'Broken Promise.');
	console.log(e)
    next(e);
  };

}      

function updateDataSourcesService(sessionState, response, next, updatedValues) {
    
  const moduleId = `updateDataSourcesService(${JSON.stringify(updatedValues)})`;
  writeLogEntry(moduleId);

  try {
    cfg.updateDataSources(updatedValues);
    response.json({status : "success" })
    response.end();
  } catch (e) {
    next(e);
  }
}
       
async function getTheaterCentroid(sessionState) {
    
  const moduleId = `getTheaterCentroid()`;
  
  try {
    const httpResponse = await movieAPI.getTheaters(sessionState)
        
    var boundsBox = {
        latitude  : [ 360, -360 ],
        longitude : [ 360, -360 ]
    }
    
    for (var i=0; i < httpResponse.json.items.length; i++) {
      if (httpResponse.json.items[i].value.location.geoCoding.coordinates) {

        var latitude = httpResponse.json.items[i].value.location.geoCoding.coordinates[0]
        var longitude = httpResponse.json.items[i].value.location.geoCoding.coordinates[1]
       
        if (latitude < boundsBox.latitude[0]) {
            boundsBox.latitude[0] = latitude;
        }
        if (latitude > boundsBox.latitude[1]) {
          boundsBox.latitude[1] = latitude;
        }
        if (longitude < boundsBox.longitude[0]) {
          boundsBox.longitude[0] = longitude;
        }
        if (longitude > boundsBox.longitude[1]) {
          boundsBox.longitude[1] = longitude;
        }
      }
    }   
    
    var centroid = {
        coords       : {
          latitude   : ((boundsBox.latitude[0] + boundsBox.latitude[1])/2)
      , longitude  : ((boundsBox.longitude[0] + boundsBox.longitude[1])/2)
      }
    }
        
    // writeLogEntry(moduleId,'CentroId = ` + JSON.stringify(centroid));

    return centroid;
  } catch (e) {
    writeLogEntry(moduleId,'Broken Promise');
	throw e;
  };
    
}

async function bookTickets(sessionState, bookingRequest) {

  const moduleId = `bookTickets(${JSON.stringify(bookingRequest)})`;
  // writeLogEntry(moduleId);

  var key           = bookingRequest.key;
  var etag          = null;
  var screening     = {}
  var seatsRequired = bookingRequest.adult + bookingRequest.senior + bookingRequest.child;
  
  try {
    let httpResponse = await movieAPI.getScreening(sessionState, key)
    etag = httpResponse.etag;
    screening = httpResponse.json;

    if (screening.seatsRemaining < seatsRequired) {
      return {
        status : "SoldOut", 
        message : `Only ${screening.seatsRemaining} seats are available for this performance.`
      };
    }
    else {
      screening.seatsRemaining = screening.seatsRemaining - seatsRequired;
      try {
        httpResponse = await movieAPI.updateScreening(sessionState, key, screening, etag)
        switch (httpResponse.status) {
          case constants.SUCCESS: // Seat Reserved : Record Ticket Sale
            var ticketSale = makeTicketSale(bookingRequest, screening);
            try {
              httpResponse = await movieAPI.insertTicketSale(sessionState, ticketSale)
              switch (httpResponse.status) {
                case constants.CREATED: // Booking Completed
                  return { 
                    status  : "Booked",
                    message : "Please enjoy your movie."
                  }
                default:
                  throw httpResponse;
              }
            } catch (err) {
              throw err;     
            }
          default:
            throw httpResponse;
        }
      } catch (err) {
        switch (err.status) {
          case constants.CONFLICTING_UPDATE: // Conflicting Ticket Sales : Try again
            return bookTickets(sessionState,bookingRequest) 
          default:
            throw err;
        }
      }
    }

	} catch (err) {
	console.log(err)
    throw err;     
  }
}

async function processScreeningsByTheaterAndDate(sessionState,httpResponse) {
  
  const moduleId = `processScreeningsByTheaterAndDate(httpResponse.json.items[${httpResponse.json.items.length}])`;
  // writeLogEntry(moduleId);
  
  var movies = [];
  
  function addScreeningDetails(screeningItem) {
    
    var movieId  = screeningItem.value.movieId;
    var screenId = screeningItem.value.screenId;
    
    var  moduleId = `processScreeningsByTheaterAndDate.addScreeningDetails(${movieId},${screenId})`;
    // writeLogEntry(moduleId);
    
    var screeningSummary = {
      id             : screeningItem.id,
      startTime      : screeningItem.value.startTime, 
      seatsRemaining : screeningItem.value.seatsRemaining
    }
    
    for (var j = 0; j < movies.length; j++) {
      if (movies[j].movie.id == movieId) {
        var movie = movies[j]
        for (var k=0; k < movie.screens.length; k++) {
          if (movie.screens[k].id == screenId) {
            movie.screens[k].showTimes.push(screeningSummary);
            return movie;
          }
        }
        movie.screens.push({ 
          id : screenId,
          showTimes : [screeningSummary]
        });
        return movie;
      }
    }

    var movie = {
      movie : {
          id    : movieId
        },
        screens : [{
          id : screenId,
          showTimes : [screeningSummary]
        }]
    }
    movies.push(movie);
    return movie;
  }  
  
  function getMovieIdList(movie) {
    return movie.movie.id;
  }
  
  function getMovieDetails(movieIdList) {
    var qbe = { id : { '$in' : movieIdList }};
    return movieAPI.queryMovies(sessionState, qbe)
  }

  function processMovie(movieItem) {
     var movie = movieItem.value;
     for (var i = 0; i < movies.length; i++) {
       if (movies[i].movie.id == movie.id) {
         movies[i].movie = movie;
         return;
       }
     }
  }

  // Transform the screenings into an array of Movies with the Screening information for each movie attached.
  
 
  httpResponse.json.items.map(addScreeningDetails);

  if (movies.length > 0) {
  
    try {
      const httpResponse = await getMovieDetails(movies.map(getMovieIdList))
      httpResponse.json.items.map(processMovie);
      return movies
    } catch (e){
      writeLogEntry(moduleId, 'Broken Promise');
      throw e
    }
  }
  else {
    return movies   
  }
}  

async function getMoviesByTheaterAndDate(sessionState,theater, date) {

  const moduleId = `getMoviesByTheaterAndDate(${theater.id},${date})`;
  writeLogEntry(moduleId);
  
  var moviesByTheater = { 
    'theater' : theater,
    'movies' : []
  };
  
  var startDate = new Date(Date.parse(date))
  startDate.setHours(0);
  startDate.setMinutes(0);
  startDate.setSeconds(0);
  startDate.setMilliseconds(0);
  
  var endDate = new Date(Date.parse(date));
  endDate.setHours(0)
  endDate.setMinutes(0)
  endDate.setSeconds(0)
  endDate.setMilliseconds(0);
  endDate.setDate(endDate.getDate() + 1);
  
  var qbe = { theaterId : theater.id, startTime : { "$gte" : startDate, "$lt" : endDate }, "$orderby" : { screenId : 1, startTime : 1}};
  
  const httpResponse = await  movieAPI.queryScreenings(sessionState, qbe, 'unlimited')
  let movies = await processScreeningsByTheaterAndDate(sessionState,httpResponse)
  moviesByTheater.movies = movies;
  return moviesByTheater;

}
  
async function processScreeningsByMovieAndDate(sessionState,httpResponse) {
  
  const moduleId = `processScreeningsByMovieAndDate(httpResponse.json.items[${httpResponse.json.items.length}])`;
  // writeLogEntry(moduleId);
  
  var theaters = [];

  function addScreeningDetails(screeningItem) {
  
    var theaterId = screeningItem.value.theaterId;
    var screenId  = screeningItem.value.screenId;

    var  moduleId = `processScreeningsByMovieAndDate.addScreeningDetails(${theaterId},${screenId})`;
    // writeLogEntry(moduleId);
          
    var screeningSummary = {
      id             : screeningItem.id,
      startTime      : screeningItem.value.startTime, 
      seatsRemaining : screeningItem.value.seatsRemaining
    }

    for (var j = 0; j < theaters.length; j++) {
      if (theaters[j].theater.id == theaterId) {
        var theater = theaters[j]
        for (var k=0; k < theater.screens.length; k++) {
          if (theater.screens[k].id == screenId) {
            theater.screens[k].showTimes.push(screeningSummary);
            return theater;
          }
        }
        theater.screens.push({ 
          id : screenId,
          showTimes : [screeningSummary]
        });
        return theater
      }
    }  
    
    var theater = {
      theater : {
          id    : theaterId
        },
        screens : [{
          id : screenId,
          showTimes : [screeningSummary]
        }]
    }
    theaters.push(theater);     
    return theater;
  }  
  
  function getTheaterIdList(theater) {
    return theater.theater.id;
  }
  
  function getTheaterDetails(theaterIdList) {
    var qbe = { id : { '$in' : theaterIdList }};
    return movieAPI.queryTheaters(sessionState, qbe)
  }

  function processTheater(theaterItem) {
     var theater = theaterItem.value;
     delete(theater.screens);
     for (var i = 0; i < theaters.length; i++) {
       if (theaters[i].theater.id == theater.id) {
         theaters[i].theater = theater;
         return;
       }
     }
  }

  // Transform the screenings into an array of Theaters with the Screening information for each theater attached.
  
  httpResponse.json.items.map(addScreeningDetails);
  
  if (theaters.length > 0) {
    try {
      const httpResponse = await getTheaterDetails(theaters.map(getTheaterIdList))
      httpResponse.json.items.map(processTheater);
      return theaters
    } catch (e){
      writeLogEntry(moduleId, 'Broken Promise');
      throw e
    }
  }
  else {
    return theaters;
  }
  
}
  
async function getTheatersByMovieAndDate(sessionState,movie, date) {

  const moduleId = `getTheatersByMovieAndDate(${movie.id},${date})`;
  // writeLogEntry(moduleId);

  var theatersByMovie = { 
    'movie' : movie,
    'theaters' : []
  };


  var startDate = new Date(Date.parse(date))
  startDate.setHours(0);
  startDate.setMinutes(0);
  startDate.setSeconds(0);
  startDate.setMilliseconds(0);
  
  var endDate = new Date(Date.parse(date));
  endDate.setHours(0)
  endDate.setMinutes(0)
  endDate.setSeconds(0)
  endDate.setMilliseconds(0);
  endDate.setDate(endDate.getDate() + 1);

  var qbe = { movieId : movie.id, startTime : { "$gte" : startDate, "$lt" : endDate } , "$orderby" : { screenId : 1, startTime : 1}};
  // var qbe = { movieId : movie.id, startTime : { "$gte" : startDate, "$lt" : endDate }}

  const httpResponse = await movieAPI.queryScreenings(sessionState, qbe, 'unlimited')
  let theaters = await processScreeningsByMovieAndDate(sessionState,httpResponse)
  theatersByMovie.theaters = theaters;
  return theatersByMovie;

}

function makeTicketSale(bookingRequest, screening) {

  delete(bookingRequest.key);
  bookingRequest.adultPrice   = screening.ticketPricing.adultPrice;
  bookingRequest.seniorPrice  = screening.ticketPricing.seniorPrice;
  bookingRequest.childPrice   = screening.ticketPricing.childPrice;
  bookingRequest.startTime    = screening.startTime;
  bookingRequest.theaterId    = screening.theaterId;
  bookingRequest.screenId     = screening.screenId;
  bookingRequest.movieId      = screening.movieId;
  var purchaseDate = new Date();
  bookingRequest.purchaseDate = dateWithTZOffset(purchaseDate);
  return bookingRequest;

}

async function posterService(sessionState, response, next, key) {

  const moduleId = `posterService(${key})`;
  // writeLogEntry(moduleId);
  
  try {
    const httpResponse = await movieAPI.getPoster(constants.DB_LOGGING_DISABLED, key)
    writeLogEntry(moduleId,`ContentType: ${httpResponse.contentType}. Poster length ${Buffer.byteLength(httpResponse.body)} bytes.`);
    response.setHeader('content-type',httpResponse.contentType);
    // response.setHeader('content-length', Buffer.byteLength(httpResponse.body));
    // writeLogEntry(moduleId,'Image Size = ${Buffer.byteLength(httpResponse.body));
    // response.end(httpResponse.body,'binary');
    response.write(httpResponse.body);
    response.end();
  } catch (e) {
    next(e);
  }
}

function setSessionState(cookies,sessionState) {

  if (!sessionState.sessionId) {
    sessionState.sessionId = cookies.movieTicketGUID;
    sessionState.operationId = cookies.operationId;
    sessionState.dbLoggingEnabled = true;
    sessionState.logCollectionName = null;
  }

  sessionState.operationId = generateGUID();
  sessionState.save();

}

async function initialize(sessionState) {

  await movieAPI.initialize(sessionState);
  return 
}

async function logRecordsByOperationService(sessionState, response, next, operationId) {

  const moduleId = `logRecordsByOperationService("${sessionState.sessionId}","${operationId})`;
  // writeLogEntry(moduleId);
                                 
  try {
    const httpResponse = await movieAPI.getLogRecordByOperationId(sessionState.sessionId, operationId)
    // writeLogEntry(moduleId,JSON.stringify(httpResponse.json))
    response.json(httpResponse.json.items);                                      
    response.end();                                            
  } catch (e){
    next(e);
  };
}                                                                                                                                    