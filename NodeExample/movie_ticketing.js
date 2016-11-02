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
var movieAPI = require('./movie_ticket_api.js');
var cfg = require('./config.js');

module.exports.theatersService               = theatersService;
module.exports.theaterByIdService            = theaterByIdService;
module.exports.searchTheatersService         = searchTheatersService;
module.exports.moviesByTheaterService        = moviesByTheaterService;
module.exports.locateTheatersService         = locateTheatersService;
module.exports.moviesService                 = moviesService;
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
                                             
module.exports.initializeSodaLogging         = initializeSodaLogging;
module.exports.setSessionState               = setSessionState;

function writeLogEntry(module,message) {
	module = ( message === undefined) ? module : module + ": " + message
  console.log(new Date().toISOString() + ": movieTicketing." + module);
}

function dateWithTZOffset(date) {
  var tzo = -date.getTimezoneOffset()
  var dif = tzo >= 0 ? '+' : '-'
  var pad = function(num) {
    var norm = Math.abs(Math.floor(num));
    return (norm < 10 ? '0' : '') + norm;
  };
  
  return date.getFullYear() 
       + '-' + pad(date.getMonth()+1)
       + '-' + pad(date.getDate())
       + 'T' + pad(date.getHours())
       + ':' + pad(date.getMinutes()) 
       + ':' + pad(date.getSeconds()) 
       + dif + pad(tzo / 60) 
       + ':' + pad(tzo % 60);
}

function generateGUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

var sodaLoggingDisabled = { sodaLoggingEnabled : false };

function reportStatusCode(response, e, statusCode) {
	
  	if ((e.statusCode) && (e.statusCode === statusCode)) {
  		response.status(e.statusCode);
  		response.end();
  		return true;
  	}
  	return false
}	

function theatersService(sessionState, response, next) {

  var moduleId = 'theatersService()'
  writeLogEntry(moduleId);

  movieAPI.getTheaters(sessionState).then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json.items);
    response.end();
  }).catch(function(e){
  	if (!reportStatusCode(response, e, 404)) {
      next(e);
    }
  });
} 

function theaterByIdService(sessionState, response, next, id) {

  var moduleId = 'theaterByIdService('+ id + ')';
  writeLogEntry(moduleId);
  
  movieAPI.getTheaterById(sessionState, id).then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json.value);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 


function searchTheatersService(sessionState, response, next, qbe) {

  var moduleId = 'searchTheaterService(' + JSON.stringify(qbe) + ')';
  writeLogEntry(moduleId);

  movieAPI.queryTheaters(sessionState, qbe, 'unlimited').then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json.items);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 


function locateTheatersService(sessionState, response, next, lat, long, distance) {

  var qbe = {
    "location.geoCoding": {
      "$near"           : {
        "$geometry"    : {
        	 "type"      : "Point", 
        	 "coordinates" : [lat,long]
        },
        "$distance" : distance,
        "$unit" : "mile"
      }
    }
  };

  var moduleId = 'locateTheatersService(' + JSON.stringify(qbe) + ')';
  writeLogEntry(moduleId);

  movieAPI.queryTheaters(sessionState, qbe, 'unlimited').then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json.items);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 

function moviesByTheaterService(sessionState, response, next, id, dateStr) {

  var moduleId = 'moviesByTheaterService(' + id  + ',' + dateStr + ')';
  writeLogEntry(moduleId);

  movieAPI.getTheater(sessionState, id).then(function (sodaResponse) {
    var theater = sodaResponse.json;
    delete(theater.screens);
    return getMoviesByTheaterAndDate(sessionState,theater,dateStr)
  }).then(function (moviesByTheater) {
    // writeLogEntry(moduleId,JSON.stringify(moviesByTheater))     
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(moviesByTheater);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 

function moviesService(sessionState, response, next) {

  var moduleId = 'moviesService()';
  writeLogEntry(moduleId);

  movieAPI.getMovies(sessionState).then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json((sodaResponse.json.items));
    response.end();
  }).catch(function(e){
  	if (!reportStatusCode(response, e, 404)) {
      next(e);
    }
  });
} 

function moviesByReleaseDateService(sessionState, response, next) {

  var moduleId = 'moviesByReleaseDateService()';
  writeLogEntry(moduleId);

  movieAPI.moviesByReleaseDateService(sessionState).then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json((sodaResponse.json.items));
    response.end();
  }).catch(function(e){
  	if (!reportStatusCode(response, e, 404)) {
      next(e);
    }
  });
}

