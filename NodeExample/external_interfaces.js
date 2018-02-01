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
const request = require('request-promise-native');
const url = require('url');
const cfg = require('./config.js');
const xmlParser = require('xml2js').Parser();
const movieAPI = require('./movie_ticket_api.js');
const usAddressParser = require('parse-address');
const googleMapsClient = require('@google/maps').createClient({key: cfg.dataSources.google.apiKey});
const fs = require('fs');
const errorLibrary = require('./error_library.js');
const constants = require('./constants.js');

module.exports.loadTheaters      = loadTheaters;
module.exports.loadMovies        = loadMovies;
module.exports.loadScreenings    = loadScreenings;
module.exports.loadPosters       = loadPosters;

const DEFAULT_RETRY_COUNT = 5;
const HIGH_RETRY_COUNT    = 100;
const LOW_RETRY_COUNT     = 10;
const NO_RETRY_OPERATIONS = 0

const moduleName = 'EXTERNAL-INTERFACES';

function timeout(duration) {
  return new Promise(
               function(resolve, reject) {
			     setTimeout(
				   function(){
			         resolve();
   			       }, 
			       duration
			     )
			   }
			 )
};

function writeLogEntry(module,comment) {
	
  const message = ( comment === undefined) ? module : `${module}: ${comment}`
  console.log(`${new Date().toISOString()}: ${moduleName}.${message}`);

}

// var engagementStartDate = new Date(cfg.dataSources.engagementStartDate)
// var engagementEndDate = new Date(cfg.dataSources.engagementEndDate)

function dateWithTZOffset(date) {
  var tzo = -date.getTimezoneOffset()
   var dif = tzo >= 0 ? '+' : '-'
   var pad = function(num) {
     var norm = Math.abs(Math.floor(num));
     return (norm < 10 ? '0' : '') + norm;
   };
 
   return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${dif}${pad(tzo / 60)}:${pad(tzo % 60)}`;
}

function generateSummary(documents) {
	
	return { documentCount : documents.length, firstDocument: documents[0], lastDocument : documents[documents.length-1]}

}

function getRandomBetweenValues(low,high) {
  return Math.floor(Math.random() * (high-low) + low);
}   

function formatBody(invokerId,body,contentType) {

  const moduleId = invokerId + ".formatBody(" + typeof body + "," + contentType + ")"

  let result = {}
 
  if (((body !== undefined) && (body !== null)) && ((contentType !== undefined) && (contentType.startsWith("application/json")))) {
    // writeLogEntry(moduleId,'Type = ` + typeof body);
    if (typeof body === 'object') {
      result = { json : body }
    }
    else {
      try {
        result = { json : JSON.parse(body) }
      } catch (e) {
        result = { body : body }
      }
    }
  }
  else {
    // writeLogEntry(moduleId,'Returning Binary Content: Byte Length = ` + Buffer.byteLength(httpResponse.body));
    result = { body : body } ;
  }

  return result
  
}

function interpetStatusCode(statusCode) {
	
  switch (statusCode) {
    case 200: 
	  return constants.SUCCESS
	case 201:
	  return constants.CREATED
	case 400:
	  return constants.BAD_REQUEST
	case 404:
	  return constants.NOT_FOUND
	case 412:
	  return constants.CONFLICTING_UPDATE
	case 500:
	  return constants.FATARRROR
	  break;
	default:
	  return constants.UNKNOWN_ERROR
  }

}

function processError(invokerId, error) {

  const details = { module           : moduleName
                  , function         : invokerId
               // , request          : options
               // , stack            : new Error().stack
	           // , response         : response
                  , underlyingCause  : error
               // , statusCode       : e.statusCode 
                  }
 
return new errorLibrary.GenericException(`$(moduleName}: Unexpected exception encountered.`,details)
  
}
  
function formatResponse(invokerId, httpResponse) {

  const moduleId = `${invokerId}.formatResponse("${httpResponse.statusCode}")`;
  // writeLogEntry(moduleId);
  
  if ((httpResponse.statusCode === 200) || (httpResponse.statusCode === 201)) {
	
	const response =  { module         : moduleName
	                  , fucntion       : invokerId
                      , elapsedTime    : httpResponse.elapsedTime
                      , status         : interpetStatusCode(httpResponse.statusCode)
                 	  , contentType    : httpResponse.headers["content-type"]
					  , headers        : httpResponse.headers
                      }
	
    Object.assign(response, formatBody(moduleId,httpResponse.body,response.contentType))

    return response
  }
  else {
	const error =  { status         : interpetStatusCode(httpResponse.statusCode)
	               , httpResponse   : httpResponse
                   // , requestStack   : logRequest.logEntry.stack
                   // , httpRequest    : logRequest.logEntry.request
	               }

   throw processError(moduleId,error);
  }
}

