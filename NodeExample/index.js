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

