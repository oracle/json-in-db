const http = require('http')
const express = require('express')
var bodyParser = require('body-parser');
var cors = require('cors')
var oracledb = require('oracledb')
const muserver = require('../exports/server')
const muhealth = require('./health')
const mustory = require('../core/stories')
const db = require('../core/db')

const app = express()

const port = muserver.port

// Enable JSON body parser
app.use(bodyParser.json())

// Enable All CORS Requests
app.use(cors())

// Setup route handlers
app.use('/stories/health', muhealth)
app.use('/stories', mustory)

// Setup default server error handler
app.use(function (err, request, response, next) {
  if (response.headersSent) {
    return next(err); // Not if already sent
  }
  // Error is due to a server issue, so send code 500
  console.log('> Internal server error, responding with HTTP code 500.')
  response.status(500).json({"message":"An internal error occured in stories server"})
})

// Start listening
var server = app.listen(port, async function () {
  try {
    // If instant client directory specified, use it
    if (process.platform === 'darwin' && muserver.instantClientDir)
      oracledb.initOracleClient({libDir: muserver.instantClientDir});
    await db.initialize();
    await db.ping();
    console.log("> MuSprint stories service listening at http://localhost:%s/stories/", port);
  }
  catch (err) {
    console.error(err);
    process.kill(process.pid, 'SIGTERM');
  }
});

// Close database connection pool and service
async function terminateApp() {
  try {
    await db.terminate();
    server.close();
    console.log("> MuSprint stories service shutdown");
  }
  catch (err) {
    // Catch error and issue SIGTERM
    console.error(err);
  }
}

// Handle signals for graceful shutdown
process
  .once('SIGTERM', terminateApp)
  .once('SIGINT',  terminateApp);