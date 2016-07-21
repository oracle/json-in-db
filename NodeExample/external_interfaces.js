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
var url = require('url');
var cfg = require('./config.js');
var xmlParser = require('xml2js').Parser();
var movieAPI = require('./movie_ticket_api.js');
var usAddressParser = require('parse-address');

module.exports.ExternalError   = ExternalError;
module.exports.loadTheaters    = loadTheaters;
module.exports.loadMovies      = loadMovies;
module.exports.loadScreenings  = loadScreenings;
module.exports.loadPosters     = loadPosters;

function writeLogEntry(module,message) {
	module = ( message === undefined) ? module : module + ": " + message
  console.log(new Date().toISOString() + ": externalInterfaces." + module);
}

function ExternalError(details) {
  this.name    = 'ExternalError';
  this.message = 'Unexpected error while accessing external data source:';
  this.stack   = details.cause.stack;
  this.details = details
}

ExternalError.prototype = Object.create(Error.prototype);
ExternalError.prototype.constructor = ExternalError;

// var engagementStartDate = new Date(cfg.dataSources.engagementStartDate)
// var engagementEndDate = new Date(cfg.dataSources.engagementEndDate)

var disableSodaLogging = { sodaLoggingEnabled : false };
var sodaLoggingState    = disableSodaLogging;

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

function getRandomBetweenValues(low,high) {
  return Math.floor(Math.random() * (high-low) + low);
}	

function loadTheaters (sessionState, response, next) {

  /* Disable Soda Logging */
  
  var sessionState = sodaLoggingState;

  var theaterList = [];
  
  writeLogEntry('loadTheaters()');
  getTheaterInformation().then(function(theaters) {
  	theaterList = theaters;
    return movieAPI.recreateTheaterCollection(sessionState)
  }).then(function() {
    return movieAPI.insertTheaters(sessionState, theaterList);
  }).then(function(sodaResponse) {
    response.json({count:sodaResponse.json.length})
    response.end('')
  }).catch(function(e) {
  	movieAPI.logError(e,theaterList);
    next(e)
  });
} 

function loadMovies(sessionState, response, next) {

  /* Disable Soda Logging */
  
  var sessionState = sodaLoggingState;

  writeLogEntry('loadMovies()');
  getMoviesFromTMDB(sessionState,response).catch(function(e) {
    next(e)
  });

} 

function loadScreenings (sessionState, response, next) {

  /* Disable Soda Logging */
  
  var sessionState = sodaLoggingState;

  writeLogEntry('loadScreenings()');
  createScreenings(sessionState).then(function(total) {
    response.json({count:total})
    response.end('')
  }).catch(function(e) {
    next(e)
  });
} 
  
function loadPosters(sessionState, response, next) {

  /* Disable Soda Logging */
  
  var sessionState = sodaLoggingState;

  writeLogEntry('loadMovies()');
  getPostersFromTMDB(sessionState,response).catch(function(e) {
    next(e)
  });

}

function getGeoJSON(address, geocodeResult, benchmark) {
   
  var moduleId = 'getGeoJSON("' + address + '")';
   
  if (geocodeResult.addressMatches.length === 0) {
  	if (benchmark === 'Public_AR_Census2010') {
  	  return geocodeAddress(address,'Public_AR_ACS2015',0) 
    }
    else {
  	  writeLogEntry(moduleId,'Unable to obtain co-ordinates.');
  	  return {}
    }
  }
  else {
    var coordinates = geocodeResult.addressMatches[0].coordinates;
    var geoCoding = {
      type        : "Point",
      coordinates : [coordinates.x , coordinates.y]                                                                      
    }
    return geoCoding;  
  }
}

function geocodeAddress(address,benchmark,count) {

   var moduleId = 'geocodeAddress("' + address + '",' + benchmark + ')';

   return new Promise(
     
     function(resolve, reject) {

      var readResponse = function(response) {
      
        var responseText = '';
        
        response.on(
          'data' ,
           function(chunk) {
            responseText = responseText + chunk;
          }
        )
        
        response.on(
          'end', 
          function () {
            if (response.statusCode == 200) {
              var geoCoding = getGeoJSON(address,JSON.parse(responseText).result,benchmark);
              resolve(geoCoding)
            }
            else {
              if ((response.statusCode == 500) && (count < 10)) {
                return(geocodeAddress(address,benchmark,count+1)).then(function(geoCoding) {
                  resolve(geoCoding);
                }).catch(function (e) {
                	reject(e);
                })
              }
              else {
                writeLogEntry(moduleId + '.readResponse()','Geocoding Failed (' + response.statusCode + ').');
                var details = { 
                  module         : moduleId + '.readResponse(end)',
                  statusCode     : response.statusCode,
                  statusText     : http.STATUS_CODES[response.statusCode],
                  requestOptions : options,
                  bytesRecieved  : responseText.length,
                  responeText    : responseText,
                  cause          : new Error()
                }
                reject(new ExternalError(details));
              }
            }
          }
        );
      }
    
      // writeLogEntry(moduleId);

      var path = cfg.dataSources.usCensus.path 
               + '?' + 'format=' + 'json' 
               + '&' + 'benchmark=' + benchmark 
               + '&' + 'address=' + encodeURIComponent(address);

      var options = {} 
      
      if (cfg.dataSources.useProxy) {
        path = cfg.dataSources.usCensus.protocol + '://' + cfg.dataSources.usCensus.hostname + ':' + cfg.dataSources.usCensus.port + path;
        options = {
          hostname : cfg.dataSources.proxy.hostname,
          port     : cfg.dataSources.proxy.port,
          method   : 'GET',
          path     : path,
          headers : {'Content-Type': 'application/json'}
        }
      }
      else {
	      options = {
          hostname : cfg.dataSources.usCensus.hostname,
          port : cfg.dataSources.usCensus.port,
          method : 'GET',
          path : path,
          headers : {'Content-Type': 'application/json'}
        };    
      }
           
      var request = http.request(options, readResponse);

       request.on(
        'error', 
        (e) => {
          var details = { 
            module         : 'geocodeTheater(' + theater.id +',' + theater.name + ',' + benchmark + ').request(error)',
            requestOptions : options,
            cause          : e
          }
          reject(new ExternalError(details));
        }
      );
      request.end();
    }
  )
}
   