async function sendRequest(invokerId, options, retryLimit) {

  const moduleId = `${invokerId}.sendRequest("${options.method}","${options.uri}",${retryLimit})`;
  // writeLogEntry(moduleId);
    
  const delay = 5000
 
  options.resolveWithFullResponse = true
  options.simple = true
  
  if (cfg.dataSources.useProxy) {
    options.proxy = `http://${cfg.dataSources.proxy.hostname}:${cfg.dataSources.proxy.port}`
  }

  let retryCount = 0;
  let startTime = null
  startTime = new Date().getTime()
  while (true) {
    try {
      const rawResponse = await request(options)
  	  // writeLogEntry(moduleId,`Success : HTTP statusCode = ${response.statusCode}`);
	  // writeLogEntry(moduleId,`Response:\n"${JSON.stringify(response.toJSON()," ",2)}`)
	  
	  // elapsedTime is lost for PUT and POST when calling toJSON()
  	  const response = rawResponse.toJSON()
	  response.elapsedTime = rawResponse.elapsedTime
      return formatResponse(moduleId, response) 
    } catch (e) {
  	  const endTime = new Date().getTime();
   	  if (e.elapsedTime === undefined) {
	    e.elapsedTime = endTime - startTime
	  }
	  
      if ((e.statusCode === 500) && (retryCount < retryLimit)) {
		retryCount++
     	writeLogEntry(moduleId,`Error: ${e.statusCode}. Retry ${retryCount} in ${delay} ms.`);
        await timeout(delay);
		continue
	  }
	  
  	  if (typeof e.toJSON === 'function') {
        const elapsedTime = e.elapsedTime
	    e = e.toJSON()
	    e.elapsedTime = elapsedTime
	  }
	  // writeLogEntry(moduleId,`Exception ${e.statusCode}`);
   	  throw processError(moduleId,e);
	}
  }  
}

async function loadTheaters (sessionState, response, next) {

  const moduleId = `loadTheaters(${cfg.dataSources.emulate})`;
  writeLogEntry(moduleId);

  let theaterList = []
  try {  
    response.write(`{"status":[`) 
    if (cfg.dataSources.emulate) {
      theaterList = JSON.parse(fs.readFileSync(cfg.dataSources.emulation.theaters));
	}
	else {
      theaterList = await getTheaterInformation(constants.DB_LOGGING_DISABLED)
      // fs.writeFileSync(cfg.dataSources.emulation.theaters,JSON.stringify(theaterList,null,2));
    }
    response.write(`],`);
    let httpResponse = await movieAPI.recreateLoadTheaterCollection(sessionState,theaterList);
    // writeLogEntry(moduleId,`Response:\n${JSON.stringify(httpResponse," ",2)}`);
    // writeLogEntry(moduleId,`count = ${httpResponse.json.count}`);
    response.write(`"count":${httpResponse.json.count}`);
    response.write(`}`);
    httpResponse = await movieAPI.dropScreeningCollection(sessionState)
    response.end()
  } catch(e) {
	console.log(e)
    movieAPI.logError(e,generateSummary(theaterList));
    next(e)
  };
} 

async function loadMovies(sessionState, response, next) {

  const moduleId = `loadMovies(${cfg.dataSources.emulate})`;
  writeLogEntry(moduleId);
 
  let movieList = []
  
  try {
    // Response #1 Open Object, Output key "status" : Start Array
    response.write(`{"status":[`) 
    if (cfg.dataSources.emulate) {
      movieList = JSON.parse(fs.readFileSync(cfg.dataSources.emulation.movies));
	}
	else {
      movieList = await getMoviesFromTMDB(constants.DB_LOGGING_DISABLED,response)
      // fs.writeFileSync(cfg.dataSources.emulation.movies,JSON.stringify(movieList,null,2));
    }
    response.write(`],`);
    let httpResponse = await movieAPI.recreateLoadMovieCollection(sessionState,movieList)
    // writeLogEntry(moduleId,`Response:\n${JSON.stringify(httpResponse," ",2)}`);
    // writeLogEntry(moduleId,`count = ${httpResponse.json.count}`);
    response.write(`"count":${httpResponse.json.count}`);
	response.write(`}`);
    httpResponse = await movieAPI.dropPosterCollection(sessionState)
    httpResponse = await movieAPI.dropScreeningCollection(sessionState)
    response.end();	
  } catch (e) {
    movieAPI.logError(e,generateSummary(movieList));
    next(e)
  };
} 