function movieByIdService(sessionState, response, next, id) {

  var moduleId = 'movieByIdService(' + id + ')';
  writeLogEntry(moduleId);

  movieAPI.getMovieById(sessionState, id).then(function (sodaResponse) {                                           
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json.items[0].value);                                      
    response.end();                                            
  }).catch(function(e){
    next(e);
  });
}                                                                                                                                    

function searchMoviesService(sessionState, response, next, qbe) {

  var moduleId = 'searchMoviesService(' + JSON.stringify(qbe) + ')';
  writeLogEntry(moduleId);
  
  movieAPI.queryMovies(sessionState, qbe, 'unlimited').then(function (sodaResponse) {
    // writeLogEntry(moduleId,JSON.stringify(sodaResponse));
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json.items);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 

function theatersByMovieService(sessionState, response, next, id, dateStr) {
  
  var moduleId = 'theatersByMovieService(' + id  + ',' + dateStr + ')';
  writeLogEntry(moduleId);
  
  movieAPI.getMovie(sessionState, id).then(function (sodaResponse) {
    var movie = sodaResponse.json;
    return getTheatersByMovieAndDate(sessionState,movie,dateStr)
  }).then(function (theatersByMovie) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(theatersByMovie);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 

function moviesInTheatersService(sessionState, response, next) {

  var moduleId = 'moviesInTheatersService()';
  writeLogEntry(moduleId);

  movieAPI.getMovies(sessionState).then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json((sodaResponse.json));
    response.end();
  }).catch(function(e){
    next(e);
  });
} 
  
function bookTicketService(sessionState, response, next, bookingRequest) {

  var moduleId = 'bookTicketService(' + JSON.stringify(bookingRequest) +')';
  writeLogEntry(moduleId);

  bookTickets(sessionState, bookingRequest).then(function (bookingStatus) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(bookingStatus);
    response.end();
  }).catch(function(err) {
    next(err);
  });
 
}

function screeningService(sessionState, response, next, key) {

  var moduleId = 'screeningService(' + key + ')';
  writeLogEntry(moduleId);

  movieAPI.getScreening(sessionState, key).then(function(sodaResponse) {
    //  writeLogEntry(moduleId,JSON.stringify(sodaResponse));
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json);
    response.end();
  }).catch(function(e) {
    next(e);
  })
}