function geocodeTheater(theater) {
	
	var moduleId = 'geocodeTheater(' + theater.id + ',' + theater.name + ')'
	
	var address = theater.location.street + " " + theater.location.city + " " + theater.location.state + " " + theater.location.zipCode;
	// writeLogEntry(moduleId,'Address = "' + address + '".');
  return geocodeAddress(address,'Public_AR_Census2010',0).then(function(geoCoding){
  	theater.location.geoCoding = geoCoding
  	return theater;
  }).catch(function(e) {
  	writeLogEntry(moduleId,'Unable to get location for = "' + address + '".');
  	theater.location.geoCoding = {}
  	return theater;
  });

}
    
function parseAddress(address) {
	
	var location = address;
  
  var parsedAddress = usAddressParser.parseLocation(address);

  var street    

  if (parsedAddress.number) {
	  street = parsedAddress.number;
  	if (parsedAddress.prefix) {
	   street = street + ' ' + parsedAddress.prefix;
	  }
	  street = street + ' ' + parsedAddress.street;
	  if (parsedAddress.type) {
	    street = street + ' ' + parsedAddress.type;
    }
  }
  else {
    if (parsedAddress.street1) {
      street = parsedAddress.street1;
	    if (parsedAddress.type1) {
		    street = street + ' ' + parsedAddress.type1;
      }
    }
  }
   
  if (street !== undefined) {
      			
    location = {
     	street      : street,
  	  city        : parsedAddress.city,
  	  zipCode     : parsedAddress.zip,
  	  state       : parsedAddress.state,
  	  phoneNumber : null,
	    geoCoding   : {}
	  }
  }
  
  return location;

}  

function generateTheater(item, index) {

  var moduleId = 'generateTheater(' + index + ')';

  return new Promise(
  
    function(resolve, reject) {
      
      // writeLogEntry(moduleId);
      
      var name = item.title[0]
      var screenCount = name.match(/\d+$/);
      
      if (screenCount == null) {
        screenCount = getRandomBetweenValues(8,17)
       }
       var screens = []
       for (var i=0; i < screenCount; i++) {
        var screen = {
          id            : i+1,
          capacity      : getRandomBetweenValues(64,129),
            features      : {
             threeD         : false,
             reserveSeats   : false
            },
            ticketPricing : {
              adultPrice    : 14.95,
              childPrice    : 9.95,
              seniorPrice   : 9.95
            }
        }
        screens.push(screen);
      }
      
      var location = parseAddress(item.description[0].substring(3,item.description[0].indexOf('</p>')));

      var theater = {
        id       : index +1,
        name     : name,
        location : location,
        screens  : screens,
      }                         

      resolve(theater)
    }
  )
}

function getTheatersFromFandango() {
  
  var moduleId = 'getTheatersFromFandango()';
  
  return new Promise(
  
    function(resolve, reject) {

      var readResponse = function(response) {
      
      var responseText = '';
        
      response.on(
        'data' ,
         function(chunk) {
            responseText = responseText + chunk;
          }
        )
        
        response.on(
          'end', 
          function () {
            if (response.statusCode == 200) { 
              resolve(responseText)
            }
            else {
              var details = { 
                module : 'getTheatersFromFandango().readResponse(end)',
                statusCode     : response.statusCode,
                statusText     : http.STATUS_CODES[response.statusCode],
                requestOptions : options,
                bytesRecieved  : responseText.length,
                responeText    : responseText,
                cause          : new Error()
              }
              reject(new ExternalError(details));
            }
          }
        );
      }
  
      writeLogEntry(moduleId);

      var path = cfg.dataSources.fandango.path + cfg.dataSources.fandango.searchCriteria.zipCode + '.rss';

      var options = {} 
      
      if (cfg.dataSources.useProxy) {
      	 path = cfg.dataSources.fandango.protocol + '://' + cfg.dataSources.fandango.hostname + ':' + cfg.dataSources.fandango.port + path;
         options = {
       	   hostname : cfg.dataSources.proxy.hostname,
	         port     : cfg.dataSources.proxy.port,
	         method   : 'GET',
	         path     : path,
	         headers : {'Content-Type': 'application/json'}
	       }
      }
      else {
        var options = {
          hostname : cfg.dataSources.fandango.hostname,
          port : cfg.dataSources.fandango.port,
          method : 'GET',
          path : path,
          headers : {'Content-Type': 'application/rss+xml'}
        }
      };    
            
      var request = http.request(options, readResponse);

      request.on(
        'error', 
        (e) => {
          var details = { 
            module         : moduleId + '.request(error)',
            requestOptions : options,
            cause          : e
          }
          reject(new ExternalError(details));
        }
      );
      request.end();
    }
  )   
}

