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
var url = require('url');
var cfg = require('./config.js');
var xmlParser = require('xml2js').Parser();
var movieAPI = require('./movie_ticket_api.js');
var usAddressParser = require('parse-address');
var googleMapsClient = require('@google/maps').createClient({key: cfg.dataSources.google.apiKey});
var fs = require('fs');

module.exports.ExternalError     = ExternalError;
module.exports.loadTheaters      = loadTheaters;
module.exports.loadMovies        = loadMovies;
module.exports.loadScreenings    = loadScreenings;
module.exports.loadPosters       = loadPosters;

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

var sodaLoggingDisabled = { sodaLoggingEnabled : false };
var sodaLoggingState    = sodaLoggingDisabled;

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

function getExternalError(moduleName,path,e) {
	
	// writeLogEntry('getExtenalError()',moduleName)
	var details = { 
    module         : moduleName,
    requestOptions : path,
    cause          : e
  }
  
  writeLogEntry(JSON.stringify(details));
  return new ExternalError(details);
  
}
function processResponse(moduleName, requestOptions, httpResponse, body, resolve, reject) {
	
	var moduleId = 'processResponse("' + moduleName + '","' + httpResponse.contentType + '","' + typeof body + '")'

  var response = {
    module         : moduleName
  , requestOptions : requestOptions
  , statusCode     : httpResponse.statusCode
  , statusText     : http.STATUS_CODES[httpResponse.statusCode]
  , contentType    : httpResponse.headers["content-type"]
  , headers        : httpResponse.headers
  , elapsedTime    : httpResponse.elapsedTime
  }
 
  if ((body !== undefined) && (body !== null)) {
  	if (response.contentType.startsWith("application/json")) {
		  // writeLogEntry(moduleId);
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
		  // writeLogEntry(moduleId,'Body length = ' + Buffer.byteLength(body));	
 			response.body = body;
 		}
  }

	if ((httpResponse.statusCode === 200) || (httpResponse.statusCode === 201)) {
		resolve(response);
	}
  else {
    response.cause = new Error()
    reject(new ExternalError(response));
  }
}
    
function generateRequest(moduleId, cfg, requestOptions) {

	if (cfg.dataSources.useProxy) {
		requestOptions.proxy = 'http://' + cfg.dataSources.proxy.hostname + ':' + cfg.dataSources.proxy.port
	}
  
  return new Promise(function(resolve, reject) {
    request(requestOptions, function(error, response, body) {
 	  	if (error) {
  		  reject(getExternalError(moduleId,requestOptions,error));
			}
			else {
			  processResponse(moduleId, requestOptions, response, body, resolve, reject);
			}
		});
  });
}

function loadTheaters (sessionState, response, next) {

  /* Disable Soda Logging */
  
  var sessionState = sodaLoggingState;

  var theaterList = [];
  var status = {}
  
  writeLogEntry('loadTheaters()');
  
  getTheaterInformation().then(function(theaters) {
  	theaterList = theaters;
		// fs.writeFileSync('theaterList.json',JSON.stringify(theaterList,null,2));
    return movieAPI.recreateLoadIndexTheaters(sessionState,theaterList)
  }).then(function(sodaResponse) {
  	status = { count : theaterList.length};
  	return movieAPI.dropScreeningCollection(sessionState)
 	}).then(function (sodaResponse) {
    response.json(status)
    response.end('')
  }).catch(function(e) {
  	movieAPI.logError(e,theaterList);
    next(e)
  });
} 

function loadMovies(sessionState, response, next) {

  /* Disable Soda Logging */
  
  var moduleId = 'loadMovies';
  var sessionState = sodaLoggingState;

  writeLogEntry(moduleId);
  return getMoviesFromTMDB(sessionState,response).catch(function(e) {
    next(e)
  });

} 

function loadScreenings (sessionState, response, next) {

  /* Disable Soda Logging */
  
  var sessionState = sodaLoggingState;

  writeLogEntry('loadScreenings()');
  createScreenings(sessionState,response).then(function(total) {
    response.write('  , "count" : ' + total)
    response.write('}');
    response.end('')
  }).catch(function(e) {
    next(e)
  });
} 
  
function loadPosters(sessionState, response, next) {

  /* Disable Soda Logging */
  
  var sessionState = sodaLoggingState;

  writeLogEntry('loadPosters()');
  getPostersFromTMDB(sessionState,response).catch(function(e) {
    next(e)
  });

}

