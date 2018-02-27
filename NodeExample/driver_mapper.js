"use strict";

module.exports.getDriverMapping            = getDriverMapping
module.exports.getDefaultDriver            = getDefaultDriver

const DEFAULT_DRIVER  = 'SODA_REST'

const DRIVER_MAPPINGS = { [DEFAULT_DRIVER]   : './soda_rest_api.js'
                        , SODA_REST          : './soda_rest_api.js'
                        , SODA_NATIVE        : './soda_native_api.js'
                        , MONGO              : './NoSQL/mongo_api.js'
                        , MONGO              : './NoSQL/mongo_api.js'
			, DYNAMO             : './NoSQL/dynamo_api.js'
			, COSMOS_NATIVE      : './NoSQL/cosmos_native_api.js'
			, COSMOS_REST        : './NoSQL/cosmos_rest_api.js'
			, COSMOS_MONGO       : './NoSQL/cosmos_mongo_api.js'
                        }

function getDefaultDriver() {
  return DRIVER_MAPPINGS[DEFAULT_DRIVER]
}

function getDriverMapping(driverName) {
  
  let driver = DRIVER_MAPPINGS[driverName]
  if (driver === undefined) {
	driver = getDefaultDriver()
  }
  return driver
}

