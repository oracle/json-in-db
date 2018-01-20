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

const path = require('path');
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const routes = require('./routes.js');
const serveStatic = require('serve-static');
const errorLibrary = require('./error_library.js');

const app  = express();

function writeLogEntry(module,comment) {
	
  const message = ( comment === undefined) ? module : module + ": " + comment
  console.log(new Date().toISOString() + ": index." + message);
}

function initApp() {

  const moduleId = 'initApp()';

  var port = process.env.PORT || 3000;
  
  var httpServer = http.Server(app);

  app.use(morgan('combined')); //logger
  app.use(bodyParser.json()); // for parsing application/json
  
  app.use(cookieParser());
  app.use(session({ secret: 'boo', resave: false, saveUninitialized: false}));

  app.use('/movieticket', routes.getRouter());

  // app.use('/frameworks', serveStatic(__dirname + '/node_modules'));  
  app.use('/frameworks', serveStatic(__dirname.substring(0, __dirname.lastIndexOf(path.sep))));

  app.use('/', serveStatic(__dirname + '/public'));

  app.use(handleError);
	
  app.use(function noCache(req, res, next) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    next();
  });
  
  httpServer.listen(port, function() {
    writeLogEntry(moduleId,'Listening on localhost:' + port);
  });
}

function handleError(err, req, res, next) {
  console.log('MovieTicketing : Operation Failed:');
  console.log( err.stack ? err.stack : err);
  if ((err instanceof errorLibrary.GenericException) || (err instanceof errorLibrary.ExternalError)) {
    console.log(JSON.stringify(err," ",2));
    // console.log(JSON.stringify(err.details))
  } 
  res.status(500).send({message: 'An error has occurred, please contact support if the error persists'});
  res.end();
}

process.on('unhandledRejection', (reason, p) => {
  console.log("Unhandled Rejection:\nPromise:\n ", p, "\nReason:");
  // application specific logging, throwing an error, or other logic here
  if ((reason instanceof errorLibrary.GenericException) || (reason instanceof errorLibrary.ExternalError)) {
    console.log(JSON.stringify(reason," ",2));
    // console.log(JSON.stringify(err.details))
  } 
  else {
	console.log(reason);
  }
  
});

initApp();

