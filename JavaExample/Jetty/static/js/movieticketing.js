function getPosterTimeout() {
  const maxMovies = 1000;
  // return Batches (Movies / Requests) * Wait (10s) * 1000 (Milliseconds);
  var timeout = (maxMovies/40) * 10 * 1000;
  return timeout;
}

function getMovieTimeout() {
  const maxMovies = 1000;
  // return Batches (Movies / Requests) * Wait (10s) * 1000 (Milliseconds) * Passes
  var timeout = (maxMovies/20) * 10 * 1000 * 2;
  return timeout;
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

const GUID = generateGUID();

function loadTestData(URL, button) {

  if (button.classList.contains('disabled')) {
  	return
  }
  else {
  	button.getElementsByTagName('span')[0].classList.add('spinning')
  	button.classList.add('disabled')
  }

  var status = document.getElementById('status' + button.id.substr(3))
  status.value = 'Working';

 	var callback = function(XHR,URL,button) {
  	var status = document.getElementById('status' + button.id.substr(3))
  	button.getElementsByTagName('span')[0].classList.remove('spinning')
    button.classList.remove('disabled');
    if (XHR.status == 200) {
    	result = JSON.parse(XHR.responseText)
      status.value = 'Success: Loaded ' + result.count + ' documents.';
    }
    else {
    	status.value = 'Failed: Status = ' + XHR.status + ' (' + XHR.statusText + ').';
    }
  }

  XHR = new XMLHttpRequest()
  XHR.open('GET',URL,true)
  XHR.setRequestHeader('Pragma','no-cache');
  XHR.onreadystatechange = function() {
    if (XHR.readyState==4) {
      callback(XHR,URL,button);
    }
  };
  XHR.send()

}

const app = angular.module('movieTicketing', ['ngCookies']);

app.factory('bookingService', function($http) {

	var factory = {};

	factory.screening = {};
	factory.screeningLogRecord = null;
	factory.id = null;

	factory.getBookingInfo = function (id) {

     factory.id = id;

	 	 showBookingForm();

	 	 var path = '/movieticket/screenings/' + id

     $http.get(path).then(function(response) {
       factory.screening = response.data;
   	   var logToken = response.headers('X-SODA-LOG-TOKEN')
   	   if (logToken != null) {
   	     var path = '/movieticket/movieticketlog/operationId/' + logToken;
         $http.get(path).then(function(response) {
    	     factory.screeningLogRecord = response.data
    	     // console.log(JSON.stringify(factory.screeningLogRecord));
         },function (response) {
     			 showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
		     });
		   }
		 },function (response) {
			 showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
     });
  };

  factory.bookingLogRecord = null;
  factory.bookingLogDate = new Date()

  factory.bookTickets = function (adult,senior,child) {
  	var totalTickets = 0;

		totalTickets = parseInt(adult) + parseInt(senior) + parseInt(child);

  	if (totalTickets > factory.screening.seatsRemaining) {
  	  showErrorMessage('Sorry cannot fulfill request: Only ' + factory.screening.seatsRemaining + ' tickets remain for this show.');
  	}
  	else {
  		var transaction = {
  			key        : factory.id,
  			customerId : 1,
  			adult      : parseInt(adult),
  			senior     : parseInt(senior),
  			child      : parseInt(child)
  		}
  	  var path = '/movieticket/bookTickets';
  	  $http.post(path,transaction).then(function(response) {
  	  	hideBookingForm();
  	  	if (response.data.status == "Booked") {
  	  		showSuccessMessage(response.data.message);
  	  	}
  	  	else {
  	  	  showErrorMessage(response.data.message);
  	  	}
    	  var logToken = response.headers('X-SODA-LOG-TOKEN')
   	    if (logToken != null) {
   	      var path = '/movieticket/movieticketlog/operationId/' + logToken
          $http.get(path).then(function(response) {
      	    factory.bookingLogRecord = response.data
      	    factory.bookingLogDate = new Date();
      	    // console.log(JSON.stringify(factory.bookTicketsLogRecord));
          },function (response) {
     			  showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
		      });
		    }
		  },function (response) {
  			showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
      });
    }
  }
  return factory;
});

app.controller('bookingCtrl',function($scope, $http, bookingService) {

  $scope.bookingService = bookingService;

});

app.factory('appConfigService', function($http, $window) {

	var factory = {};

	factory.status = {}
    factory.mbtLogRecord = null;
	
	factory.applicationReady = false;

	factory.openLinkInWindow = function(link,target) {
		window.open(link,target)
  }

  factory.isApplicationReady = function() {
  
  	var ready = (
		   (factory.status.movieCount > 0 )
		   && 
		   (factory.status.theaterCount > 0)
 	     && 
 	     (factory.status.screeningCount > 0) 
			 && 
			 (factory.status.posterCount > 0)
		);
		
		if (ready) {
		  if (factory.status.mappingService === 'google') {
			  ready = factory.status.geocgoogleKey !== 'YOUR_GOOGLE_KEY_GOES_HERE'
		  }
		  if (!ready) {
	    	showErrorMessage('A valid Google API key is required to use Google mapping services');
		  }
	  }
	  
	  return ready;
	}
  
  factory.updateTheaterCount = function (theaterCount) {
  	factory.status.theaterCount = theaterCount;
  	factory.status.screeningCount = 0;
  	// Cannot run Application at this point
  }

  factory.updateMovieCount = function (movieCount) {
  	factory.status.movieCount = movieCount;
  	factory.status.screeningCount = 0;
  	factory.status.posterCount = 0;
  	// Cannot run Application at this point
  }

  factory.updatePosterCount = function (posterCount) {
  	factory.status.posterCount = posterCount;
  	// If all keys and data are now present reload the application - This will show the application tabs with the current data.
  	if (factory.isApplicationReady()) {
  		 $window.location.reload();
    }
  }

  factory.updateScreeningCount = function (screeningCount) {
  	factory.status.screeningCount = screeningCount;
  	// If all keys and data are now present reload the application - This will show the application tabs with the current data.
  	if (factory.isApplicationReady()) {
  		 $window.location.reload();
    }
  }

  factory.loadSampleData = function(url,button,callback,target,timeout) {

    if (button.classList.contains('disabled')) {
    	return
    }
    else {
  	  button.getElementsByTagName('span')[0].classList.add('spinning')
  	  button.classList.add('disabled')
    }

    var statusWindow = document.getElementById('status' + button.id.substr(3))
    statusWindow.value = 'Working';

    $http.get(url,{ timeout : timeout}).then(function(response) {
 	  button.getElementsByTagName('span')[0].classList.remove('spinning')
      button.classList.remove('disabled');
      statusWindow.value = 'Documents: ' + response.data.count;
      callback(response.data.count);
    },function(response) {
 	  button.getElementsByTagName('span')[0].classList.remove('spinning')
      button.classList.remove('disabled');
      statusWindow.value = 'Failed. Status: ' + response.status;
      showErrorMessage("Error invoking service " + url + ". Status: " + response.status );
    })
  }

  factory.loadTheaters = function (event) {

  	factory.loadSampleData('/movieticket/config/loadtheaters',event.target,factory.updateTheaterCount,'Theaters',120000);

  }

  factory.loadMovies = function (event) {

  	factory.loadSampleData('/movieticket/config/loadmovies',event.target,factory.updateMovieCount,'Movies',getMovieTimeout());

  }

  factory.loadPosters = function (event) {

  	factory.loadSampleData('/movieticket/config/loadposters',event.target,factory.updatePosterCount,'Posters',getPosterTimeout());

  }

  factory.generateScreenings = function (event) {

  	factory.loadSampleData('/movieticket/config/loadscreenings',event.target,factory.updateScreeningCount,'Screenings',240000);

  }

	return factory;

});


/* 
**
** Geocoding is only enabled when $near operator is supported. If $near is not a supported feature then there is no point in geocoding the Theaters.
**
** Mapping Service is enabled when $near operator is supported and Geocoding Service is not 'none'
**
** Google Key is enabled when $near operator is supported and Geocoding is 'google' or Geocoding is enabled and Mapping is 'google'.
**
** Do not update Geocoding Service, Mapping Service or Google key unless they are enabled.
**
**
*/

app.controller('appConfigCtrl',function($scope, $http, appConfigService) {
	
	$scope.appConfigService = appConfigService;

	/* 
	**
	**
	** Use an object to avoid issues with referencing scope variables from an ng-if, due to ng-if generating it's own scope.
	**
	*/
	
	$scope.formState = {
		googleKey        : ""
	, geocodingService : ""
	, mappingService   : ""
	, tmdbKey          : ""
  }

  var path = "/movieticket/application/status/";

  $http.get(path).then(function(response) {  	

		// console.log(JSON.stringify(response.data));

    if ((response.data.currentPosition.coords.latitude !== 0) || (response.data.currentPosition.coords.longitude !== 0)) {
    	
    	// Current Position initially defined as center of theaters. If browser location services are enabled reset to actual location.
    	 
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
      	  if (position.coords.latitude) {
      	    response.data.simulatedPosition =  {
      	    	coords      : {
      	    	  latitude  : response.data.currentPosition.coords.latitude
      	    	, longitude : response.data.currentPosition.coords.longitude
      	      }
      	    }
      	  	response.data.currentPosition.coords.latitude = position.coords.latitude;
      	  	response.data.currentPosition.coords.longitude = position.coords.longitude;
          }
        });
	    }
	  }

 	  $scope.appConfigService.status = response.data

 	  if (response.data.googleKey !== 'YOUR_GOOGLE_KEY_GOES_HERE') {
 	  	$scope.formState.googleKey = response.data.googleKey;
	    initGoogleMaps(response.data.googleKey);
 	  }
 	  else {
 	    $('#tabset_MovieTickets a[href="#tab_LoadTestData"]').tab('show');
    }

 	  if (response.data.tmdbKey !== 'YOUR_TMDB_KEY_GOES_HERE') {
 	  	$scope.formState.tmdbKey = response.data.tmdbKey;
 	  }
 	  
 	  $scope.formState.mappingService = (response.data.mappingService ? response.data.mappingService : "none" );
 	  $scope.formState.geocodingService = (response.data.geocodingService ? response.data.geocodingService : "none" );
 	  
 	  if ($scope.appConfigService.isApplicationReady()) {
 	  	$scope.appConfigService.applicationReady = true;
 	  	enableApplication();
 	 	} 
 	 	else {
 	  	enableConfiguration();
    } 	 		
  },function (response) {
  			showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
  });

  $scope.updateDataSources = function (googleKey, tmdbKey, geocodingSvc, mappingSvc) {
  
  		/*
  		**
  		** Update Rules.
  		**
  		** Always update TMDb Key.
  		**
  		** Do not update Google Key, Geocoding Service or Mapping Service unless the $near operator is supported
  		**
  		** When the $hear operator is supported
  		**
  		**   Always update Geocoding Service.
  		**
  		** 	 Only update Google Key when a Google Services is selected.
  		**
  		**   Only update Mapping Service when Geocoding Service is not 'none'
  		**
  		*/
  		
      var updates = {
        tmdb      : {
      	  apiKey  : tmdbKey
      	}
		  }
      
      if ($scope.appConfigService.status.supportedFeatures.$near) {

       	updates.geocodingService = geocodingSvc;
       	
       	if ((geocodingSvc == 'google') || ((geocodingSvc !== 'none')  && (mappingSvc === 'google'))) {
      	  updates.google = {
      	  	apiKey  : googleKey
          }
        }
      	
      	if (geocodingSvc !== 'none') {
				  updates.mappingService = mappingSvc;
		    }
      }

      var path = '/movieticket/application/dataSources';
      $http.post(path, updates).then(function (response) {
      	// Saving the Keys enables the Load Theaters and Load Movies Buttons.
      	$scope.appConfigService.status.googleKey = googleKey;
      	$scope.appConfigService.status.tmdbKey = tmdbKey;
      	$scope.appConfigService.status.geocodingService = geocodingSvc;
      	$scope.appConfigService.status.mappingService = mappingSvc;
 				initGoogleMaps(googleKey);
				$scope.config.$setPristine()
      	// If all data is available switch to Application Screen.
		 	  if ($scope.appConfigService.isApplicationReady()) {
		 	  	$scope.appConfigService.applicationReady = true;
 	  			enableApplication();
 	  		} 				
      },function (response) {
  			showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
      });
  };
  
});