function getTheaterInformation() {
  
  
  // Generate a set of Theater documents from the Fandango TheatersNearMe RSS feed and geocode the results.
  
  return getTheatersFromFandango().then(function(rssFeed) {
    // writeLogEntry('getTheaterInformation()','Count=' + theaters.length);         
    var theaters = []
    xmlParser.parseString(
      rssFeed,
      function(err,jsonRSS) {
        theaters = jsonRSS.rss.channel[0].item
      }         
    );
    return Promise.all(theaters.map(generateTheater))     
  }).then(function(theaters) {
    return Promise.all(theaters.map(geocodeTheater)) 
  })
}


function waitAndRun(items,callback,controllerModuleName,workerModuleName,batchNo,batchSize,response) {
	
	var moduleId = "waitAndRun." + controllerModuleName + '(' + batchNo + ').' + workerModuleName + '()';
	 
	// writeLogEntry(moduleId,'Item Count = ' + items.length);
	 
	if (items.length > 0) {
    writeLogEntry(moduleId,'Waiting.');
    setTimeout(
      function() {   
        writeLogEntry(moduleId,'Running.');
        return callback(items,batchNo,batchSize,response).catch(function(e) {
        	writeLogEntry(moduleId,'Error.');
        	throw e;
        });
      },
      10000
    )
  }
}
    
