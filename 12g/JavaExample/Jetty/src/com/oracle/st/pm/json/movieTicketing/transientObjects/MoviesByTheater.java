package com.oracle.st.pm.json.movieTicketing.transientObjects;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.docStore.Movie;
import com.oracle.st.pm.json.movieTicketing.docStore.Screening;
import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.docStore.Theater;
import com.oracle.st.pm.json.movieTicketing.qbe.BetweenOperator;
import com.oracle.st.pm.json.movieTicketing.qbe.InOperator;

import java.io.IOException;

import java.sql.SQLException;

import java.text.SimpleDateFormat;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class MoviesByTheater {

    private static final Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();

    private Theater theater;
    private MovieWithShowTimes[] movies;

    public class IdInList {
     
        InOperator id = null;
    

        
        private IdInList(int[] values) {
            id = new InOperator(values);  
        }
    }
    

    public class ShowingsByTheaterAndDate {

        private int theaterId;
        private BetweenOperator startTime;

        public ShowingsByTheaterAndDate(int theaterId, Calendar date) {
            this.theaterId = theaterId;

            SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);
            Calendar temp = (Calendar) date.clone();
            temp.set(Calendar.HOUR_OF_DAY, 0);
            temp.set(Calendar.MINUTE, 0);
            temp.set(Calendar.SECOND, 0);
            temp.set(Calendar.MILLISECOND, 0);
            String start = sdf.format(temp.getTime());
            temp.set(Calendar.HOUR_OF_DAY, 23);
            temp.set(Calendar.MINUTE, 59);
            temp.set(Calendar.SECOND, 59);
            temp.set(Calendar.MILLISECOND, 999);
            String end = sdf.format(temp.getTime());
            this.startTime = new BetweenOperator(start, end);
        }
    }

    private class MovieWithShowTimes {
        private Movie movie;
        private transient HashMap<Integer, Screen> screenList = new HashMap<Integer, Screen>();
        private Screen[] screens;

        private MovieWithShowTimes(Movie movie) {
            this.movie = movie;
        }

        private void addScreening(String key, Screening screening) {
            Screen screen = null;
            int screenId = screening.getScreenId();
            if (!this.screenList.containsKey(screenId)) {
                screen = new Screen(screenId);
                this.screenList.put(screenId, screen);
            } else {
                screen = this.screenList.get(screenId);
            }
            screen.addShowTime(key, screening);
        }

        private void fixLists() {
            this.screens = this.screenList.values().toArray(new Screen[0]);
            this.screenList = null;
            for (int i = 0; i < screens.length; i++) {
                screens[i].fixLists();
            }
        }
    }

    private class Screen {
        private int id;
        private transient List showTimeList = new ArrayList<ShowTime>();
        private ShowTime[] showTimes;

        private Screen(int id) {
            this.id = id;
        }

        private void addShowTime(String key, Screening screening) {
            this.showTimeList.add(new ShowTime(key, screening.getStartTime(), screening.getSeatsRemaining()));
        }

        private void fixLists() {
            this.showTimes = (ShowTime[]) this.showTimeList.toArray(new ShowTime[0]);
            this.showTimeList = null;
        }
    }

    private class ShowTime {
        private String id;
        private Date startTime;
        private int seatsRemaining;

        private ShowTime(String id, Date startTime, int seatsRemaining) {
            this.id = id;
            this.startTime = startTime;
            this.seatsRemaining = seatsRemaining;
        }
    }

    private void fixLists() {
        for (int i = 0; i < movies.length; i++) {
            movies[i].fixLists();
        }
    }

    public MovieWithShowTimes[] getShowTimesByTheaterAndDate(OracleDatabase db, Date date) throws OracleException,
                                                                                                  SQLException,
                                                                                                  IOException {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);

        // Use QBE to get the set of showings for the specifed Theater on the specified Date.

        ShowingsByTheaterAndDate qbeDefinition = (new ShowingsByTheaterAndDate(this.theater.getTheaterId(), cal));
        HashMap<Integer,MovieWithShowTimes> getMovieId = new HashMap<Integer,MovieWithShowTimes>();
        OracleDocument [] screeningDocuments = Screening.searchScreenings(db,gson.toJson(qbeDefinition));
        
        if (screeningDocuments.length > 0) {

          Screening[] screenings = new Screening[screeningDocuments.length];
          ArrayList<Integer> movieList = new ArrayList<Integer>();
          for (int i=0; i< screeningDocuments.length; i++) {
            screenings[i] = Screening.fromJSON(screeningDocuments[i].getContentAsString());
            if (!movieList.contains(screenings[i].getMovieId())) {
              movieList.add(screenings[i].getMovieId());
            }
          } 
        
          int[] movieIds = movieList.stream().mapToInt(Integer::intValue).toArray();                      
          Movie[] movies = Movie.toMovies(Movie.searchMovies(db, gson.toJson(new IdInList(movieIds))));                
        
          for (int i=0; i < movies.length; i++) {
            getMovieId.put(movies[i].getMovieId(),new MovieWithShowTimes(movies[i]));
          }
        
          for (int i=0; i < screenings.length;i++) {    
            getMovieId.get(screenings[i].getMovieId()).addScreening(screeningDocuments[i].getKey(),screenings[i]);
          }
        }
        
        db.admin().getConnection().close();
        return getMovieId.values().toArray(new MovieWithShowTimes[0]);
    }

    public MoviesByTheater(OracleDatabase db, String key, Date date) throws OracleException, IOException, SQLException {
        this.theater = Theater.fromJSON(Theater.getTheater(db, key).getContentAsString());
        this.theater.resetScreens();
        this.movies = getShowTimesByTheaterAndDate(db, date);
        fixLists();
    }

    public String toJSON() {
        return gson.toJson(this);
    }

}