app.factory('theaterService', function($http, appConfigService) {

	var factory = {};

	factory.theaters = [];
  factory.theaterMap = null;
	factory.logRecordIndex = 0;
	factory.logRecord = null;

  factory.searchTheaters = function(name,city,zipCode) {

		 var qbe = {}

		 if (name) {
   		 if (appConfigService.status.supportedFeatures.$contains) {
 		     qbe.name = { '$contains' : name };
 		   }
       else {
      	 qbe.name = { '$regex' : '.*' + name + '.*'};
       }
     }

		 if (city) {
		   qbe['location.city'] = city.toUpperCase();
		 }

 		 if (zipCode) {
		   qbe['location.zipCode'] = zipCode;
		 }

  	 var path = '/movieticket/theaters/search/qbe';

     $http.post(path,qbe).then(function(response) {
       factory.theaters = response.data;
    	 var logToken = response.headers('X-SODA-LOG-TOKEN');
   	   if (logToken != null) {
   	     var path = '/movieticket/movieticketlog/operationId/' +  logToken;
         $http.get(path).then(function(response) {
      	   factory.logRecord = response.data
      	   // console.log(JSON.stringify(factory.logRecord));
         },function (response) {
     			 showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
		     });
		   }
		 },function (response) {
     	 showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
     });
	}

	factory.moviesByTheater = [];
	factory.mbtLogRecord = null;

  factory.addMarkersToMap = function(data) {
	  for (var i=0; i < data.length; i++) {
  	  var marker = new google.maps.Marker({
       	position: {lat: data[i].value.location.geoCoding.coordinates[1] , lng: data[i].value.location.geoCoding.coordinates[0]},
        map: factory.theaterMap,
        title: data[i].value.name,
        id : data[i].id
      });
      marker.addListener('click', function() {
        this.map.setZoom(10);
        this.map.setCenter(marker.getPosition());
        $('#dialog_locateTheaters').modal('hide');
        factory.getMoviesByTheater(this.id);
      });
    }
  }
  
	factory.showNearbyTheaters = function (status)  {

		var maplocation = status.currentPosition;

		factory.theaterMap = showLocationOnMap(maplocation);

    var path = '/movieticket/theaters/latitude/' + maplocation.coords.latitude + '/longitude/' + maplocation.coords.longitude + '/distance/5';

    $http.get(path).then(function(response) {
  	  if (response.data.length > 0) {
  	  	factory.addMarkersToMap(response.data);
      	var logToken = response.headers('X-SODA-LOG-TOKEN');
    	  if (logToken != null) {
   	      var path = '/movieticket/movieticketlog/operationId/' + logToken; 
          $http.get(path).then(function(response) {
      	    factory.logRecord = response.data
      	    // console.log(JSON.stringify(factory.logRecord));
          },function (response) {
      			showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
		      });
		    }
      }
      else {
     		console.log('theaterService: showNearbyTheaters():  No theaters found within 5 Miles of actual location [' + maplocation.coords.latitude + ',' + maplocation.coords.longitude + '].');
     		mapLocation = status.simulatedPosition;
			  var path = '/movieticket/theaters/latitude/' + maplocation.coords.latitude + '/longitude/' + maplocation.coords.longitude + '/distance/5';
	      $http.get(path).then(function(response) {
		  	  if (response.data.length > 0) {
  			   	factory.addMarkersToMap(data);
          	var logToken = response.headers('X-SODA-LOG-TOKEN');
        	  if (logToken != null) {
       	      var path = '/movieticket/movieticketlog/operationId/' + logToken; 
              $http.get(path).then(function(response) {
          	    factory.logRecord = response.data
        	      // console.log(JSON.stringify(factory.logRecord));
              },function (response) {
                showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
		          });
		        }
         	}
         	else {
						console.log('theaterService: showNearbyTheaters():  No theaters found within 5 Miles of simulated location [' + maplocation.coords.latitude + ',' + maplocation.coords.longitude + '].');
          }
	  	  },function (response) {
          showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
        });
      }
   	},function (response) {
      showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
    });
  }

	factory.getMoviesByTheater = function (theaterId) {
   	 var date = new Date($('#datePicker').datepicker('getUTCDate'));
   	 if (date == 'Invalid Date') {
   	 	 showErrorMessage('Please select date');
   	 	 return;
   	 }

	 	 showMoviesByTheater();

	 	 var path = '/movieticket/theaters/' + theaterId + '/movies/' + dateWithTZOffset(date);
     $http.get(path).then(function(response) {
     	 factory.moviesByTheater = response.data;
    	 var logToken = response.headers('X-SODA-LOG-TOKEN');
   	   if (logToken != null) {
   	     var path = '/movieticket/movieticketlog/operationId/' +  logToken;
         $http.get(path).then(function(response) {
      	   factory.mbtLogRecord = response.data
      	   // console.log(JSON.stringify(factory.mbtLogRecord));
         },function (response) {
           showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
 	     });
		   }
		 },function (response) {
       showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
     });
  };

  factory.showNextLogEntry = function() {
  	factory.logRecordIndex++;
  };

  factory.showPrevLogEntry = function() {
  	factory.logRecordIndex--;
  };

  factory.getQueryString = function(qs) {
  	return getQueryString(qs);
  }

  factory.isObject = function (obj) {
  	return angular.isObject(obj);
  }

  return factory;
});