function getMoviesFromTMDB(sessionState,response) {

  var movies = []
  var movieCache = [];
  
  // Limit Pages to 1000.
  var maxPageNumber = 1000;
 	var batchSize = 35; 
  var pages = []
  
  var baseURL

  var moduleId = 'getMoviesFromTMDB()';
  
  function getTMDBConfiguration() {
    
    var moduleId = 'getTMDBConfiguration()'
    // writeLogEntry(moduleId);
  
    return new Promise(
        
      function(resolve, reject) {
                    
        var readResponse = function(response) {
                  
          var responseText = '';
          
          response.on(
            'data' ,
             function(chunk) {
              responseText = responseText + chunk;
            }
          );
          
          response.on(
            'end', 
            function () {
              if (response.statusCode == 200) {
                try {
                  // writeLogEntry(moduleId + '.readResponse()')
                  resolve(JSON.parse(responseText));
                } catch (e) {
                  reject(e);
                }
              }
              else {
                var e = { 
                      module : moduleId + '.readResponse(end)',
                      statusCode : response.statusCode,
                      statusText : http.STATUS_CODES[response.statusCode],
                      requestDetails : options,
                      bytesRecieved : responseText.length,
                      responeText : responseText
                    }
                reject(e)
              }
            }
          );
        }
      
        // console.log(moduleId,'Executing Promise.');
    
        var path = cfg.dataSources.tmdb.apiPath + '/configuration'
                 + '?' + 'api_key=' + cfg.dataSources.tmdb.apiKey;
  
        var options = {} 
  
        if (cfg.dataSources.useProxy) {
          path = cfg.dataSources.tmdb.protocol + '://' + cfg.dataSources.tmdb.hostname + ':' + cfg.dataSources.tmdb.port + path;
          options = {
            hostname : cfg.dataSources.proxy.hostname,
            port     : cfg.dataSources.proxy.port,
            method   : 'GET',
            path     : path,
            headers : {'Content-Type': 'application/json'}
          }
        }
        else {
          options = {
            hostname : cfg.dataSources.tmdb.hostname,
            port     : cfg.dataSources.tmdb.port,
            method   : 'GET',
            path     : path,
            headers : {'Content-Type': 'application/json'}
          }
        };    
    
        var request = http.request(options, readResponse);
        request.on(
          'error', 
          (e) => {
            var details = { 
              module         : moduleId + '.request(error)',
              requestOptions : options,
              cause          : e
            }
            reject(new ExternalError(details));
          }
        );
        request.end();
      }
    )   
  }
      
  function saveMovies(movieCache) {
  	
  	// (Re)Create the Movie Collection.
    
    return movieAPI.recreateMovieCollection(sessionState).then(function() {
      return movieAPI.insertMovies(sessionState, movieCache);
    }).then(function(sodaResponse) {
      response.write(',');
      response.write('"count":' + sodaResponse.json.length);
      response.write('}');
      response.end();
    }).catch(function(e) {
      writeLogEntry('processMovies()','Broken Promise.');
      throw e;
    })
  }

  function getCastMembers(cast) {
    
    var castMembers = []
    try {
      cast.forEach(
        function(castMember) {
          var newCastMember = {
              name : castMember.name,
              character : castMember.character
          }       
          castMembers.push(newCastMember);
        }
      )
    } catch(e) {
      throw e;
    }
    
    return castMembers      
  }
  
  function getCrewMembers(crew) {
    
    var crewMembers = []

    try {   
      crew.forEach(
        function(crewMember) {
          var newCrewMember = {
              name : crewMember.name,
              job : crewMember.job
          }       
          crewMembers.push(newCrewMember);
        }
      )
    } catch(e) {
      throw e;
    }
    
    return crewMembers
  }
      
  function getMovieFromTMDB(movieId) {
    
    var moduleId = 'getMovieFromTMDB(' + movieId + ')';
  
    return new Promise(
        
      function(resolve, reject) {
                    
        var readResponse = function(response) {
            
          var responseText = '';
              
          response.on(
            'data' ,
            function(chunk) {
             responseText = responseText + chunk;
            }
          )
          
          response.on(
            'end', 
            function () {
              if (response.statusCode == 200) {
                try {
                  // writeLogEntry(moduleId + '.readResponse()')
                  var movieDetails = JSON.parse(responseText)
                  resolve(movieDetails);
                } catch (e) {
                  reject(e);
                }
              }
              else {
                var e = { 
                      module         : moduleId + '.readResponse(end)',
                      statusCode     : response.statusCode,
                      statusText     : http.STATUS_CODES[response.statusCode],
                      requestDetails : options,
                      bytesRecieved  : responseText.length,
                      responeText    : responseText
                    }
                reject(e)
              }
            }
          )
        }
      
        // writeLogEntry(moduleId,'Executing Promise.');
    
        var path = cfg.dataSources.tmdb.apiPath + '/movie/' + movieId  
                 + '?' + 'api_key=' + cfg.dataSources.tmdb.apiKey
                 + '&' + 'append_to_response=' + 'credits,releases'
                 
        var options = {} 
  
        if (cfg.dataSources.useProxy) {
          path = cfg.dataSources.tmdb.protocol + '://' + cfg.dataSources.tmdb.hostname + ':' + cfg.dataSources.tmdb.port + path;
          options = {
            hostname : cfg.dataSources.proxy.hostname,
            port     : cfg.dataSources.proxy.port,
            method   : 'GET',
            path     : path,
            headers : {'Content-Type': 'application/json'}
          }
        }
        else {
          options = {
            hostname : cfg.dataSources.tmdb.hostname,
            port     : cfg.dataSources.tmdb.port,
            method   : 'GET',
            path     : path,
            headers : {'Content-Type': 'application/json'}
          }
        };    
    
        var request = http.request(options, readResponse);
        request.on(
          'error', 
          (e) => {
            var details = { 
              module         : moduleId + '.request(error)',
              requestOptions : options,
              cause          : e
            }
            reject(new ExternalError(details));
          }
        );
        request.end();
      }
    )   
  }
                           
  function isUnratedMovie(movieDetails) {

      var unrated = false
                                 
    	movieDetails.releases.countries.forEach(function(release) {
        if ((release.iso_3166_1 === "US") && (release.certification === 'NR')) {
        	unrated = true;
        }
      })
         
      return unrated;
   
  }
                           
  function createMovie(tmdbMovie) {

	  var moduleId = 'createMovie(' + tmdbMovie.id + ')';
    // writeLogEntry(moduleId);

    return getMovieFromTMDB(tmdbMovie.id).then(function(movieDetails) {
    	  	
    	if (!isUnratedMovie(movieDetails)) { 

        var certification;
        
        var releaseDate = "2999-01-01";
        
      	movieDetails.releases.countries.forEach(function(release) {
          if (release.iso_3166_1 === cfg.dataSources.tmdb.searchCriteria.country) {
            if (release.release_date < releaseDate) {
               certification = release.certification
               releaseDate = release.release_date;
            }
          }
        })
      
    	  var movie = {
      	  id            : movieDetails.id,
      	  title         : movieDetails.title,
      	  plot          : movieDetails.overview,
      	  runtime       : movieDetails.runtime,
      	  posterURL     : baseURL
                          + "w185"
                          + movieDetails.poster_path
                          + '?' + 'api_key=' + cfg.dataSources.tmdb.apiKey,
      	  castMember    : getCastMembers(movieDetails.credits.cast),
      	  crewMember    : getCrewMembers(movieDetails.credits.crew),
          releaseDate   : releaseDate,
          certification : certification
      	}
        movieCache.push(movie);
      }
      else {
      	writeLogEntry(moduleId,'Skipping unrated movie : ' + movieDetails.title);
      }
    }).catch(function (e) {
      writeLogEntry(moduleId,'Broken Promise.')
      throw e
    })
                  	        
    return movie;
  }

  function getMoviePage(pageNo) {
  	
  	var moduleId = 'getMoviePage(' + pageNo + ')';
  
    return new Promise(
    
      function(resolve, reject) {
  
        var readResponse = function(response) {
        
        var responseText = '';
          
        response.on(
          'data' ,
           function(chunk) {
              responseText = responseText + chunk;
            }
          )
          
          response.on(
            'end', 
            function () {
              if (response.statusCode == 200) {
                var page = JSON.parse(responseText)
                resolve(page);
              }
              else {                
                var details = { 
                  module         : moduleId + '.response(end)',
                  statusCode     : response.statusCode,
                  statusText     : http.STATUS_CODES[response.statusCode],
                  requestOptions : options,
                  bytesRecieved  : responseText.length,
                  responeText    : responseText,
                  cause          : new Error()
                }
                reject(new ExternalError(details));
              }
            }
          );
        }
  
        var path = cfg.dataSources.tmdb.apiPath + '/discover/movie' 
                 + '?' + 'api_key=' + cfg.dataSources.tmdb.apiKey
                 + '&' + 'primary_release_date.gte=' + cfg.dataSources.tmdb.searchCriteria.releaseDates.start
                 + '&' + 'primary_release_date.lte=' + cfg.dataSources.tmdb.searchCriteria.releaseDates.end 
                 + '&' + 'certification_country=' + cfg.dataSources.tmdb.searchCriteria.country 
                 + '&' + 'certification.lte=' + cfg.dataSources.tmdb.searchCriteria.certification
                 + '&' + 'original_language=' + cfg.dataSources.tmdb.searchCriteria.language 
                 + '&' + 'include_adult=' + 'false'
                 + '&' + 'sort_by=' + 'popularity.desc'
  
        if (pageNo > 0) {
          path = path + '&' + 'page=' + pageNo
        }         
  
        // console.log(new Date().toISOString() + ": " + moduleId + '): Path=' + path);
        
        var options = {}
        
        if (cfg.dataSources.useProxy) {
           path = cfg.dataSources.tmdb.protocol + '://' + cfg.dataSources.tmdb.hostname + ':' + cfg.dataSources.tmdb.port + path;
           options = {
             hostname : cfg.dataSources.proxy.hostname,
             port     : cfg.dataSources.proxy.port,
             method   : 'GET',
             path     : path,
             headers : {'Content-Type': 'application/json'}
           }
        }
        else {
          options = {
           hostname : cfg.dataSources.tmdb.hostname,
            port     : cfg.dataSources.tmdb.port,
            method   : 'GET',
            path     : path,
            headers : {'Content-Type': 'application/json'}
          };  
        }  

        var request = http.request(options, readResponse);
        request.on(
          'error', 
          (e) => {
            var details = { 
              module         : moduleId + '.request(error)',
              requestOptions : options,
              cause          : e
            }
            reject(new ExternalError(details));
          }
        );
        request.end();
      }
    )   
  }

  function getMovieDetails(movies, batchNo, batchSize,response) {

		var moduleId = 'getMovieDetails(' + batchNo + ')';

    var batch = movies.splice(0,batchSize)
    // writeLogEntry(moduleId,'Movies remaining = ' + movies.length);
    
    var status = {
      date   : dateWithTZOffset(new Date()),
   	  module : moduleId,
    	state  : "Processing",
    	batch  : batchNo
    }
    response.write(JSON.stringify(status));
    response.write(',');

    /*
    idList = batch.reduce(
      function(list,movie) {
        list = list + movie.id + ",";
        return list
      },
      ""
    );
    var idList = idList.substring(0,idList.length-1);
    writeLogEntry(moduleId,'Adding Batch ' + batchNo + ': [' + idList + '].');
    */
  
    // Create a Batch of getMovieFromTMDB() operations.
    // writeLogEntry(moduleId,'Generating getMovieFromTMDB() operations.');
        
    return Promise.all(batch.map(createMovie)).then(function(){
    	if (movies.length > 0) {
  	    writeLogEntry(moduleId,'Movies remaining = ' + movies.length);
      	batchNo++;
  		  return waitAndRun(movies, getMovieDetails, 'getMovieDetails', 'createMovie', batchNo, batchSize, response);
  		}
	 		else {
        writeLogEntry(moduleId, 'createMovie operations complete');
        var status = {
        date   : dateWithTZOffset(new Date()),
        module : moduleId,
        state  : "Completed"
        }
        response.write(JSON.stringify(status))
        response.write(']');

        writeLogEntry(moduleId,'Movie Cache size = ' + movieCache.length);
        saveMovies(movieCache);
      }
    }).catch(function(e){
   	  throw e
    })
  
  }
    
  function getMoviePages(pages, batchNo, batchSize, response) {

    var moduleId = 'getMoviePages(' + batchNo +')';

		var batch = pages.splice(0,batchSize)
    writeLogEntry(moduleId,'Pages remaining = ' + pages.length);

    var status = {
        date   : dateWithTZOffset(new Date()),
        module : moduleId,
        state  : "Processing",
        batch  : batchNo
      }
    
    response.write(JSON.stringify(status));
    response.write(',');

    /*
    idList = batch.reduce(
      function(list,movie) {
        list = list + movie.id + ",";
        return list
      },
      ""
    );
    var idList = idList.substring(0,idList.length-1);
    console.log(moduleId,'Adding Batch ' + batchNo + ': [' + idList + '].');
    */
  
    // Create a Batch of getMovieListPage() operations.
    // writeLogEntry(moduleId, 'Generating getMoviePage() operations.');
      
    return Promise.all(batch.map(getMoviePage)).then(function(tmdbPages) {
    	// tmdbPages = 35 Pages of Movies..
    	processPages(tmdbPages);
    	if (pages.length > 0) {
  	    writeLogEntry(moduleId,'Pages remaining = ' + pages.length);
      	batchNo++;
  		  return waitAndRun(pages, getMoviePages, 'getMoviePages', 'getMoviePage', batchNo, batchSize, response);
  		}
  		else {
  	    writeLogEntry(moduleId,'Processing complete. TMDB Movie count = ' + movies.length);  	     	     
 				return waitAndRun(movies,getMovieDetails, 'getMovieDetails','createMovie',1,batchSize,response);
  		}
    }).catch(function(e){
   	  throw e
    })
  }
  
  function processPages(tmdbPages) {
  	
  	moduleId = 'processPages';
    tmdbPages.forEach(
      function(tmdbPage) {
        tmdbPage.results.forEach(
          function(m){
            if (movies.length === cfg.dataSources.tmdb.searchCriteria.movieLimit) {
              // writeLogEntry(moduleId,'Processing completed. ' + cfg.dataSources.tmdb.searchCriteria.movieLimit + ' movies selected.');
      	    	pages.length = 0;
            }
            else {
         	    if (m.popularity > cfg.dataSources.tmdb.searchCriteria.popularity) {
         	    	writeLogEntry(moduleId,'Adding ' + m.title);
         	      movies.push(m);
        	    }
         	    else {
                // writeLogEntry(moduleId,'Processing completed. '  + m.title + ' has popularity < ' + cfg.dataSources.tmdb.searchCriteria.popularity);
        	    	pages.length = 0;
         	    }
        	  }
          }
        )
      }
    )
  }  	

  writeLogEntry(moduleId);

  return getTMDBConfiguration().then(function(tmdbConfiguration) {
    baseURL = tmdbConfiguration.images.base_url
    // writeLogEntry(moduleId,'Poster URL = ' + baseURL);
  }).then(function() {
    return getMoviePage(0)
  }).then(function(tmdbPage) {
    writeLogEntry(moduleId,'Page Count = ' + tmdbPage.total_pages);
 
    maxPageNumber = (tmdbPage.total_pages > maxPageNumber ) ? maxPageNumber : tmdbPage.total_pages;

    for (var i=0; i < maxPageNumber; i++) {   
       pages.push(i+1)
    }

    // Response #1 Open Object, Output key "status" : Start Array
    response.write('{"status":[') 
    // processPages([tmdbPage]);
    return waitAndRun(pages, getMoviePages, 'getMoviePages', 'getMoviePage', 1, batchSize, response);
  }).catch(function(e) {
    writeLogEntry(moduleId,'Broken Promise.');
    throw e;
  });   

}  
   