async function loadScreenings (sessionState, response, next) {

  const moduleId = `loadScreenings(${cfg.dataSources.emulate})`;
  writeLogEntry(moduleId);
  
  try {
    const total = await createScreenings(constants.DB_LOGGING_DISABLED,response);
    response.write(`  , "count" : ${total}`)
    response.write(`}`);
    response.end()
  } catch(e) {
    next(e)
  };
} 
  
async function loadPosters(sessionState, response, next) {

  const moduleId = `loadPosters()`;
  writeLogEntry(moduleId);

  try {
    response.write(`{"status":[`) 
    const posterCount = await getPostersFromTMDB(constants.DB_LOGGING_DISABLED,response)
    response.write(`],`);
    response.write(`"count":${posterCount}`);
	response.write(`}`);
	response.end();
  } catch (e) {
    next(e)
  };
}

function usCensusGeocoding(address,benchmark) {

  const moduleId = `geocodeAddress("${address}",${benchmark})`;

  const options = {
    method  : 'GET'
  , uri     : cfg.dataSources.usCensus.protocol + '://' 
            + cfg.dataSources.usCensus.hostname + ':' 
            + cfg.dataSources.usCensus.port 
            + cfg.dataSources.usCensus.path
  , qs      : { format : "json", benchmark : benchmark, address : address}
  , json    : true
  , time    : true
  };
     
  return sendRequest(moduleId, options, LOW_RETRY_COUNT);  

}
   
function getGeoJSON(address, geocodingResults) {
   
  const coordinates = geocodeResult.addressMatches[0].coordinates;
  return { type        : "Point"
         , coordinates : [coordinates.y , coordinates.x]                                                                      
         }
}

async function geocodeUSCensus(address) {

  const moduleId = `geocodeAddress("${address}")`;

  let response = usCensusGeocoding(address,'Public_AR_Census2010')

  if (response.addressMatches.length > 0) {
    return getGeoJSON(address,response.json,benchmark);
  }

  response =  usCensusGeocoding(address,'Public_AR_ACS2015')
  if (response.addressMatches.length > 0) {
    return getGeoJSON(address,response.json,benchmark);
  }

  writeLogEntry(moduleId,`Unable to geocode address using US Census Bureau's geo-coding service`);
  return{}
  
}

function geocodeGoogleMaps(address) {

  return new Promise(function(resolve,reject) {
	
    googleMapsClient.geocode({address: address},
	  function(err, results) {
        if (err) {
	      reject(err)
        }
        else {
		  resolve(results)
        }
      })
  })
}  

async function geocodeGoogle(address) {
    
  const moduleId = `geocodeAddressGoogle("${address}")`;

  let response = {}
  
  if (cfg.dataSources.useProxy) {
    const options = { method  : 'GET'
                    , uri   : cfg.dataSources.google.geocoding.protocol + '://' 
                            + cfg.dataSources.google.geocoding.hostname + ':' 
                            + cfg.dataSources.google.geocoding.port 
                            + cfg.dataSources.google.geocoding.path 
                    , qs    : {key : cfg.dataSources.google.apiKey, address : address}
                    , json  : true
                    , time  : true
                    , proxy : `http://${cfg.dataSources.proxy.hostname}:${cfg.dataSources.proxy.port}`
                    }
       
    response = sendRequest(moduleId, options, NO_RETRY_OPERATIONS)
  }
  else {
    response = await geocodeGoogleMaps(address)
  }

  const location = response.json.results[0].geometry.location
  
  return { type        : "Point"
         , coordinates : [location.lng, location.lat]                                                                      
         }
				  
}

async function geocodeTheater(theater) {
    
  const moduleId = `geocodeTheater(${theater.id},${theater.name})`

  const address = theater.location.street + " " + theater.location.city + " " + theater.location.state + " " + theater.location.zipCode;
  // writeLogEntry(moduleId,`Address = "${address}".`);
  
  let geoCoding;
  
  switch (cfg.dataSources.geocodingService) {
    case "usCensus" :
	  try {
        geoCoding = await geocodeUSCensus(address)
        theater.location.geoCoding = geoCoding
        return theater;
      } catch (e) {
        writeLogEntry(moduleId,`Unable to get location for = "${address}" [USCensus].`);
        theater.location.geoCoding = {}
        return theater;
      };
      break;
    case "google" :
	  try {
        geoCoding = await geocodeGoogle(address)
        theater.location.geoCoding = geoCoding
        return theater;
      } catch (e) {
        console.log(e);
        writeLogEntry(moduleId,`Unable to get location for = "${address}". [Google]`);
        theater.location.geoCoding = {}
        return theater;
      };
      break;
    case "oracle" :
      // TODO : Add support for Oracle Geocoding Service
      writeLogEntry(moduleId,`Unable to get location for = "${address}". [Oracle]`);
      break;
    default :
      theater.location.geoCoding = {}
      return theater;
  }
}
    