app.controller('theatersCtrl',function($scope, $http, $cookies, theaterService, appConfigService) {

  $cookies.put('movieTicketGUID', GUID)

  $scope.theaterService = theaterService;
  $scope.appConfigService = appConfigService
  
  $scope.$watch(appConfigService.isApplicationReady,function (newValue, oldValue) {
  	// console.log('theatersCtrl.isApplicationReady: ' + newValue);
   	if (newValue) {
      var path = "/movieticket/theaters/";
  
      $http.get(path).then(function(response) {
        $scope.theaterService.theaters = response.data;
        var logToken = response.headers('X-SODA-LOG-TOKEN');
   	    if (logToken != null) {
   	      var path = '/movieticket/movieticketlog/operationId/' +  logToken;
          $http.get(path).then(function(response) {
    	      $scope.theaterService.logRecord = response.data
    	      // console.log(JSON.stringify($scope.theaterService.logRecord));
          },function (response) {
      	    showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
		      });
		    }
	    },function (response) {
        showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
      });	 
    }
  })

});

app.controller('searchTheatersCtrl',function($scope, $http, theaterService) {

  $scope.theaterService = theaterService;

});

app.controller('moviesByTheaterCtrl',function($scope, $http, theaterService, bookingService, appConfigService) {

  $scope.now = new Date()
  $scope.now = dateWithTZOffset($scope.now);

  $scope.theaterService   = theaterService;
  $scope.bookingService   = bookingService;
  $scope.appConfigService = appConfigService

  $scope.$watch(
    'bookingService.bookingLogDate',
    function updateLogRecord(newValue, oldValue) {
    	if (newValue != oldValue) {
        $scope.theaterService.mbtLogRecord = $scope.bookingService.bookingLogRecord;
      }
    }
  );

});