function generateShowsForScreen(engagementStartDate,engagementEndDate,screen,theaterId,movieId,runtime) {
    
  var moduleId = 'generateShowsForScreen(' + screen.id + ',' + movieId + ')';
  var shows = []
  
  var screenId = screen.id
  var startTime = getRandomBetweenValues(0,11) * 5;
  var firstShowTime = [12,startTime]

  // writeLogEntry(moduleId);
  
  // Generate Shows for Each Day of the Engagement.

  var showTime = new Date()
  var tomorrow = new Date()
  showTime.setTime(engagementStartDate.getTime());
  tomorrow.setTime(showTime.getTime() + (24*60*60*1000));
  tomorrow.setHours(0);
  tomorrow.setMinutes(0);
  tomorrow.setSeconds(0);
  
  showTime.setHours(firstShowTime[0])
  showTime.setMinutes(firstShowTime[1])
  showTime.setSeconds(0)
  
  while (showTime < engagementEndDate) {
    // writeLogEntry(moduleId,'showTime= ' + showTime);
    var show = {
      theaterId      : theaterId,
      movieId        : movieId,
      screenId       : screen.id,
      startTime      : dateWithTZOffset(showTime),
      seatsRemaining : screen.capacity,
      ticketPricing  : screen.ticketPricing,
      seatMap        : screen.seatMap
    }
    showTime.setTime(showTime.getTime() + ((runtime+30)*60*1000));
    showTime.setMinutes(5 * Math.round(showTime.getMinutes()/5));
    shows.push(show)
    if (showTime.getTime() > tomorrow.getTime()) {
      showTime.setTime(tomorrow.getTime());
      showTime.setHours(firstShowTime[0])
      showTime.setMinutes(firstShowTime[1])
      showTime.setSeconds(0)
      tomorrow.setTime(tomorrow.getTime() + (24*60*60*1000));
    }
  } 
  return shows;
}
  