function parseAddress(address) {
    
  let location = { address : address
                 , city : "unavailable"
                 , zipCode : 0
                 }
  
  const moduleId = `parseAddress("${address}")`;
  
  const parsedAddress = usAddressParser.parseLocation(address);

  let street    
  if (parsedAddress != null) {      
    if (parsedAddress.number) {
      street = parsedAddress.number;
      if (parsedAddress.prefix) {
        street = `${street} ${parsedAddress.prefix}`;
      }
      street = `${street} ${parsedAddress.street}`;
      if (parsedAddress.type) {
        street = `${street} ${parsedAddress.type}`;
      }
    }
    else {
      if (parsedAddress.street1) {
        street = parsedAddress.street1;
        if (parsedAddress.type1) {
            street = `${street} ${parsedAddress.type1}`;
        }
      }
    }
  
    if (street !== undefined) {                 
     location = { street      : street
                , city        : parsedAddress.city.toUpperCase() // Match the US Census geocoding service's behavoir
                , zipCode     : parsedAddress.zip
                , state       : parsedAddress.state
                , phoneNumber : null
                , geoCoding   : {}
                }
      }
  }
  else {
    writeLogEntry(moduleId,'Failed to parse address.');
  }

  return location;

}  

function generateTheater(item, index) {

  const moduleId = `generateTheater(${index})`     
  // writeLogEntry(moduleId);
      
  const name = item.title[0]
  let screenCount = name.match(/\d+$/);
      
  if (screenCount == null) {
    screenCount = getRandomBetweenValues(8,17)
  }

  const screens = []
  for (var i=0; i < screenCount; i++) {
    const screen = { id             : i+1
                   , capacity       : getRandomBetweenValues(64,129)
                   , features       : {
                       threeD       : false
                     , reserveSeats : false
                     }
                   , ticketPricing  : {
                       adultPrice   : 14.95
                     , childPrice   : 9.95
                     , seniorPrice  : 9.95
                     }
                   }
    screens.push(screen);
  }
      
  const location = parseAddress(item.description[0].substring(3,item.description[0].indexOf('</p>')));

  return { id       : index + 1
         , name     : name
         , location : location
         , screens  : screens
         }                         

}

function getTheatersFromFandango() {
  
  const moduleId = `getTheatersFromFandango()`;
  
  const options = { method  : 'GET'
                  , uri     : cfg.dataSources.fandango.protocol +'://'  
                              + cfg.dataSources.fandango.hostname + ':' 
                              + cfg.dataSources.fandango.port 
                              + cfg.dataSources.fandango.path 
                              + cfg.dataSources.fandango.searchCriteria.zipCode 
                              + '.rss'
                  , time    : true
  };
     
  return sendRequest(moduleId, options, NO_RETRY_OPERATIONS);  
     
}

async function getTheaterInformation() {
    
  const moduleId = `getTheaterInformation()`
    // writeLogEntry(moduleId,`Fetching Theaters`);
  
  // Generate a set of Theater documents from the Fandango TheatersNearMe RSS feed and geocode the results.
  
  const response = await getTheatersFromFandango()

  let  theaters = []
  xmlParser.parseString(
   response.body,
   function(err,jsonRSS) {
     theaters = jsonRSS.rss.channel[0].item
   }         
  );
	
  theaters = await Promise.all(theaters.map(generateTheater))
  writeLogEntry(moduleId,`Theater count: ${theaters.length}`);         

  // If $near is not supported then geocoding is irrelevant.
  if (movieAPI.getSupportedFeatures().$nearSupported) {
    // writeLogEntry(moduleId,`Attempting Geocoding`);
    theaters = await Promise.all(theaters.map(geocodeTheater)) 
    // writeLogEntry(moduleId,`Geocoding completed.`);
  }
  return theaters
}
    
