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

const express = require('express');
const cookieParser = require('cookie-parser');
const movieTicketing = require('./movie_ticketing.js');
const externalInterfaces = require('./external_interfaces.js');

function setSessionId(cookies,sessionState) {
  
  movieTicketing.setSessionState(cookies,sessionState);

}

function initializeApplication(sessionState) {
  
  movieTicketing.initialize(sessionState)
  sessionState.save();

}

function getRouter() {

  const router = express.Router();
    
  router.use(function initalizeSession(req, res, next) {
    setSessionId(req.cookies,req.session);
    initializeApplication(req.session);
    next();
  });

  router.route('/theaters').get(getTheaters);

  router.route('/theaters/:key').get(getTheaters);

  router.route('/theaters/id/:id').get(getTheaterById);

  router.route('/theaters/search/qbe').post(searchTheaters);

  router.route('/theaters/:id/movies/:date').get(getMoviesByTheater);

  router.route('/theaters/latitude/:latitude/longitude/:longitude/distance/:distance').get(getTheatersByLocation);

  router.route('/movies').get(getMovies);

  router.route('/movies/:key').get(getMovies);

  router.route('/movies/id/:id').get(getMovieById);

  router.route('/movies/search/qbe').post(searchMovies);

  router.route('/movies/:id/theaters/:date').get(getTheatersByMovie);

  router.route('/screenings/:key').get(getScreenings);

  router.route('/bookTickets').post(postBookTicket);

  router.route('/poster/:key').get(getPoster);

  router.route('/config/loadMovies').get(getLoadMovies);

  router.route('/config/loadTheaters').get(getLoadTheaters);

  router.route('/config/loadScreenings').get(getLoadScreenings);

  router.route('/config/loadPosters').get(getLoadPosters);

  router.route('/application/status').get(getApplicationStatus);

  router.route('/application/dataSources').post(postDataSources);

  router.route('/movieticketlog/operationId/:id').get(getLogRecordsByOperation);

  return router;
}

module.exports.getRouter = getRouter;

function getTheaters(req, res, next) {
  if (req.params.key) {
    movieTicketing.theaterService(req.session, res, next, req.params.key);
  } 
  else {
    movieTicketing.theatersService(req.session, res, next);
  }
}

function getTheaterById(req, res, next) {
  movieTicketing.theaterByIdService(req.session, res, next, req.params.id);
}

function searchTheaters(req, res, next) {
  movieTicketing.searchTheatersService(req.session, res, next, req.body);
}

function getTheatersByLocation(req, res, next) {
  movieTicketing.locateTheatersService(req.session, res, next, parseFloat(req.params.latitude), parseFloat(req.params.longitude), parseFloat(req.params.distance));
}

function getTheatersByMovie(req, res, next) {
  movieTicketing.theatersByMovieService(req.session, res, next, req.params.id, req.params.date);
}

function getMoviesByTheater(req, res, next) {
  movieTicketing.moviesByTheaterService(req.session, res, next, req.params.id, req.params.date);
}

function getMovies(req, res, next) {
  if (req.params.key) {
      movieTicketing.movieService(req.session, res, next, req.params.key);
  }
  else {
    // movieTicketing.moviesService(req.session, res, next);
    movieTicketing.moviesByReleaseDateService(req.session, res, next);
  }
}

function getMovieById(req, res, next) {
  movieTicketing.movieByIdService(req.session, res, next, req.params.id);
}

function searchMovies(req, res, next) {
  movieTicketing.searchMoviesService(req.session, res, next, req.body);
}


function getScreenings(req, res, next) {
  if (req.params.key) {
    movieTicketing.screeningService(req.session, res, next, req.params.key);
  } 
  else {
    movieTicketing.screeningsService(req.session, res, next);
  }
}

function getPoster(req, res, next) {
  movieTicketing.posterService(req.session, res, next, req.params.key);
}
function postBookTicket(req, res, next) {
  movieTicketing.bookTicketService(req.session, res, next, req.body)
}

function getLoadMovies(req, res, next) {
  externalInterfaces.loadMovies(req.session, res, next);
}

function getLoadTheaters(req, res, next) {
  externalInterfaces.loadTheaters(req.session, res, next)
}

function getLoadScreenings(req, res, next) {
  externalInterfaces.loadScreenings(req.session, res, next)
}

function getLoadPosters(req, res, next) {
  externalInterfaces.loadPosters(req.session, res, next)
}

function getLogRecordsByOperation(req, res, next) {
  movieTicketing.logRecordsByOperationService(req.session, res, next, req.params.id);
}

function getApplicationStatus(req, res, next) {
  movieTicketing.applicationStatusService(req.session, res, next);
}

function postDataSources(req, res, next) {
  movieTicketing.updateDataSourcesService(req.session, res, next, req.body)
}