function generateScreeningsForTheater(sessionState,engagementStartDate,engagementEndDate,theater,movies,updatedMovieList) {
  
  var moduleId = 'generateScreeningsForTheater(' + theater.id + ')';
  var screeningList = []
  
  // writeLogEntry(moduleId);
  
  return Promise.all(
    // Generate a Array of ShowTimes for each screen within the Theater.
    theater.screens.map(function(screen) {
      // Choose a random Movie for this screen
      var movieIndex = getRandomBetweenValues(0,movies.length);
      var movieItem = movies[movieIndex];
      resetMovieInTheatersFlag(movieItem,true,updatedMovieList)
      return (generateShowsForScreen(engagementStartDate,engagementEndDate,screen,theater.id,movieItem.value.id,movieItem.value.runtime))
    })
  ).then(function(screenings) {
  	// Collapse the array of arrays into a single array
  	screenings.forEach(function(screenings) {
      screenings.forEach(function(screening) {
        screeningList.push(screening);
      })
    })
    // writeLogEntry(moduleId,'Batch Size=' + screeningList.length);
    // Load the Batch of Screenings for the Theater.
    return movieAPI.insertScreenings(sessionState, screeningList);
  })
}

function generateScreenings(sessionState,engagementStartDate,engagementEndDate,theaters,movies,updatedMovieList) {

  var moduleId = 'generateScreenings()'; 
  writeLogEntry(moduleId);

  // writelogEntry(moduleId,'engagementStartDate =' + engagementStartDate);
  // writeLogEntry(moduleId,'engagementEndDate = ' + engagementEndDate);
  // writeLogEntry(moduleId,'engagementLimit = ' + engagementLimit);

  return Promise.all(
    theaters.map(
      function(theater) {       
        return generateScreeningsForTheater(sessionState,engagementStartDate,engagementEndDate,theater,movies,updatedMovieList);
      }
    )
  )
}

