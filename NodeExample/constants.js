const SUCCESS   = +1  //HTTP(200)
const CREATED   = +2  //HTTP(201) 

const UNKNOWN_ERROR       = -1 
const NOT_FOUND           = -2 //HTTP(401)
const BAD_REQUEST         = -3 //HTTP(400)
const CONFLICTING_UPDATE  = -4 //HTTP(412)
const FATAL_ERROR         = -5 //HTTP(500)
const DUPLICATE_ENTRY     = -6 //HTTP(409)
const UNAUTHORIZED        = -7 //HTTP(401)
const DOCUMENT_TOO_LARGE  = -8 //HTTP(413)
const SYSTEM_UNAVAILABLE  = -9 //HTTP(503)

const DB_LOGGING_DISABLED   = { dbLoggingEnabled : false };
const DB_LOGGING_ENABLED    = { dbLoggingEnabled : true };

const HTTP_RESPONSE_SUCCESS = { statusCode         : 200
					          , elapsedTime        : 0
         					  , body               : ""
	  	        			  , headers            : { "content-type" : "application/json" }
	                          }

module.exports = {
  SUCCESS, CREATED, UNKNOWN_ERROR, NOT_FOUND, BAD_REQUEST, CONFLICTING_UPDATE, UNKNOWN_ERROR, DUPLICATE_ENTRY, FATAL_ERROR, UNAUTHORIZED, DOCUMENT_TOO_LARGE, SYSTEM_UNAVAILABLE, DB_LOGGING_DISABLED, DB_LOGGING_ENABLED, HTTP_RESPONSE_SUCCESS
}
