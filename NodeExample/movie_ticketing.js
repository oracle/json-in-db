var http = require('http');
var movieAPI = require('./movie_ticket_api.js');
var cfg = require('./config.js');

module.exports.theatersService               = theatersService;
module.exports.theaterByIdService            = theaterByIdService;
module.exports.searchTheatersService         = searchTheatersService;
module.exports.moviesByTheaterService        = moviesByTheaterService;
module.exports.moviesService                 = moviesService;
module.exports.movieByIdService              = movieByIdService;
module.exports.searchMoviesService           = searchMoviesService;
module.exports.theatersByMovieService        = theatersByMovieService;
module.exports.moviesInTheatersService       = moviesInTheatersService;
module.exports.screeningService              = screeningService
module.exports.bookTicketService             = bookTicketService;
module.exports.posterService                 = posterService;
module.exports.logRecordsByOperationService  = logRecordsByOperationService
                                             
module.exports.initializeSodaLogging         = initializeSodaLogging;
module.exports.setSessionState               = setSessionState;

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

function theatersService(sessionState, response, next) {

  console.log('movieTicketing.theatersService()');

  movieAPI.getTheaters(sessionState).then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 

function theaterByIdService(sessionState, response, next, id) {

  console.log('theaterService('+ id + ')');

  movieAPI.getTheaterById(sessionState, id).then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json.value);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 


function searchTheatersService(sessionState, response, next, qbe) {

  console.log('searchTheaterService(' + JSON.stringify(qbe) + ')');

  movieAPI.queryTheaters(sessionState, qbe).then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 

function moviesByTheaterService(sessionState, response, next, id, dateStr) {

  console.log('movieTicketing.moviesByTheaterService(' + id  + ',' + dateStr + ')');

  movieAPI.getTheater(sessionState, id).then(function (sodaResponse) {
    var theater = sodaResponse.json;
    delete(theater.screens);
    return getMoviesByTheaterAndDate(sessionState,theater,dateStr)
  }).then(function (moviesByTheater) {
    // console.log(JSON.stringify(moviesByTheater))     
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(moviesByTheater);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 

function moviesService(sessionState, response, next) {

  console.log('movieTicketing.moviesService()');

  movieAPI.getMovies(sessionState).then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json((sodaResponse.json));
    response.end();
  }).catch(function(e){
    next(e);
  });
} 

function movieByIdService(sessionState, response, next, id) {

  console.log('movieTicketing.movieService(' + id + ')');                                    

  movieAPI.getMovieById(sessionState, id).then(function (sodaResponse) {                                           
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json.value);                                      
    response.end();                                            
  }).catch(function(e){
    next(e);
  });
}                                                                                                                                    

function searchMoviesService(sessionState, response, next, qbe) {

  console.log('movieTicketing.searchMoviesService(' + JSON.stringify(qbe) + ')');

  movieAPI.queryMovies(sessionState, qbe).then(function (sodaResponse) {
    // console.log(JSON.stringify(sodaResponse));
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json);
    response.end();
  }).catch(function(e){
    next(e);
  });
} 

function theatersByMovieService(sessionState, response, next, id, dateStr) {
  
  console.log('movieTicketing.theatersByMovieService(' + id  + ',' + dateStr + ')');

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

  console.log('movieTicketing.moviesInTheatersService()');

  movieAPI.getMovies(sessionState).then(function (sodaResponse) {
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json((sodaResponse.json));
    response.end();
  }).catch(function(e){
    next(e);
  });
} 

function bookTicketService(sessionState, response, next, bookingRequest) {

  // console.log('movieTicketing.bookTicketService(' + JSON.stringify(bookingRequest) +')');
    
  movieAPI.getScreening(sessionState, bookingRequest.key).then(function(sodaResponse) {
    return bookTickets(sessionState, bookingRequest, sodaResponse.json, sodaResponse.headers.eTag) 
  }).then (function(bookingStatus) {
    // console.log('bookTicketService() : status = ' + JSON.stringify(bookingStatus));
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(bookingStatus);
    response.end();
  }).catch(function(e){
    next(e);
  });
 
}

function processScreeningsByTheaterAndDate(sessionState,sodaResponse) {
  
  var movies = [];
  
  function addScreeningDetails(screeningItem) {
  
    var movieId  = screeningItem.value.movieId;
    var screenId = screeningItem.value.screenId;
    
    // console.log('getMovieDetails(' + movieId + ',' + screenId + ')');
    
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

  // console.log('processScreeningsByMovieAndDate(sodaResponse.json.[' + sodaResponse.json.length + '])');
  
  // Transform the screenings into an array of Movies with the Screening information for each movie attached.
  
  sodaResponse.json.map(addScreeningDetails);
  
  return getMovieDetails(movies.map(getMovieIdList)).then(function(sodaResponse) {
    sodaResponse.json.map(processMovie);
    return movies
  }).catch(function(e){
    console.log('Broken Promise. processScreeningsByTheaterAndDate()');
    throw e
  })
}  

function getMoviesByTheaterAndDate(sessionState,theater, date) {

  var moviesByTheater = { 
    'theater' : theater,
    'movies' : []
  };

  // console.log('getMoviesByTheaterAndDate(' + theater.id + ',' + date + ')');

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

  return movieAPI.queryScreenings(sessionState, qbe).then(
    function(items) {
      return processScreeningsByTheaterAndDate(sessionState,items)
    }
  ).then( 
    function(movies) {
      moviesByTheater.movies = movies;
      return moviesByTheater;
    }
  )
}
  
function processScreeningsByMovieAndDate(sessionState,sodaResponse) {
  
  var theaters = [];

  function addScreeningDetails(screeningItem) {
  
    var theaterId = screeningItem.value.theaterId;
    var screenId  = screeningItem.value.screenId;

    // console.log('getTheaterDetails(' + theaterId + ',' + screenId + ')');
          
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

  // console.log('processScreeningsByMovieAndDate(sodaResponse.json.[' + sodaResponse.json.length + '])');
  
  // Transform the screenings into an array of Theaters with the Screening information for each theater attached.
  
  sodaResponse.json.map(addScreeningDetails);
  
  return getTheaterDetails(theaters.map(getTheaterIdList)).then(function(sodaResponse) {
    sodaResponse.json.map(processTheater);
    return theaters
  }).catch(function(e){
    console.log('Broken Promise. processScreeningsByMovieAndDate()');
    throw e
  })
}
  
function getTheatersByMovieAndDate(sessionState,movie, date) {

  var theatersByMovie = { 
    'movie' : movie,
    'theaters' : []
  };

  // console.log('getTheatersByMovieAndDate(' + movie.id + ',' + date + ')');

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

  return movieAPI.queryScreenings(sessionState, qbe).then(
    function(items) {
      return processScreeningsByMovieAndDate(sessionState,items)
    }
  ).then( 
    function(theaters) {
      theatersByMovie.theaters = theaters;
      return theatersByMovie;
    }
  )
}

function screeningService(sessionState, response, next, key) {

  console.log('screeningService(' + key + ')');

  movieAPI.getScreening(sessionState, key).then(function(sodaResponse) {
    // console.log(JSON.stringify(sodaResponse));
    response.setHeader('X-SODA-LOG-TOKEN',sessionState.operationId);
    response.json(sodaResponse.json);
    response.end();
  }).catch(function(e) {
    next(e);
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

function bookTickets(sessionState, bookingRequest, screening, eTag) {
    
  var booked = false;
  var key = bookingRequest.key;
  var totalTickets = bookingRequest.adult + bookingRequest.senior + bookingRequest.child;
    
  while (!booked) {
    // console.log('bookTickets().updateScreening(): Seats Required = ' + totalTickets + '. Seats Reamaining = ' + screening.seatsRemaining);
    if (screening.seatsRemaining < totalTickets) {
      return { 
        status : 'SoldOut',
        reason : 'Sorry there are only ' + screening.seatsRemaining + ' seats available for this performance.'
      }
    }
    else {
      screening.seatsRemaining = screening.seatsRemaining - totalTickets;
      return movieAPI.updateScreening(sessionState, key,screening, eTag).then(function(sodaResponse) {
        if (sodaResponse.statusCode == 200) {
          booked = true;
          // Seats were reserved successfully: Create Ticket Sale document.
          var ticketSale = makeTicketSale(bookingRequest, screening);
          return movieAPI.insertTicketSale(sessionState, ticketSale).then(function(sodaResponse) {
            // console.log('makeBooking().putTicketSale(): sodaResponse = ' + JSON.stringify(sodaResponse));
            if (sodaResponse.statusCode == 201) {
              // console.log('bookTickets().putTicketSales(): Sale sucessfully recorded.');
              return { 
                status  : "Booked",
                message : "Please enjoy your movie."
              }
            }
            else {
              return sodaResponse;
            }
          }).catch(function(err) {
            console.log('Broken Promise. makeBooking().putTicketSale()');
            throw err;
          })
        }
        else {
          if (sodaResponse.statusCode == 412) {
            // Screening has been updated. Re-read record and try again.
           return movieAPI.getScreening(sessionState, key).then(function(sodaResponse) {
             screening = sodaResponse.json, 
             eTag = sodaResponse.headers.eTag
           }).catch(function(err) {
             console.log('Broken Promise. makeBooking().getScreening(): ' + JSON.stringify(err))
             throw err;
           })
          }
          else {
          	var errorMsg = 'Broken Promise. makeBooking().updateScreening(): Unexpected HTTP Status. ' + JSON.stringify(status);
            console.log(errorMsg);
            throw errorMsg;
          }
        }
      }).catch(function(err) {
        console.log('Broken Promise. makeBooking()');
        throw err;
      })
    }
  }
}

function posterService(sessionState, response, next, key) {

  // console.log('posterService(' + key + ')');
  
  var sessionState = sodaLoggingDisabled;
  
  movieAPI.getPoster(sessionState, key).then(function(sodaResponse) {
    response.setHeader('content-type','image/jpeg');
    // console.log('posterService(' + key + '): Image Size = ' + sodaResponse.text.length);
    response.write(sodaResponse.text);
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

  // console.log('movieTicketing.logRecordsByOperationService(' + id + ')');   
                                 
  movieAPI.getLogRecordByOperationId(id).then(function (sodaResponse) { 
    // console.log(JSON.stringify(sodaResponse.json))
    response.json(sodaResponse.json);                                      
    response.end();                                            
  }).catch(function(e){
    next(e);
  });
}                                                                                                                                    