app.factory('movieService', function($http, $cookies, appConfigService) {

	var factory = {};

	factory.movies = [];
  factory.logRecordIndex = 0;
	factory.logRecord = null;

  factory.searchMovies = function(where, what) {

 		// alert('movieService.searchMovies(' + where + ',' + what + ')');

 		if (!(where) || !(what)) {
 			showErrorMessage('Enter Search Criteria!');
 		  return;
 		}

    var qbe = {};
    var searchValue = {}

    if (appConfigService.status.supportedFeatures.$contains) {
 		  searchValue = { '$contains' : what };
    }
    else {
    	searchValue = { '$regex' : '.*' + what + '.*' };
    }
    
  	if (where == 'Title') {
  	  qbe = { title : searchValue }
  	}
  	else if (where == 'Plot') {
  	  qbe = { plot : searchValue }
  	}
  	else if (where == 'CastAndCrew') {
  		 qbe = {'$or' : [{'castMember.*' : searchValue}, { 'crewMember.*' : searchValue}]}
  	}
  	else if (where == 'Anywhere') {
  		 qbe = {'$or' : [{title : searchValue}, {outline : searchValue },{'castMember.*' : searchValue}, { 'crewMember.*' : searchValue}]}
  	}

  	var path = '/movieticket/movies/search/qbe';

    $http.post(path,qbe).then(function(response) {
      factory.movies = response.data;
    	var logToken = response.headers('X-SODA-LOG-TOKEN');
     	if (logToken != null) {
   	    var path = '/movieticket/movieticketlog/operationId/' +  logToken;
        $http.get(path).then(function(response) {
    	    factory.logRecord = response.data
    	    // console.log(JSON.stringify(factory.logRecord));
        },function (response) {
        	showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
		    });
	 	  }
	  },function (response) {
      showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
    });	 
	}

	factory.theatersByMovie = [];
	factory.tbmLogRecord = null;

	factory.getTheatersByMovie = function (movieId) {
    var date = new Date($('#datePicker').datepicker('getUTCDate'));
    if (date == 'Invalid Date') {
   	  showErrorMessage('Please select date');
   	 	return;
   	}

	 	showTheatersByMovie();

	 	var path = '/movieticket/movies/' + movieId + '/theaters/' + dateWithTZOffset(date);
    $http.get(path).then(function(response) {
      factory.theatersByMovie = response.data;
    	var logToken = response.headers('X-SODA-LOG-TOKEN');
     	if (logToken != null) {
   	    var path = '/movieticket/movieticketlog/operationId/' +  logToken;
        $http.get(path).then(function(response) {
      	  factory.tbmLogRecord = response.data
    	    // console.log(JSON.stringify(factory.factory.tbmLogRecord));
        },function (response) {
        	showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
		    });
	 	  }
	  },function (response) {
      showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
    });	 
  };

  factory.showNextLogEntry = function() {
  	factory.logRecordIndex++;
  };

  factory.showPrevLogEntry = function() {
  	factory.logRecordIndex--;
  };

  factory.getQueryString = function(qs) {
  	return getQueryString(qs);
  }

  factory.isObject = function (obj) {
  	return angular.isObject(obj);
  }

  return factory;
});