async function getMoviesFromTMDB(sessionState,response) {

  const moduleId = `getMoviesFromTMDB()`;

  var movies = []
  var movieCache = [];
  
  // Limit Pages to 1000.
  var maxPageNumber = 1000;
  var pages = []
  
  var baseURL
  
  function getTMDBConfiguration() {
    
    const moduleId = `getTMDBConfiguration()`
  
    const options = { method  : 'GET'
                    , uri     : cfg.dataSources.tmdb.protocol + '://' 
                                + cfg.dataSources.tmdb.hostname + ':' 
                                + cfg.dataSources.tmdb.port 
                                + cfg.dataSources.tmdb.apiPath 
                                + '/configuration'
                    , qs      : { api_key : cfg.dataSources.tmdb.apiKey}
                    , json    : true
                    , time    : true
                    };
     
    return sendRequest(moduleId, options, NO_RETRY_OPERATIONS);  

  }
      
  function getCastMembers(cast) {
    
    return cast.map(function(castMember) {
                      return { name      : castMember.name
                             , character : castMember.character
                             }       
           })
  }
  
  function getCrewMembers(crew) {
    
    return crew.map(function(crewMember) {
                      return { name : crewMember.name
                             , job : crewMember.job
                             }       
                    })
  }
      
  function getMovieFromTMDB(movieId) {
    
    const moduleId = `getMovieFromTMDB(${movieId})`;
  
    const options = { method  : 'GET'
                    , uri     : cfg.dataSources.tmdb.protocol +'://' 
                                + cfg.dataSources.tmdb.hostname + ':' 
                                + cfg.dataSources.tmdb.port 
                                + cfg.dataSources.tmdb.apiPath 
                                + `/movie/${movieId}` 
                    , qs      : { api_key : cfg.dataSources.tmdb.apiKey, append_to_response : 'credits,releases'}
                    , json    : true
                    , time    : true
                    };

    return sendRequest(moduleId, options, NO_RETRY_OPERATIONS);  

  }
                           
  function isUnratedMovie(movieDetails) {

    let unrated = false
                                 
    movieDetails.releases.countries.forEach(function(release) {
                                              if ((release.iso_3166_1 === 'US') && (release.certification === 'NR')) {
                                                unrated = true;
                                              }
                                            })
         
    return unrated;
	
  }
                           
  async function createMovie(tmdbMovie) {

    const moduleId = `createMovie(${tmdbMovie.id})`;
    // writeLogEntry(moduleId);

    let httpResponse = await getMovieFromTMDB(tmdbMovie.id)
        
    const movieDetails = httpResponse.json;
            
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
      
      const movie = { id            : movieDetails.id
                    , title         : movieDetails.title
                    , plot          : movieDetails.overview
                    , runtime       : movieDetails.runtime
                    , posterURL     : baseURL
                                    + "w185"
                                    + movieDetails.poster_path
                                    + `?api_key=${cfg.dataSources.tmdb.apiKey}`
                   , castMember    : getCastMembers(movieDetails.credits.cast)
                   , crewMember    : getCrewMembers(movieDetails.credits.crew)
                   , releaseDate   : releaseDate
                   , certification : certification
                   }
      movieCache.push(movie);
    }
    else {
      writeLogEntry(moduleId,`Skipping unrated movie: ${movieDetails.title}`)
    }
  }

  function getMoviePage(pageNo) {
    
    const moduleId = `getMoviePage(${pageNo})`;
    
    const qs = { api_key                    : cfg.dataSources.tmdb.apiKey
               , "primary_release_date.gte" : cfg.dataSources.tmdb.searchCriteria.releaseDates.start
               , "primary_release_date.lte" : cfg.dataSources.tmdb.searchCriteria.releaseDates.end 
               , certification_country      : cfg.dataSources.tmdb.searchCriteria.country 
               , "certification.lte"        : cfg.dataSources.tmdb.searchCriteria.certification
               , original_language          : cfg.dataSources.tmdb.searchCriteria.language 
               , include_adult              : false
               , sort_by                    : 'popularity.desc'
               }

    if (pageNo > 0) {
      qs.page = pageNo
    }         

    const options = { method  : 'GET'
                    , uri     : cfg.dataSources.tmdb.protocol + '://' 
                                + cfg.dataSources.tmdb.hostname + ':' 
                                + cfg.dataSources.tmdb.port 
                                + cfg.dataSources.tmdb.apiPath 
                                + `/discover/movie` 
                    , qs      : qs
                    , json    : true
                    , time    : true
                    };

    return sendRequest(moduleId, options, NO_RETRY_OPERATIONS);  
  
  }

  async function getMovieDetails(movies, batchNo, batchSize, response) {

    const moduleId = `getMovieDetails(${batchNo})`;

    const batch = movies.splice(0,batchSize)
    writeLogEntry(moduleId,`Movies remaining = ${movies.length}`);
    
    const status = { date   : dateWithTZOffset(new Date())
                   , module : moduleId
                   , state  : "Processing"
                   , batch  : batchNo
                   }
		
    response.write(JSON.stringify(status));
    response.write(',');

    // Create a Batch of getMovieFromTMDB() operations.
    // writeLogEntry(moduleId,`Generating getMovieFromTMDB() operations.`);
        
    await Promise.all(batch.map(createMovie));
  }

  function processPage(httpResponse) {
    
    const moduleId = `processPage()`;

	httpResponse.json.results.forEach(
      function(m){
        if (movies.length === cfg.dataSources.tmdb.searchCriteria.movieLimit) {
          // writeLogEntry(moduleId,`Processing completed. ${cfg.dataSources.tmdb.searchCriteria.movieLimit} movies selected.`);
          pages.length = 0;
        }
        else {
          if (m.popularity > cfg.dataSources.tmdb.searchCriteria.popularity) {
            writeLogEntry(moduleId,`Adding ${m.title}`);
            movies.push(m);
          }
          else {
            // writeLogEntry(moduleId,`Processing completed. ${m.title} has popularity < ${cfg.dataSources.tmdb.searchCriteria.popularity}`);
            pages.length = 0;
          }
        }
	})
	  
  }

  function processPages(httpResponses) {
    
    const moduleId = `processPages()`;

    httpResponses.forEach(processPage)

  }     
    
  async function getMoviePageBatch(pages, batchNo, batchSize, response) {

    // Pages is an array of Page Numbers that need to be processed. Get Pages in Batches of 40. 
  
    const moduleId = `getMoviePageBatch(${batchNo})`;
    writeLogEntry(moduleId);

    var batch = pages.splice(0,batchSize)

    var status = {
        date   : dateWithTZOffset(new Date()),
        module : moduleId,
        state  : "Processing",
        batch  : batchNo
      }
    
    response.write(JSON.stringify(status));
    response.write(',');
  
    let httpResponses;
	
    httpResponses = await Promise.all(batch.map(getMoviePage));
    processPages(httpResponses); 	
  }

  writeLogEntry(moduleId);
  
  let httpResponse = await getTMDBConfiguration()
  baseURL = httpResponse.json.images.base_url

  // writeLogEntry(moduleId,'Poster URL = ` + baseURL);
  
  httpResponse = await getMoviePage(0)
  writeLogEntry(moduleId,`Page Count = ${httpResponse.json.total_pages}`);
  maxPageNumber = (httpResponse.json.total_pages > maxPageNumber ) ? maxPageNumber : httpResponse.json.total_pages;

  // Create an Array of Page Numbers

  for (var i=0; i < maxPageNumber; i++) {   
     pages.push(i+1)
  }

  var batchNo = 0;

  // Processing page '0' leads to duplicates
  // processPage(httpResponse);

  await timeout(10000);
  while (pages.length > 0) {
    writeLogEntry(moduleId,`(${batchNo}): Pages remaining = ${pages.length}`);
    batchNo++;
    var batchStartTime = Date.now();
    // TMDb throttles requests to 40 in 10 seconds. 
    // Each Page requires 1 request. 
	await getMoviePageBatch(pages, batchNo, 40, response)
    // If necessary wait for up to 10 seconds.
    // var batchEndTime = Date.now();
    // var timeRemaining = 10000 - (batchEndTime - batchStartTime);
    // if (timeRemaining > 0) {
    //   await timeout(timeRemaining);		
    // }
    await timeout(10000);
  }

  writeLogEntry(moduleId,`.getMoviePageBatch() operations complete. Movie count = ${movies.length}`);

  batchNo = 0;
  while (movies.length > 0) {
    writeLogEntry(moduleId,`(${batchNo}): Movies remaining ${movies.length}`);
    batchNo++;
    var batchStartTime = Date.now();
    // TMDb throttles requests to 40 in 10 seconds. 
    // Each Movie requires 2 requests. 
	await getMovieDetails(movies, batchNo, 20, response)
    // If necessary wait for up to 10 seconds.
    var batchEndTime = Date.now();
    var timeRemaining = 10000 - (batchEndTime - batchStartTime);
    if (timeRemaining > 0) {
      await timeout(timeRemaining);		
    }
  }

  writeLogEntry(moduleId,`.getMovieDetails() operations complete. Movie count ${movieCache.length}`);
     
  var status = {
        date   : dateWithTZOffset(new Date()),
        module : moduleId,
        state  : "Completed"
      }
     
  response.write(JSON.stringify(status))

  return movieCache	

}  
     