function resetMovieInTheatersFlag(movieItem,state,updatedMovieList) {
	
	// reset the inTheaters flag and add to the list of movies that need updating.
	
	// writeLogEntry('resetMovieInTheatersFlag(' + movieItem.value.id + ',' + state + ')');
	if (movieItem.value.inTheaters != state) {
    movieItem.value.inTheaters = state;
    updatedMovieList.push(movieItem);
  }
}                      

function createScreenings(sessionState) {

  var moduleId = 'createScreenings()';

	var engagementStartDate = new Date();
	engagementStartDate.setDate(engagementStartDate.getDate() - engagementStartDate.getDay());
  engagementStartDate.setHours(0)
  engagementStartDate.setMinutes(0)
  engagementStartDate.setSeconds(0)

  var engagementEndDate = new Date();
  engagementEndDate.setDate(engagementStartDate.getDate() + 14);
  engagementEndDate.setHours(0)
  engagementEndDate.setMinutes(0)
  engagementEndDate.setSeconds(0)

  // writeLogEntry(moduleId,'Date Range is ' + dateWithTZOffset(engagementStartDate)  + ' thru ' + dateWithTZOffset(engagementEndDate));

  var theaterList = []
  var movieList = []
  var screeningCount = 0;
  var updatedMovieList = [];
  
  return movieAPI.getTheaters(sessionState).then(function(sodaResponse) {
    sodaResponse.json.forEach(
      function(item) {
        theaterList.push(item.value);
      }
    )
  }).then(function() {
    return movieAPI.getMovies(sessionState)
  }).then(function(sodaResponse) {
  	movieList = sodaResponse.json
  	movieList.forEach(
  	  function(movieItem) { 
  	  	resetMovieInTheatersFlag(movieItem,false,updatedMovieList);
  	  }
  	);
  	writeLogEntry(moduleId,'Reset List = ' + updatedMovieList.length);
  	return movieAPI.recreateScreeningCollection(sessionState)
  }).then(function() {
    return generateScreenings(sessionState,engagementStartDate,engagementEndDate,theaterList,movieList,updatedMovieList)
  }).then(function(sodaResponses) {
  	// writeLogEntry(moduleId,JSON.stringify(sodaResponses))
    screeningCount = sodaResponses.reduce(
  	  function (runningTotal,sodaResponse) {
  		  runningTotal = runningTotal + sodaResponse.json.length
  	    return runningTotal
  	  },
  	  0
  	);
  }).then(function(e) {
     writeLogEntry(moduleId,'Reset and Update list = ' + updatedMovieList.length);
  	 return Promise.all(updatedMovieList.map(function(movieItem) {return movieAPI.updateMovie(sessionState, movieItem.id,movieItem.value);}))
  }).then(function() {
  	 return screeningCount;
  }).catch(function(e) {
      writeLogEntry(moduleId,'Broken Promise.');
      throw e;
  })     
}

function getMoviePoster(movieId,posterURL) {
  
  // writeLogEntry('getMoviePoster(' + movieId + ',' + posterURL + ')');

  return new Promise(
      
    function(resolve, reject) {
                  
      var readResponse = function(response) {
          
        var chunks = [];
            
        response.on(
          'data' ,
          function(chunk) {
           // writeLogEntry('getMoviePoster(' + movieId + ',' + posterURL + ').readResponse(data): Processing Chunk');                
           chunks.push(chunk);
          }
        )
        
        response.on(
          'end', 
          function () {
            // writeLogEntry('getMoviePoster(' + movieId + ',' + posterURL + ').readResponse(end): StatusCode = ' + response.statusCode);                
            if (response.statusCode == 200) {
              try {
                var content = Buffer.concat(chunks);
                // writeLogEntry('getMoviePoster(' + movieId + ',' + posterURL + ').readResponse(end): Chunks read = ' + chunks.length + '. Content length = ' + content.length);
                resolve(content);
              } catch (e) {
                reject(e);
              }
            }
            else {
              var e = { 
                    module : 'getMoviePoster(' + movieId + ',' + posterURL + ').readResponse(end)',
                    statusCode : response.statusCode,
                    statusText : http.STATUS_CODES[response.statusCode],
                    requestDetails : options,
                  }
              reject(e)
            }
          }
        )
      }
    
      // writeLogEntry('getMoviePoster(' + movieId + ',' + posterURL + '): Executing Promise.');
              		
      if (posterURL.indexOf('/movieticket/poster/') == 0) {
      	resolve(null)
      	return;
      }
      
      var options = {} 

      if (cfg.dataSources.useProxy) {
        var path = posterURL;
        options = {
          hostname : cfg.dataSources.proxy.hostname,
          port     : cfg.dataSources.proxy.port,
          method   : 'GET',
          path     : posterURL,
          headers : {'Content-Type': 'application/json'}
        }
      }
      else {
     		var imageURL = url.parse(posterURL);
        options = {
          hostname : imageURL.hostname,
          port     : imageURL.port,
          method   : 'GET',
          path     : imageURL.path,
          headers : {'Content-Type': 'application/json'}
        }
      };    
  
      var request = http.request(options, readResponse);
      request.on(
        'error', 
        (e) => {
          var details = { 
            module         : 'getMoviePoster(' + movieId + ',' + posterURL + ').request(error)',
            requestOptions : options,
            cause          : e
          }
          reject(new ExternalError(details));
        }
      );
      request.end();
    }
  )   
}                         