app.controller('moviesCtrl',function($scope, $http,  $cookies, movieService, appConfigService) {

  $scope.movieService = movieService;
  $scope.appConfigService = appConfigService

  $cookies.put('movieTicketGUID', GUID)

  $scope.$watch(appConfigService.isApplicationReady,function (newValue, oldValue) {
  	// console.log('moviesCtrl.isApplicationReady: ' + newValue);
    if (newValue) {
      var path = "/movieticket/movies/";

      $http.get(path).then(function(response) {
 	      $scope.movieService.movies = response.data;
  	    var logToken = response.headers('X-SODA-LOG-TOKEN');
   	    if (logToken != null) {
   	      var path = '/movieticket/movieticketlog/operationId/' +  logToken;
          $http.get(path).then(function(response) {
      	    $scope.movieService.logRecord = response.data
        	  // console.log(JSON.stringify($scope.movieService.logRecord));
          },function (response) {
          	showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
	  	    });
		    }
	    },function (response) {
        showErrorMessage("Error invoking service " + path + ". Status: " + response.status );
      });	 
    }
  });
});

app.controller('searchMoviesCtrl',function($scope, $http, movieService) {

  $scope.movieService = movieService;

});

app.controller('theaterByMovieCtrl',function($scope, $http, movieService, bookingService, appConfigService) {

  $scope.now = new Date()
  $scope.now = dateWithTZOffset($scope.now);

  $scope.movieService     = movieService;
  $scope.bookingService   = bookingService;
  $scope.appConfigService = appConfigService

  $scope.$watch(
    'bookingService.bookingLogDate',
    function updateLogRecord(newValue, oldValue) {
    	if (newValue != oldValue) {
        $scope.movieService.tbmLogRecord = $scope.bookingService.bookingLogRecord;
      }
    }
  );

});