function applicationStatusService(sessionState,response,next) {
	
  var moduleId = 'applicationStatusService()';
  writeLogEntry(moduleId);
  
	var status = {
		googleKey         : cfg.dataSources.google.apiKey
	, tmdbKey           : cfg.dataSources.tmdb.apiKey
	, supportedFeatures : movieAPI.getDetectedFeatures()
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
		
	return movieAPI.getMovies(sodaLoggingDisabled,1,undefined,true).then(function(sodaResponse){
	   status.movieCount=sodaResponse.json.totalResults;
	}).catch(function(e) {
		 if (e.details.statusCode !== 404) {
		 	 if (e.details.statusCode !== 400) {
		 	 	 throw e;
		 	 }
		 	 else {
		 	 	 if (e.json['o:errorCode'] !== 'SQL-00942') {
		 	 	 	 throw e;
		 	 	 }
		   }
		 }
  }).then(function() {		 	 
	   return movieAPI.getTheaters(sodaLoggingDisabled,1,undefined,true)
	}).then(function(sodaResponse){
	   status.theaterCount=sodaResponse.json.totalResults;
	}).catch(function(e) {
		 if (e.details.statusCode !== 404) {
		 	 if (e.details.statusCode !== 400) {
		 	 	 throw e;
		 	 }
		 	 else {
		 	 	 if (e.json['o:errorCode'] !== 'SQL-00942') {
		 	 	 	 throw e;
		 	 	 }
		   }
		 }
  }).then(function() {		 	 
	   return movieAPI.getScreenings(sodaLoggingDisabled,1,undefined,true)
	}).then(function(sodaResponse){
	   status.screeningCount=sodaResponse.json.totalResults;
	}).catch(function(e) {
		 if (e.details.statusCode !== 404) {
		 	 if (e.details.statusCode !== 400) {
		 	 	 throw e;
		 	 }
		 	 else {
		 	 	 if (e.json['o:errorCode'] !== 'SQL-00942') {
		 	 	 	 throw e;
		 	 	 }
		   }
		 }
  }).then(function() {		 	 
	   return movieAPI.getPosters(sodaLoggingDisabled,1,undefined,true)
	}).then(function(sodaResponse){
	   status.posterCount=sodaResponse.json.totalResults;
	}).catch(function(e) {
		 if (e.details.statusCode !== 404) {
		 	 if (e.details.statusCode !== 400) {
		 	 	 throw e;
		 	 }
		 	 else {
		 	 	 if (e.json['o:errorCode'] === 'SQL-00942') {
		 	 	 	 throw e;
		 	 	 }
		   }
		 }
  }).then(function() { 
  	 if (status.theaterCount > 0) {
	   	 return getTheaterCentroid(sodaLoggingDisabled).then(function(centroid){
		     // writeLogEntry(moduleId','Centroid = ' + JSON.stringify(centroid));
	  		 status.currentPosition = centroid
       })
	   }
	   else {
	   	  return Promise.resolve()
	   }
  }).then(function() {		 	 
	   response.json(status);
	   response.end();
  }).catch(function(e){
  	writeLogEntry('movieTicketing.applicationStatusService(): Broken Promise.');
    next(e);
  });

}	   

function updateDataSourcesService(sessionState, response, next, updatedValues) {
	
  var moduleId = 'applicationStatusService(' + JSON.stringify(updatedValues) + ')';
  writeLogEntry(moduleId);

	try {
		cfg.updateDataSources(updatedValues);
	  response.json({status : "success" })
	  response.end();
	}
	catch (e) {
		next(e);
	}
}
	   
function getTheaterCentroid(sessionState) {
	
	var moduleId = 'getTheaterCentroid()';
	
  return movieAPI.getTheaters(sessionState).then(function (sodaResponse) {
  	var boundsBox = {
  		latitude  : [ 360, -360 ],
  		longitude : [ 360, -360 ]
  	}
  	
  	for (var i=0; i < sodaResponse.json.items.length; i++) {
  	  if (sodaResponse.json.items[i].value.location.geoCoding.coordinates) {
  	  	var latitude = sodaResponse.json.items[i].value.location.geoCoding.coordinates[0]
  	  	var longitude = sodaResponse.json.items[i].value.location.geoCoding.coordinates[1]
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
  	  	
    // writeLogEntry(moduleId,'Centroid = ' + JSON.stringify(centroid));

  	return centroid;
  
  });
  	
}

function bookTickets(sessionState, bookingRequest) {

  var key           = bookingRequest.key;
  var eTag          = null;
  var screening     = {}
  var seatsRequired = bookingRequest.adult + bookingRequest.senior + bookingRequest.child;
  
  return movieAPI.getScreening(sessionState, key).then(function(sodaResponse) {
  	eTag = sodaResponse.eTag;
  	screening = sodaResponse.json;
	  if (screening.seatsRemaining < seatsRequired) {
    	return {
    	  status : 'SoldOut', 
    	  message : 'Only ' + screening.seatsRemaining + ' seats are available for this performance.'
      };
    }
    else {
    screening.seatsRemaining = screening.seatsRemaining - seatsRequired;
      return movieAPI.updateScreening(sessionState, key, screening, eTag).then(function(sodaResponse) {
        switch (sodaResponse.statusCode) {
          case 200: // Seat Reserved : Record Ticket Sale
            var ticketSale = makeTicketSale(bookingRequest, screening);
            return movieAPI.insertTicketSale(sessionState, ticketSale).then(function(sodaResponse) {
              switch (sodaResponse.statusCode) {
                case 201: // Booking Completed
                  return { 
                    status  : "Booked",
                    message : "Please enjoy your movie."
                  }
                default:
                	throw sodaResponse;
              }
            }).catch(function (err) {
            	throw err;     
            })
          default:
            throw sodaResponse;
        }
      }).catch(function (err) {
        switch (err.statusCode) {
          case 412: // Conflicting Ticket Sales : Try again
            return bookTickets(sessionState,bookingRequest) 
          default:
            throw err;
        }
      })
    }
  }).catch(function (err) {
   	throw err;     
  })
}

function processScreeningsByTheaterAndDate(sessionState,sodaResponse) {
  
  var moduleId = 'processScreeningsByTheaterAndDate(sodaResponse.json.items[' + sodaResponse.json.items.length + '])';
  // writeLogEntry(moduleId);
  
  var movies = [];
  
  function addScreeningDetails(screeningItem) {
    
    var movieId  = screeningItem.value.movieId;
    var screenId = screeningItem.value.screenId;
    
    var  moduleId = 'processScreeningsByTheaterAndDate.addScreeningDetails(' + movieId + ',' + screenId + ')';
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
  
 
  sodaResponse.json.items.map(addScreeningDetails);

  if (movies.length > 0) {
    return getMovieDetails(movies.map(getMovieIdList)).then(function(sodaResponse) {
      sodaResponse.json.items.map(processMovie);
      return movies
    }).catch(function(e){
      writeLogEntry(moduleId, 'Broken Promise');
      throw e
    })
  }
  else {
    return movies  	
  }
}  

function getMoviesByTheaterAndDate(sessionState,theater, date) {

  var moduleId = 'getMoviesByTheaterAndDate(' + theater.id + ',' + date + ')';
  // writeLogEntry(moduleId);
  
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
  
  var qbe = { theaterId : theater.id, startTime : { "$gte" : startDate, "$lt" : endDate }, "$orderby" : { screenId : 1, startTime : 2}};

  return movieAPI.queryScreenings(sessionState, qbe, 'unlimited').then(function(sodaResponse) {
    return processScreeningsByTheaterAndDate(sessionState,sodaResponse)
  }).then(function(movies) {
    moviesByTheater.movies = movies;
    return moviesByTheater;
  })
}
  
function processScreeningsByMovieAndDate(sessionState,sodaResponse) {
  
  var moduleId = 'processScreeningsByMovieAndDate(sodaResponse.json.items[' + sodaResponse.json.items.length + '])';
  // writeLogEntry(moduleId);
  
  var theaters = [];

  function addScreeningDetails(screeningItem) {
  
    var theaterId = screeningItem.value.theaterId;
    var screenId  = screeningItem.value.screenId;

    var  moduleId = 'processScreeningsByMovieAndDate.addScreeningDetails(' + theaterId + ',' + screenId + ')';
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
  
  sodaResponse.json.items.map(addScreeningDetails);
  
  if (theaters.length > 0) {
    return getTheaterDetails(theaters.map(getTheaterIdList)).then(function(sodaResponse) {
      sodaResponse.json.items.map(processTheater);
      return theaters
    }).catch(function(e){
	    writeLogEntry(moduleId, 'Broken Promise');
      throw e
    })
  }
  else {
  	return theaters;
  }
  
}
  
function getTheatersByMovieAndDate(sessionState,movie, date) {

  var moduleId = 'getTheatersByMovieAndDate(' + movie.id + ',' + date + ')';
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

  var qbe = { movieId : movie.id, startTime : { "$gte" : startDate, "$lt" : endDate } , "$orderby" : { screenId : 1, startTime : 2}};

  return movieAPI.queryScreenings(sessionState, qbe, 'unlimited').then(function(sodaResponse) {
    return processScreeningsByMovieAndDate(sessionState,sodaResponse)
  }).then(function(theaters) {
    theatersByMovie.theaters = theaters;
    return theatersByMovie;
  })
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

function posterService(sessionState, response, next, key) {

  var moduleId = 'posterService(' + key + ')';
  // writeLogEntry(moduleId);
  
  var sessionState = sodaLoggingDisabled;
  
  movieAPI.getPoster(sessionState, key).then(function(sodaResponse) {
    response.setHeader('content-type',sodaResponse.contentType);
    // response.setHeader('content-length', Buffer.byteLength(sodaResponse.body));
    // writeLogEntry(moduleId,'Image Size = ' + Buffer.byteLength(sodaResponse.body));
    // response.end(sodaResponse.body,'binary');
    response.write(sodaResponse.body);
    response.end();
  }).catch(function(e) {
    next(e);
  })
}

function setSessionState(cookies,sessionState) {

  if (!sessionState.sodaSessionId) {
    sessionState.sodaSessionId = cookies.movieTicketGUID;
    sessionState.operationId = cookies.operationId;
    sessionState.sodaLoggingEnabled = true;
    sessionState.logCollectionName = null;
  }

  sessionState.operationId = generateGUID();
  sessionState.save();

}

function initializeSodaLogging(sessionState) {
  return movieAPI.initializeSodaLogging(sessionState);
}

function logRecordsByOperationService(sessionState, response, next, id) {

  var moduleId = 'logRecordsByOperationService(' + id + ')';
  // writeLogEntry(moduleId);
                                 
  movieAPI.getLogRecordByOperationId(id).then(function (sodaResponse) { 
    // writeLogEntry(moduleId,JSON.stringify(sodaResponse.json))
    response.json(sodaResponse.json.items);                                      
    response.end();                                            
  }).catch(function(e){
    next(e);
  });
}                                                                                                                                    