function getMoviePoster(movieId,posterURL) {
  
  const moduleId = `getMoviePoster(${movieId},"${posterURL}")`;
  // writeLogEntry(moduleId);

  if (posterURL.indexOf('/movieticket/poster/') == 0) {
    return {body : null};
  }

  const options = {
        method    : 'GET'
      , uri       : posterURL
      , encoding  : null
      , time      : true
      };

  return sendRequest(moduleId, options, NO_RETRY_OPERATIONS);  
  
}                         

async function getPostersFromTMDB(sessionState,response) {

  let movieItems = [];
  let posterCount = 0;
  
  async function getPosterFromTMDB(movieItem) {

    const moduleId = `getPosterFromTMDB(${movieItem.value.id})`;
	writeLogEntry(moduleId);
    const movie =  movieItem.value;
 
    let httpResponse = await getMoviePoster(movieItem.id, movie.posterURL)

    if (httpResponse.body != null) {
      posterCount++;
      // writeLogEntry(moduleId,"Poster size = " + httpResponse.body.length);

      httpResponse = await movieAPI.insertPoster(constants.DB_LOGGING_DISABLED, httpResponse.body)
      movie.externalURL = movie.posterURL
	  if (httpResponse.json.items) {
		movie.posterURL = `/movieticket/poster/${httpResponse.json.items[0].id}`;
	  }
	  else {
		console.log(JSON.stringify(httpResponse," ",2))
	  }
      await movieAPI.updateMovie(sessionState, movieItem.id, movie)
    }
    else {
      // Nothing to do - Poster URL has already been updated implying poster had already been loaded. Reload Movies before reloading posters.
	  // writeLogEntry(moduleId, "Id: " + movieItem.id + ", PosterURL[" + movie.posterURL +"]: Poster Skipped");
    }
  }
  
  async function getPosterBatchFromTMDB(movieItems, batchNo, batchSize, response) {
    
    var batch = movieItems.splice(0,batchSize)
     
    const moduleId = `getPosterBatchFromTMDB(${batchNo},${batch.length})`;
  
    var status = {
          date   : dateWithTZOffset(new Date())
        , module : 'getPosterBatchFromTMDB'
        , state  : "Processing"
        , batch  : batchNo
        }

	response.write(JSON.stringify(status));
    response.write(',');
   
    // Create a Batch of getPosterFromTMDB() operations.
    // writeLogEntry('getPosterBatchFromTMDB(${batchNo +'): Generating getPosterFromTMDB operations.');
      
    await Promise.all(batch.map(getPosterFromTMDB))
  }
      
  const moduleId = `getPostersFromTMDB{}`;

  const qbe = { posterURL : { '$ne' : null }}
  
  const httpResponse = await movieAPI.queryMovies(sessionState, qbe,'unlimited')
  movieItems = httpResponse.json.items;
  // writeLogEntry(moduleId,JSON.stringify(generateSummary(movieItems)));
  // writeLogEntry(moduleId,"Movie count = ` + movieItems.length);

  await movieAPI.recreatePosterCollection(sessionState)

  let batchNo = 0;
  const batchSize = 40;
	
  while (movieItems.length > 0) {
    writeLogEntry(moduleId,`Batch: ${batchNo}). Movies remaining ${movieItems.length}`);
    batchNo++;
	const batchStartTime = Date.now();
    getPosterBatchFromTMDB(movieItems, batchNo, batchSize, response);  
    // TMDb throttles requests to 40 in 10 seconds. Each batch makes 40 requests. If batch completed in less than 10 seconds wait		
    // await timeout(10000);		
	const batchEndTime = Date.now();
    const timeRemaining = 10000 - (batchEndTime - batchStartTime);
    if (timeRemaining > 0) {
      await timeout(timeRemaining);		
	}
  }	
    
  writeLogEntry(moduleId,`.getPosterFromTMDB() operations complete.`);
  const status = {
          date   : dateWithTZOffset(new Date())
        , module : 'getPosterBatchFromTMDB'
        , state  : "Completed"
        }
    
  response.write(JSON.stringify(status))
  return posterCount
}      
  