function formLoad() {

	$('#datePicker').datepicker();
	$('#datePicker').datepicker('update', new Date());
	/*
	$('#tabset_MovieTickets').on(
	  'shown.bs.tab',
	  function (e) {
	  	var tabTarget = e.target.href.substring(e.target.href.indexOf('#')+1);
	  	if ((tabTarget == 'tab_TheaterList') || (tabTarget == 'tab_MovieList') || (tabTarget == 'tab_LoadTestData')) {
	  		hideDetailTabs()
	    }
  })
  */
}

function showMoviesByTheater() {

	$('#tabset_MovieTickets a[href="#tab_MoviesByTheater"]').show();
	$('#tabset_MovieTickets a[href="#tab_MoviesByTheater"]').tab('show');
  $('#tabset_MovieTickets a[href="#tab_TheatersByMovie"]').hide();
  // $('#dialog_PurchaseTickets').modal('hide');

}

function showTheatersByMovie() {

	$('#tabset_MovieTickets a[href="#tab_MoviesByTheater"]').hide();
  $('#tabset_MovieTickets a[href="#tab_TheatersByMovie"]').show();
  $('#tabset_MovieTickets a[href="#tab_TheatersByMovie"]').tab('show');
  // $('#dialog_PurchaseTickets').modal('hide');

}