function getPostersFromTMDB(sessionState,response) {

  var movieItems = [];
  var posterCount = 0;

  
  function getPosterFromTMDB(movieItem) {
 
  	return getMoviePoster(movieItem.id, movieItem.value.posterURL).then(function(poster){
  		if (poster != null) {
        posterCount++;
        // writeLogEntry('getPosterFromTMDB() : Poster size = ' + poster.length);
  	    return movieAPI.insertPoster(sessionState, poster).then(function(sodaResponse){
  	    	var movie =  movieItem.value;
  	    	movie.externalURL = movie.posterURL
  	    	movie.posterURL = '/movieticket/poster/' + sodaResponse.json[0].id;
          return movieAPI.updateMovie(sessionState, movieItem.id,movie).catch(function(e) {
          	writeLogEntry('getPosterFromTMDB(' + movie.id + ').updateMovie(): Broken Promise.');
          	throw e;
          })
  	    }).catch(function(e) {
  		    writeLogEntry('getPosterFromTMDB(' + movie.id + ').insertPoster(): Broken Promise.');
  		    throw e;
        })
      }
      else {
      	// Nothing to do
      	return Promise.resolve();
      }
    }).catch(function(e) {
      writeLogEntry('getPosterFromTMDB(' + movie.id + '): Broken Promise.');
  	  throw e;
    })
  }
  
  function getPosterBatchFromTMDB(movieItems, batchNo, batchSize, response) {
  
    var batch = movieItems.splice(0,batchSize)
    // writeLogEntry('getPosterBatchFromTMDB(' + batchNo +',' + batch.length + '): Generating getMovieFromTMDB() operations.');
     
    var status = {
      date   : dateWithTZOffset(new Date()),
   	  module : 'getPosterBatchFromTMDB()',
    	state  : "Processing",
    	batch  : batchNo
    }
    response.write(JSON.stringify(status));
    response.write(',');
   
    /*
    idList = batch.reduce(
      function(list,movie) {
        list = list + movie.id + ",";
        return list
      },
      ""
    );
    var idList = idList.substring(0,idList.length-1);
    console.log('Adding Batch ' + batchNo + ': [' + idList + '].');
    */
   
    // Create a Batch of getPosterFromTMDB() operations.
    // writeLogEntry('getPosterBatchFromTMDB(' + batchNo +'): Generating getPosterFromTMDB operations.');
      
    return Promise.all(batch.map(getPosterFromTMDB)).then(function(){
    	if (movieItems.length > 0) {
        writeLogEntry('getPosterBatchFromTMDB(' + batchNo + '): Movies remaining = ' + movieItems.length);
      	batchNo++;
   	    return waitAndRun(movieItems, getPosterBatchFromTMDB, 'getPosterBatchFromTMDB', 'getPosterFromTMDB', batchNo, batchSize,response);
     	}
   		else {
        writeLogEntry('getPosterBatchFromTMDB(): getPosterFromTMDB() operations complete');
        var status = {
        date   : dateWithTZOffset(new Date()),
        module : 'getPosterBatchFromTMDB',
        state  : "Completed"
        }
        response.write(JSON.stringify(status))
        response.write(']');
        response.write(',');
    	  response.write('"count":' + posterCount);
        response.write('}');
    	  response.end();
      }
    }).catch(function(e){
   	  throw e
    })
  }
      
  writeLogEntry('getPostersFromTMDB()');

  var qbe = { posterURL : { '$ne' : null }}
  
  return movieAPI.queryMovies(sessionState, qbe,'unlimited').then(function(sodaResponse){
  	movieItems = sodaResponse.json;
  	// console.log(JSON.stringify(movieItems).substring(0,9999));
  	writeLogEntry('getPostersFromTMDB() : Movie count = ' + movieItems.length);
    return movieAPI.recreatePosterCollection(sessionState)
  }).then(function() {
    response.write('{"status":[') 
    return waitAndRun(movieItems, getPosterBatchFromTMDB, 'getPosterBatchFromTMDB', 'getPosterFromTMDB', 1, 35, response);
  }).catch(function(e){
  	writeLogEntry('getPostersFromTMDB(): Broken Promise.');
  	throw e;
  });
}