async function createScreenings(sessionState,response) {

  const moduleId = `createScreenings()`;
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

  writeLogEntry(moduleId,`Date Range is ${dateWithTZOffset(engagementStartDate)} thru ${dateWithTZOffset(engagementEndDate)}`);

  function generateShows(engagementStartDate, engagementEndDate, screen, theaterId, movieId, runtime) {
      
    const moduleId = `generateShows(${dateWithTZOffset(engagementStartDate)},${dateWithTZOffset(engagementEndDate)},${screen.id},${theaterId},${movieId},${runtime})`;
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

      // writeLogEntry('--->','Show Time Range is ${dateWithTZOffset(showTime) } thru ${dateWithTZOffset(tomorrow));
    
    while (showTime < engagementEndDate) {
      // writeLogEntry('--->','showTime= ` + showTime);
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
  
  function setMoviesInTheatersFlag(screenings) {
  
    const movieIdList = []
	screenings.forEach(function (screening) {
		                 if (!movieIdList.includes(screening.movieId)) {
						   movieIdList.push(screening.movieId)
						 }
	                   })
	
	movieList.forEach(function(movie) {
	                    for (let i in movieIdList) {
		                  if (movieIdList[i] === movie.id) {
		                    movie.inTheaters = true;
		                  } 
						}
	                  })

    let count = 0;
    movieList.forEach(function (movie) {
	                    if (movie.inTheaters) {		 
						  count ++
						}
	                  })
  }
  
  function generateScreeningsForTheater(theater, engagementStartDate, engagementEndDate, response) {
    
    const moduleId = `createScreenings().generateScreeningsForTheater(${theater.id})`;
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
    
  response.write(`{`);
  response.write(` "status"           : {`);
  response.write(`   "startTime"      : "${requestStartTime.toISOString()}"`);
  
  let httpResponse = await movieAPI.getTheaters(sessionState);
  elapsedTime = new Date().getTime() - requestStartTime.getTime();
  theaterList = httpResponse.json.items;
  response.write(` , "theaters"      : {`);
  response.write(`     "elapsedTime" : ${elapsedTime}`);
  response.write(`   , "count"       : ${theaterList.length}`);
  response.write(`   }`);

  writeLogEntry(moduleId,`.getTheaters(): ${elapsedTime} ms.`);

  const qbe = {"$query" : {}, $orderby :{"releaseDate" : -1}};
  httpResponse = await movieAPI.queryMovies(sessionState, qbe, 50)
  elapsedTime = new Date().getTime() - requestStartTime.getTime() - elapsedTime;
  movieList = httpResponse.json.items;
  response.write(` , "movies"      : {`);
  response.write(`     "elapsedTime" : ${elapsedTime}`);
  response.write(`   , "count"       : ${movieList.length}`);
  response.write(`   }`);
 
  writeLogEntry(moduleId,`.queryMovies(): ${elapsedTime} ms.`);
 
  movieList.forEach(function(movie) {
    movie.value.inTheaters = false;
  });

  if (cfg.dataSources.emulate) {
    screenings = JSON.parse(fs.readFileSync(cfg.dataSources.emulation.screenings));
    setMoviesInTheatersFlag(screenings)	
  }
  else {
    theaterList.forEach(function(theater) {
      generateScreeningsForTheater(theater,engagementStartDate,engagementEndDate,response)
    });
    // fs.writeFileSync(cfg.dataSources.emulation.screenings,JSON.stringify(screenings,null,2));
  }
	
  elapsedTime = new Date().getTime() - requestStartTime.getTime() - elapsedTime;
  response.write(` , "generateScreenings"      : {`);
  response.write(`     "elapsedTime" : ${elapsedTime}`);
  response.write(`   , "count"       : ${screenings.length}`);
  response.write(`   }`);

  writeLogEntry(moduleId,`.generateScreenings() : ${elapsedTime} ms.`);
    
  httpResponse = await movieAPI.recreateLoadScreeningCollection(sessionState,screenings)
  elapsedTime = new Date().getTime() - requestStartTime.getTime() - elapsedTime;
  const count = httpResponse.json.count;
  response.write(` , "recreateLoadScreeningCollection"      : {`);
  response.write(`   "elapsedTime" : ${elapsedTime}`);
  response.write(`   }`);
  writeLogEntry(moduleId,`.recreateLoadScreeningCollection() : ${elapsedTime} ms.`);

  // Don't log multiple movie update operations.
  
  httpResponse = await Promise.all(movieList.map(async function(movieItem) {
    return await movieAPI.updateMovie(constants.DB_LOGGING_DISABLED, movieItem.id, movieItem.value);
  }));

  elapsedTime = new Date().getTime() - requestStartTime.getTime() - elapsedTime;
  response.write(` , "updateMovie"      : {`);
  response.write(`     "elapsedTime" : ${elapsedTime}`);
  response.write(`   }`);
  response.write(` }`);
  writeLogEntry(moduleId,`.updateMovie(): ${elapsedTime} ms.`);
  return count;
	  
}