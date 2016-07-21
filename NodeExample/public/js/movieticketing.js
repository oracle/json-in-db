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

var GUID = generateGUID();

function loadTestData(URL, button) {

  if (button.classList.contains('disabled')) {
  	return
  }
  else {
  	button.getElementsByTagName('span')[0].classList.add('spinning')
  	button.classList.add('disabled')
  }
  
  var status = document.getElementById('status' + button.id.substr(3))
  status.textContent = 'Working';
  
 	var callback = function(XHR,URL,button) {
  	var status = document.getElementById('status' + button.id.substr(3))
  	button.getElementsByTagName('span')[0].classList.remove('spinning')
    button.classList.remove('disabled');
    if (XHR.status == 200) {
    	result = JSON.parse(XHR.responseText)
      status.textContent = 'Success: Loaded ' + result.count + ' documents.';
    }
    else {
    	status.textContent = 'Failed: Status = ' + XHR.status + ' (' + XHR.statusText + ').';
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

function loadTheaters(button) {

  var URL = '/movieticket/config/loadtheaters';
  loadTestData(URL,button);
   
}

function loadMovies(button) {

  var URL = '/movieticket/config/loadmovies';
  loadTestData(URL,button);
  
}

function loadPosters(button) {

  var URL = '/movieticket/config/loadposters';
  loadTestData(URL,button);
  
}

function generateScreenings(button) {

  var URL = '/movieticket/config/loadscreenings';
  loadTestData(URL,button);
  
}

var app = angular.module('movieTicketing', ['ngCookies']);

app.factory('bookingService', function($http) {

	var factory = {};
	
	factory.screening = {};
	factory.screeningLogRecord = null;
	factory.id = null;
	
	factory.getBookingInfo = function (id) {
 
     factory.id = id;
     
	 	 showBookingForm();

	 	 var path = '/movieticket/screenings/' + id
    
     $http.get(path).success(function(data,status, headers) {
       factory.screening = data;
   	   var path = '/movieticket/movieticketlog/operationId/'+ headers('X-SODA-LOG-TOKEN')
       $http.get(path).success(function(data, status, headers) {
    	   factory.screeningLogRecord = data
    	   // console.log(JSON.stringify(factory.screeningLogRecord));
       });
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
  	  $http.post(path,transaction).success(function(data, status, headers) {
  	  	hideBookingForm();
  	  	if (data.status == "Booked") {
  	  		showSuccessMessage(data.message);
  	  	}
  	  	else {
  	  	  showErrorMessage(data.message);
  	  	}
    	  var path = '/movieticket/movieticketlog/operationId/'+ headers('X-SODA-LOG-TOKEN')
        $http.get(path).success(function(data, status, headers) {
    	    factory.bookingLogRecord = data
    	    factory.bookingLogDate = new Date();
    	    // console.log(JSON.stringify(factory.bookTicketsLogRecord));
       });
  	  })	
    }
  }
  return factory;
});

app.controller('bookingCtrl',function($scope, $http, bookingService) {

  $scope.bookingService = bookingService;
    				    				
});

app.factory('theaterService', function($http) {
	
	var factory = {};
	
	factory.theaters = [];
	factory.logRecordIndex = 0;
	factory.logRecord = null;

  factory.searchTheaters = function(name,city,zipCode) {

		 var qbe = {}
		 
		 if (name) {
		 	 qbe.name = { '$contains' : name };
		 }
		 
		 if (city) {
		   qbe['location.city'] = city.toUpperCase();
		 }
		 
 		 if (zipCode) {
		   qbe['location.zipCode'] = zipCode;
		 }
  	   	 
  	 var path = '/movieticket/theaters/search/qbe';

     $http.post(path,qbe).success(function(data, status, headers) {
       factory.theaters = data;     
    	 var path = '/movieticket/movieticketlog/operationId/'+ headers('X-SODA-LOG-TOKEN')
       $http.get(path).success(function(data, status, headers) {
    	   factory.logRecord = data
    	   // console.log(JSON.stringify(factory.logRecord));
       });
     });
	}
  
	factory.moviesByTheater = [];
	factory.mbtLogRecord = null;
	
	factory.getMoviesByTheater = function (theaterId) {
   	 var date = new Date($('#datePicker').datepicker('getUTCDate'));
   	 if (date == 'Invalid Date') {
   	 	 showErrorMessage('Please select date');
   	 	 return;
   	 }
	 	 
	 	 showMoviesByTheater();
	 	 
	 	 var path = '/movieticket/theaters/' + theaterId + '/movies/' + dateWithTZOffset(date);
     $http.get(path).success(function(data, status, headers) {
     	 factory.moviesByTheater = data;
    	 var path = '/movieticket/movieticketlog/operationId/'+ headers('X-SODA-LOG-TOKEN')
       $http.get(path).success(function(data, status, headers) {
    	   factory.mbtLogRecord = data
    	   // console.log(JSON.stringify(factory.mbtLogRecord));
       });
     });
  };
  
  factory.showNextLogEntry = function() {
  	factory.logRecordIndex++;
  };

  factory.showPrevLogEntry = function() {
  	factory.logRecordIndex--;
  };
      				    				  
  return factory;
});


app.controller('theatersCtrl',function($scope, $http, $cookies, theaterService) {

  $cookies.put('movieTicketGUID', GUID)

  $scope.theaterService = theaterService;

  $http({
    method: 'GET',
    url: '/movieticket/theaters/',
  }).success(function(data, status, headers) {
 	  $scope.theaterService.theaters = data;
	  var path = '/movieticket/movieticketlog/operationId/'+ headers('X-SODA-LOG-TOKEN')
    $http.get(path).success(function(data, status, headers) {
    	 $scope.theaterService.logRecord = data
    	 // console.log(JSON.stringify($scope.theaterService.logRecord));
    });
  });
      				
});

app.controller('searchTheatersCtrl',function($scope, $http, theaterService) {

  $scope.theaterService = theaterService;
  		    				
});

app.controller('moviesByTheaterCtrl',function($scope, $http, theaterService, bookingService) {

  $scope.now = new Date()
  $scope.now = dateWithTZOffset($scope.now);
  $scope.theaterService = theaterService;
  $scope.bookingService = bookingService;
  
  $scope.$watch(
    'bookingService.bookingLogDate',
    function updateLogRecord(newValue, oldValue) {
    	if (newValue != oldValue) {
        $scope.theaterService.mbtLogRecord = $scope.bookingService.bookingLogRecord;
      }
    }
  );
  				    				
});

app.factory('movieService', function($http, $cookies) {

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
 		var searchValue = { '$contains' : what };
  	   	 
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

    $http.post(path,qbe).success(function(data, status, headers) {
      factory.movies = data;    
    	 var path = '/movieticket/movieticketlog/operationId/'+ headers('X-SODA-LOG-TOKEN')
       $http.get(path).success(function(data, status, headers) {
    	   factory.logRecord = data
    	   // console.log(JSON.stringify(factory.logRecord));
       });
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
     $http.get(path).success(function(data,status,headers) {
       factory.theatersByMovie = data;
    	 var path = '/movieticket/movieticketlog/operationId/'+ headers('X-SODA-LOG-TOKEN')
       $http.get(path).success(function(data, status, headers) {
    	   factory.tbmLogRecord = data
    	   // console.log(JSON.stringify(factory.factory.tbmLogRecord));
       });
     });
  };
  
  factory.showNextLogEntry = function() {
  	factory.logRecordIndex++;
  };

  factory.showPrevLogEntry = function() {
  	factory.logRecordIndex--;
  };

  return factory;
});

app.controller('moviesCtrl',function($scope, $http,  $cookies, movieService) {

  $scope.movieService = movieService;
  
  $cookies.put('movieTicketGUID', GUID)

  $http({
    method : 'GET',
    url    : '/movieticket/movies/',
  }).success(function(data, status, headers) {
 	  $scope.movieService.movies = data;
	  var path = '/movieticket/movieticketlog/operationId/'+ headers('X-SODA-LOG-TOKEN')
    $http.get(path).success(function(data, status, headers) {
    	 $scope.movieService.logRecord = data
    	 // console.log(JSON.stringify($scope.movieService.logRecord));
    });
  });
    				    				
});

app.controller('searchMoviesCtrl',function($scope, $http, movieService) {

  $scope.movieService = movieService;
    		    				
});

app.controller('theaterByMovieCtrl',function($scope, $http, movieService, bookingService) {

  $scope.now = new Date()
  $scope.now = dateWithTZOffset($scope.now);
  $scope.movieService = movieService;
  $scope.bookingService = bookingService;
  
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
	$('#tabset_MovieTickets').on(
	  'shown.bs.tab', 
	  function (e) {
	  	var tabTarget = e.target.href.substring(e.target.href.indexOf('#')+1);
	  	if ((tabTarget == 'tab_TheaterList') || (tabTarget == 'tab_MovieList') || (tabTarget == 'tab_LoadTestData')) {
	  		hideDetailTabs()
	    }	
  })
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

function hideBookingForm() {
	
  $('#dialog_PurchaseTickets').modal('hide');

}

function hideDetailTabs() {

	$('#tabset_MovieTickets a[href="#tab_MoviesByTheater"]').hide();
  $('#tabset_MovieTickets a[href="#tab_TheatersByMovie"]').hide();
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