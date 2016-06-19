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
 
var http = require('http');
var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var routes = require('./routes.js');
var serveStatic = require('serve-static');
var sodaRest = require('./soda-rest.js');
var externalInterfaces = require('./external_interfaces.js');

var app;

function initApp() {

  app = express();
  var port = 3000;
  
  httpServer = http.Server(app);

  app.use(morgan('combined')); //logger
  app.use(bodyParser.json()); // for parsing application/json
  
  app.use(cookieParser());
  app.use(session({ secret: 'boo', resave: false, saveUninitialized: false}));

  app.use('/movieticket', routes.getRouter());

  app.use('/frameworks', serveStatic(__dirname + '/node_modules'));  

  app.use('/', serveStatic(__dirname + '/public'));

  app.use(handleError);

  httpServer.listen(port, function() {
      console.log('MovieTicket Webserver listening on localhost:' + port);
  });
}

function handleError(err, req, res, next) {
	  console.error('MovieTicketing : Operation Failed:');
    console.error( err.stack ? err.stack : err);
    console.log(err);
    if ((err instanceof sodaRest.SodaError) || (err instanceof externalInterfaces.ExternalError)) {
      console.error(JSON.stringify(err.details))
    } 
    res.status(500).send({message: 'An error has occurred, please contact support if the error persists'});
}

process.on('unhandledRejection', (reason, p) => {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging, throwing an error, or other logic here
});

initApp();