function doGeocoding(address,benchmark) {

  var moduleId = 'geocodeAddress("' + address + '",' + benchmark + ')';

  var requestOptions = {
  	method  : 'GET'
  , uri     : cfg.dataSources.usCensus.protocol + '://' 
            + cfg.dataSources.usCensus.hostname + ':' 
            + cfg.dataSources.usCensus.port 
            + cfg.dataSources.usCensus.path
  , qs      : { format : "json", benchmark : benchmark, adress : address}
  , json    : true
  , time    : true
  };
     
  return generateRequest(moduleId, cfg, requestOptions);  

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
      type        : "Point"
    , coordinates : [coordinates.y , coordinates.x]                                                                      
    }
    return geoCoding;  
  }
}

function geocodeAddress(address,benchmark,count) {

  var moduleId = 'geocodeAddress("' + address + '","' + benchmark + '",' + count +')';

	return doGeocoding(address,benchmark).then(function(httpResponse) {
     return getGeoJSON(address,httpResponse.json,benchmark);
  }).catch(function(error) {
    if ((error.statusCode == 500) && (count < 10)) {
  		writeLogEntry(moduleId,JSON.stringify(error));
      return(geocodeAddress(address,benchmark,count+1))
    }
    else {
    	throw error;
    }
  })

}

function geocodeAddressGoogle(address) {
	
	var moduleId = 'geocodeAddressGoogle("' + address + '")';
	
		if (cfg.dataSources.useProxy) {
			var requestOptions = {
	  	  method  : 'GET'
  		, uri   : cfg.dataSources.google.geocoding.protocol + '://' 
            	+ cfg.dataSources.google.geocoding.hostname + ':' 
            	+ cfg.dataSources.google.geocoding.port 
            	+ cfg.dataSources.google.geocoding.path 
        , qs    : {key : cfg.dataSources.google.apiKey, address : address}
	  	, json  : true
  		, time  : true
			, proxy : 'http://' + cfg.dataSources.proxy.hostname + ':' + cfg.dataSources.proxy.port
	   	}
	   	return new Promise(function(resolve,reject) {
	   		generateRequest(moduleId, cfg, requestOptions).then(function(response) {
 	        var location = response.json.results[0].geometry.location
            var geoCoding = {
             	type        : "Point"
            , coordinates : [location.lat, location.lng]                                                                      
  	      }
          resolve(geoCoding);
        }).catch(function (e) {
      	  reject(e);
     	  })
      })
		}
		else {
			return new Promise(function(resolve,reject) {
        googleMapsClient.geocode({
	          address: address
          },
          function(err, response) {
            if (err) {
        	   reject(err) 
            }
            else {
      	      try {
        	      var location = response.json.results[0].geometry.location
                var geoCoding = {
                	type        : "Point"
                  , coordinates : [location.lat, location.lng]                                                                      
          	    }
      	        resolve(geoCoding);
      			  } catch(e) {
      		      reject(e);
      	      }
      		  }
    	    })
        });
    }
}

function geocodeTheater(theater) {
	
	var moduleId = 'geocodeTheater(' + theater.id + ',' + theater.name + ')'

	// If $near is not supported by SODA then geocoding is irrelevant.
	
	
  if (!movieAPI.getDetectedFeatures().$near) {
    theater.location.geoCoding = {}
    // return Promise.resolve(theater);
    return theater;
  }

	var address = theater.location.street + " " + theater.location.city + " " + theater.location.state + " " + theater.location.zipCode;
	// writeLogEntry(moduleId,'Address = "' + address + '".');
  
	switch (cfg.dataSources.geocodingService) {
	  case "usCensus" :
      return geocodeAddress(address,'Public_AR_Census2010',0).then(function(geoCoding){
    	  theater.location.geoCoding = geoCoding
    	  return theater;
      }).catch(function(e) {
  	    writeLogEntry(moduleId,'Unable to get location for = "' + address + '" [USCensus].');
  	    theater.location.geoCoding = {}
  	    return theater;
      });
      break;
	  case "google" :
    	return geocodeAddressGoogle(address).then(function(geoCoding) {
    	  theater.location.geoCoding = geoCoding
  	    return theater;
      }).catch(function(e) {
        console.log(JSON.stringify(e));
  	    writeLogEntry(moduleId,'Unable to get location for = "' + address + '". [Google]');
  	    theater.location.geoCoding = {}
  	    return theater;
      });
      break;
    case "oracle" :
      // TODO : Add support for Oracle Geocoding Service
	    writeLogEntry(moduleId,'Unable to get location for = "' + address + '". [Oracle]');
      // break;
    default :
	    theater.location.geoCoding = {}
	    // return Promise.resolve(theater);
      return theater;
  }
}
    