function showBookingForm() {

	$('#adultTickets').val("");
  $('#seniorTickets').val("");
  $('#childTickets').val("");
  $('#dialog_PurchaseTickets').modal('show');

}

function enableConfiguration() {

	$('#tabset_MovieTickets a[href="#tab_TheaterList"]').hide();
  $('#tabset_MovieTickets a[href="#tab_MovieList"]').hide();
  $('#tabset_MovieTickets a[href="#tab_LoadTestData"]').show();
	$('#tabset_MovieTickets a[href="#tab_MoviesByTheater"]').hide();
  $('#tabset_MovieTickets a[href="#tab_TheatersByMovie"]').hide();

  $('#tabset_MovieTickets a[href="#tab_LoadTestData"]').tab('show');

}

function enableApplication() {

	$('#tabset_MovieTickets a[href="#tab_TheaterList"]').show();
  $('#tabset_MovieTickets a[href="#tab_MovieList"]').show();
  $('#tabset_MovieTickets a[href="#tab_LoadTestData"]').show();
	$('#tabset_MovieTickets a[href="#tab_MoviesByTheater"]').hide();
  $('#tabset_MovieTickets a[href="#tab_TheatersByMovie"]').hide();

  $('#tabset_MovieTickets a[href="#tab_TheaterList"]').tab('show');

}

function hideBookingForm() {

  $('#dialog_PurchaseTickets').modal('hide');

}

function hideDetailTabs() {

  // $('#dialog_PurchaseTickets').modal('hide');

}

function showTheaterSearch() {

  $('#dialog_SearchTheaters').modal('show');

}

function showMovieSearch() {

  $('#dialog_SearchMovies').modal('show');

}

function showSuccessMessage(message) {

	document.getElementById('content_SuccessMessage').textContent = message
  $('#dialog_SuccessMessage').modal('show');

}

function showErrorMessage(message) {

	document.getElementById('content_ErrorMessage').textContent = message
  $('#dialog_ErrorMessage').modal('show');

}

function initGoogleMaps(apikey) {

  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src  = 'https://maps.googleapis.com/maps/api/js'
              + '?' + 'key=' + apikey
              // + '&' + 'callback=' + 'googleMapsReady'
  document.body.appendChild(script);

}

function googleMapsReady() {

	console.log('Google maps loaded');

}

function showCurrentPosition() {

	navigator.geolocation.getCurrentPosition(showLocationOnMap,geoLocationError);

}

function showLocationOnMap(position) {

	if (position.coords === undefined) {
	  showErrorMessage('Sorry current position not yet available. Please try again in 30 seconds');
	  return null;
	}

  $('#dialog_locateTheaters').modal('show');

  var theaterMap = new google.maps.Map(
                  document.getElementById('map'),
                  {
                    center: {
                             	lat: position.coords.latitude ,
                             	lng: position.coords.longitude
                            },
          					zoom: 10
        					});

	$("#dialog_locateTheaters").on("shown.bs.modal", function () {
		map
    google.maps.event.trigger(theaterMap, "resize");
    var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		theaterMap.panTo(myLatlng);
  });

  var marker = new google.maps.Marker({
    position: {lat: position.coords.latitude , lng: position.coords.longitude},
    map: theaterMap,
    title: 'Your Location'
  });

  return theaterMap;

}

function geoLocationError(e) {
	switch(error.code)
        {
            case error.PERMISSION_DENIED: console.log("geoLocationError(): User did not share geolocation data");
            break;
            case error.POSITION_UNAVAILABLE: console.log("geoLocationError(): Could not detect current position");
            break;
            case error.TIMEOUT: console.log("geoLocationError(): Timeout while retrieving position");
            break;
            default: console.log("geoLocationError(): Unknown Error");
            break;
        }
}

function getQueryString(qs) {
	var queryString = "";
	if (typeof qs === 'object') {
	  Object.keys(qs).forEach(function(key,index) {
		  queryString += encodeURIComponent(key) + "=" + encodeURIComponent(qs[key]) + "&"
    })
  }

  if (queryString.length > 0) {
    queryString = "?" + queryString.substring(0,queryString.length-1);
  }

  return queryString

}