function parseAddress(address) {
	
	var location = {
		address : address,
		city : "unavailable",
		zipCode : 0
  }
  
	var moduleId = 'parseAddress("' + address + '")';
  
  var parsedAddress = usAddressParser.parseLocation(address);

  var street    
  if (parsedAddress != null) {  	
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
  	    city        : parsedAddress.city.toUpperCase(), // Match the US Census geocoding service's behavoir
  	    zipCode     : parsedAddress.zip,
  	    state       : parsedAddress.state,
  	    phoneNumber : null,
	      geoCoding   : {}
	    }
	  }
  }
  else {
  	writeLogEntry(moduleId,'Failed to parse address.');
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
  
  var requestOptions = {
  	method  : 'GET'
  , uri     : cfg.dataSources.fandango.protocol + '://' 
            + cfg.dataSources.fandango.hostname + ':' 
            + cfg.dataSources.fandango.port 
            + cfg.dataSources.fandango.path 
            + cfg.dataSources.fandango.searchCriteria.zipCode 
            + '.rss'
  , time    : true
  };
     
  return generateRequest(moduleId, cfg, requestOptions);  
     
}

function getTheaterInformation() {
  
  
  var moduleId = "getTheaterInformation()"
	// writeLogEntry(moduleId,'Fetching Theaters');
  
  // Generate a set of Theater documents from the Fandango TheatersNearMe RSS feed and geocode the results.
  
  return getTheatersFromFandango().then(function(response) {
    // writeLogEntry('getTheaterInformation()','Count=' + theaters.length);         
    var theaters = []
    xmlParser.parseString(
      response.body,
      function(err,jsonRSS) {
        theaters = jsonRSS.rss.channel[0].item
      }         
    );
    return Promise.all(theaters.map(generateTheater))     
  }).then(function(theaters) {
  	// writeLogEntry(moduleId,'Starting Geocoding');
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
  
    var requestOptions = {
    	method  : 'GET'
    , uri     : cfg.dataSources.tmdb.protocol + '://' 
              + cfg.dataSources.tmdb.hostname + ':' 
              + cfg.dataSources.tmdb.port 
              + cfg.dataSources.tmdb.apiPath 
              + '/configuration'
 		, qs      : { api_key : cfg.dataSources.tmdb.apiKey}
    , json    : true
    , time    : true
    };
     
    return generateRequest(moduleId, cfg, requestOptions);  

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
  
    var requestOptions = {
    	method  : 'GET'
    , uri     : cfg.dataSources.tmdb.protocol + '://' 
              + cfg.dataSources.tmdb.hostname + ':' 
              + cfg.dataSources.tmdb.port 
 							+ cfg.dataSources.tmdb.apiPath 
 							+ '/movie/' + movieId 
 		, qs      : { api_key : cfg.dataSources.tmdb.apiKey, append_to_response : 'credits,releases'}
    , json    : true
    , time    : true
    };

    return generateRequest(moduleId, cfg, requestOptions);  

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

    return getMovieFromTMDB(tmdbMovie.id).then(function(httpResponse) {
    	
    	var movieDetails = httpResponse.json;
    	  	
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
  	
  	var qs = {
      api_key                    : cfg.dataSources.tmdb.apiKey
    , "primary_release_date.gte" : cfg.dataSources.tmdb.searchCriteria.releaseDates.start
    , "primary_release_date.lte" : cfg.dataSources.tmdb.searchCriteria.releaseDates.end 
    , certification_country      : cfg.dataSources.tmdb.searchCriteria.country 
    , "certification.lte"        : cfg.dataSources.tmdb.searchCriteria.certification
    , original_language          : cfg.dataSources.tmdb.searchCriteria.language 
    , include_adult              : false
    , sort_by                    : 'popularity.desc'
    }

    if (pageNo > 0) {
      qs.page =pageNo
    }         

    var requestOptions = {
    	method  : 'GET'
    , uri     : cfg.dataSources.tmdb.protocol + '://' 
              + cfg.dataSources.tmdb.hostname + ':' 
              + cfg.dataSources.tmdb.port 
 							+ cfg.dataSources.tmdb.apiPath 
              + '/discover/movie' 
 		, qs      : qs
    , json    : true
    , time    : true
    };

    return generateRequest(moduleId, cfg, requestOptions);  
  
  }

 function getMovieDetails(movies, batchNo, batchSize, response) {

		var moduleId = 'getMovieDetails(' + batchNo + ')';

    var batch = movies.splice(0,batchSize)
    writeLogEntry(moduleId,'Movies remaining = ' + movies.length);
    
    var status = {
      date   : dateWithTZOffset(new Date()),
   	  module : moduleId,
    	state  : "Processing",
    	batch  : batchNo
    }
    response.write(JSON.stringify(status));
    response.write(',');

    // Create a Batch of getMovieFromTMDB() operations.
    // writeLogEntry(moduleId,'Generating getMovieFromTMDB() operations.');
        
    return Promise.all(batch.map(createMovie)).then(function(){
    	
    	if (movies.length > 0) {
      	batchNo++;
  		  return waitAndRun(movies, getMovieDetails, 'getMovieDetails', 'createMovie', batchNo, batchSize, response);
  		}
	 		else {
		    writeLogEntry(moduleId, 'getMoviesFromTMDB operations complete. Movie Cache size = ' + movieCache.length); 

      	// Uncomment to Log Data
    		// fs.writeFileSync('movieCache.json',JSON.stringify(movieCache,null,2));
		
        var status = {
          date   : dateWithTZOffset(new Date()),
          module : moduleId,
          state  : "Completed"
        }
        response.write(JSON.stringify(status))
        response.write(']');
 
        return movieAPI.recreateLoadIndexMovies(sessionState,movieCache).then(function() {
          response.write(',');
          response.write('"count":' + movieCache.length);
          response.write('}');
          response.end();
          return movieAPI.dropPosterCollection(sessionState)
        }).then(function() {
          return movieAPI.dropScreeningCollection(sessionState)
        })
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
  
    // Create a Batch of getMovieListPage() operations.
    // writeLogEntry(moduleId, 'Generating getMoviePage() operations.');
      
    return Promise.all(batch.map(getMoviePage)).then(function(httpResponses) {
    	// httpResponse.json = 35 Pages. Each containing multiple Movies. 
    	processPages(httpResponses);
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
  
  function processPages(httpResponses) {
  	
  	moduleId = 'processPages';

    httpResponses.forEach(
      function(httpResponse) {
        httpResponse.json.results.forEach(
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

  return getTMDBConfiguration().then(function(httpResponse) {
    baseURL = httpResponse.json.images.base_url
    // writeLogEntry(moduleId,'Poster URL = ' + baseURL);
  }).then(function() {
    return getMoviePage(0)
  }).then(function(httpResponse) {
    writeLogEntry(moduleId,'Page Count = ' + httpResponse.json.total_pages);
 
    maxPageNumber = (httpResponse.json.total_pages > maxPageNumber ) ? maxPageNumber : httpResponse.json.total_pages;

    for (var i=0; i < maxPageNumber; i++) {   
       pages.push(i+1)
    }

    // Response #1 Open Object, Output key "status" : Start Array
    response.write('{"status":[') 
    // Processing page '0' leads to duplicates
    // processPages([httpResponse]);
    return waitAndRun(pages, getMoviePages, 'getMoviePages', 'getMoviePage', 1, batchSize, response);
  }).catch(function(e) {
    writeLogEntry(moduleId,'Broken Promise.');
    throw e;
  });   

}  
     
function getMoviePoster(movieId,posterURL) {
  
  var moduleId = 'getMoviePoster(' + movieId + ',"' + posterURL + '")';
  // writeLogEntry(moduleId);

  if (posterURL.indexOf('/movieticket/poster/') == 0) {
   	return Promise.resolve({body : null});
  }

  var requestOptions = {
  	method    : 'GET'
  , uri       : posterURL
	, encoding  : null
  , time      : true
  };

  return generateRequest(moduleId, cfg, requestOptions);  
  
}                         

function getPostersFromTMDB(sessionState,response) {

  var movieItems = [];
  var posterCount = 0;

  
  function getPosterFromTMDB(movieItem) {

  	var movie =  movieItem.value;
 
  	return getMoviePoster(movieItem.id, movie.posterURL).then(function(httpResponse){
  		if (httpResponse.body != null) {
        posterCount++;
        // writeLogEntry('getPosterFromTMDB() : Poster size = ' + poster.length);
  	    return movieAPI.insertPoster(sessionState, httpResponse.body).then(function(sodaResponse){
  	    	movie.externalURL = movie.posterURL
  	    	movie.posterURL = '/movieticket/poster/' + sodaResponse.json.items[0].id;
          return movieAPI.updateMovie(sessionState, movieItem.id, movie).catch(function(e) {
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
     
  	var moduleId = 'getPosterBatchFromTMDB(' + batchNo +',' + batch.length + ')';
  
    var status = {
      date   : dateWithTZOffset(new Date()),
   	  module : 'getPosterBatchFromTMDB()',
    	state  : "Processing",
    	batch  : batchNo
    }
    response.write(JSON.stringify(status));
    response.write(',');
   
    // Create a Batch of getPosterFromTMDB() operations.
    // writeLogEntry('getPosterBatchFromTMDB(' + batchNo +'): Generating getPosterFromTMDB operations.');
      
    return Promise.all(batch.map(getPosterFromTMDB)).then(function(){
    	if (movieItems.length > 0) {
        writeLogEntry('getPosterBatchFromTMDB(' + batchNo + '): Movies remaining = ' + movieItems.length);
      	batchNo++;
   	    return waitAndRun(movieItems, getPosterBatchFromTMDB, 'getPosterBatchFromTMDB', 'getPosterFromTMDB', batchNo, batchSize, response);
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
      
  var moduleId = 'getPostersFromTMDB()';

  var qbe = { posterURL : { '$ne' : null }}
  
  return movieAPI.queryMovies(sessionState, qbe,'unlimited').then(function(sodaResponse){
  	movieItems = sodaResponse.json.items;
  	// console.log(moduleId,JSON.stringify(movieItems).substring(0,9999));
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
  
function createScreenings(sessionState,response) {

  var moduleId = 'createScreenings()';
  // writeLogEntry(moduleId);

  var screenings  = []
  var theaterList = []
  var movieList   = []
  
	var engagementStartDate = new Date();
  engagementStartDate.setHours(0)
  engagementStartDate.setMinutes(0)
  engagementStartDate.setSeconds(0)

  var engagementEndDate = new Date();
  engagementEndDate.setDate(engagementStartDate.getDate() + 14);
  engagementEndDate.setHours(0)
  engagementEndDate.setMinutes(0)
  engagementEndDate.setSeconds(0)

  writeLogEntry(moduleId,'Date Range is ' + dateWithTZOffset(engagementStartDate)  + ' thru ' + dateWithTZOffset(engagementEndDate));

  function generateShows(engagementStartDate, engagementEndDate, screen, theaterId, movieId, runtime) {
      
    var moduleId = 'generateShows(' + dateWithTZOffset(engagementStartDate)  + ',' + dateWithTZOffset(engagementEndDate) + ',' + screen.id + ',' + theaterId + ',' + movieId + ',' + runtime + ')';
    // writeLogEntry(moduleId);

    var showCount = 0;
    
    var screenId = screen.id
    var startTime = getRandomBetweenValues(0,11) * 5;
    var firstShowTime = [12,startTime]
      
    // Generate Shows for Each Day of the Engagement.
  
    var showTime = new Date()
    var tomorrow = new Date()
    showTime.setDate(engagementStartDate.getDate());
    tomorrow.setDate(showTime.getDate() + 1);
    tomorrow.setHours(0);
    tomorrow.setMinutes(0);
    tomorrow.setSeconds(0);
    
    showTime.setHours(firstShowTime[0])
    showTime.setMinutes(firstShowTime[1])
    showTime.setSeconds(0)

	  // writeLogEntry('--->','Show Time Range is ' + dateWithTZOffset(showTime)  + ' thru ' + dateWithTZOffset(tomorrow));
    
    while (showTime < engagementEndDate) {
      // writeLogEntry('--->','showTime= ' + showTime);
      var show = {
        theaterId      : theaterId,
        movieId        : movieId,
        screenId       : screen.id,
        startTime      : dateWithTZOffset(showTime),
        seatsRemaining : screen.capacity,
        ticketPricing  : screen.ticketPricing,
        seatMap        : screen.seatMap
      }
      screenings.push(show)
      showCount++;

      showTime.setTime(showTime.getTime() + ((runtime+30)*60*1000));
      showTime.setMinutes(5 * Math.round(showTime.getMinutes()/5));
      if (showTime.getTime() > tomorrow.getTime()) {
        showTime.setTime(tomorrow.getTime());
        showTime.setHours(firstShowTime[0])
        showTime.setMinutes(firstShowTime[1])
        showTime.setSeconds(0)
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
    } 
    
    return showCount;
    
  }
  
  function generateScreeningsForTheater(theater, engagementStartDate, engagementEndDate, response) {
    
    var moduleId = 'createScreenings().generateScreeningsForTheater(' + theater.id + ')';
    // writeLogEntry(moduleId);
 
    // For Each Screen in the Theater

    theater.value.screens.forEach(function(screen,index) {
      // Choose a random Movie for this screen
    	var movieIndex = getRandomBetweenValues(0,movieList.length);
      if (index < 5) {
      	movieIndex = getRandomBetweenValues(0,5);
      }	
      var movieItem = movieList[movieIndex];
      movieItem.value.inTheaters = true;
      var showCount = generateShows(engagementStartDate,engagementEndDate,screen,theater.value.id,movieItem.value.id,movieItem.value.runtime);
    });
   
  }
	var elapsedTime;
	var requestStartTime = new Date();       
	
	response.write('{');
  response.write(' "status"           : {');
  response.write('   "startTime"      : "' + requestStartTime.toISOString() + '"');
  
  return movieAPI.getTheaters(sessionState).then(function(sodaResponse) {
  	elapsedTime = new Date().getTime() - requestStartTime.getTime();
  	theaterList = sodaResponse.json.items;
  	response.write(' , "theaters"      : {');
	  response.write('     "elapsedTime" : ' + elapsedTime);
  	response.write('   , "count"       : ' + theaterList.length);
  	response.write('   }');
  	// writeLogEntry(moduleId,'getTheaters() : ' + elapsedTime + "ms.");
    var qbe = {"$query" : {}, $orderby :{"releaseDate" : -1}};
	  return movieAPI.queryMovies(sessionState, qbe, 50)
  }).then(function(sodaResponse) {
  	elapsedTime = new Date().getTime() - requestStartTime.getTime() - elapsedTime;
  	movieList = sodaResponse.json.items;
  	response.write(' , "movies"      : {');
	  response.write('     "elapsedTime" : ' + elapsedTime);
  	response.write('   , "count"       : ' + movieList.length);
  	response.write('   }');
  	// writeLogEntry(moduleId,'queryMovies() : ' + elapsedTime + "ms.");
  	movieList.forEach(function(movie) {
  		movie.value.inTheaters = false;
  	});
  	theaterList.forEach(function(theater) {
  		generateScreeningsForTheater(theater,engagementStartDate,engagementEndDate,response)
  	});
  	elapsedTime = new Date().getTime() - requestStartTime.getTime() - elapsedTime;
  	response.write(' , "generateScreenings"      : {');
	  response.write('     "elapsedTime" : ' + elapsedTime);
  	response.write('   , "count"       : ' + screenings.length);
  	response.write('   }');
  	// writeLogEntry(moduleId,'generateScreenings() : ' + elapsedTime + "ms.");
    return movieAPI.recreateLoadIndexScreenings(sessionState,screenings)
  }).then(function(e) {
  	elapsedTime = new Date().getTime() - requestStartTime.getTime() - elapsedTime;
  	response.write(' , "recreateLoadIndexScreenings"      : {');
	  response.write('     "elapsedTime" : ' + elapsedTime);
  	response.write('   }');
  	// writeLogEntry(moduleId,'recreateLoadIndexScreenings() : ' + elapsedTime + "ms.");
  	return Promise.all(movieList.map(function(movieItem) {
  	 return movieAPI.updateMovie(sessionState, movieItem.id, movieItem.value);
  	}))
  }).then(function(sodaResponse) {
  	elapsedTime = new Date().getTime() - requestStartTime.getTime() - elapsedTime;
  	response.write(' , "updateMovie"      : {');
	  response.write('     "elapsedTime" : ' + elapsedTime);
  	response.write('   }');
  	response.write(' }');
  	// writeLogEntry(moduleId,'updateMovie() : ' + elapsedTime + "ms.");
  	return screenings.length;
  }).catch(function(e) {
    writeLogEntry(moduleId,'Broken Promise.');
    throw e;
  })     
}