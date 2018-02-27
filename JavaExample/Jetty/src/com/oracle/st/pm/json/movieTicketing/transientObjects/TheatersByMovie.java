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

public class TheatersByMovie {

    private static final Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();

    private Movie movie;
    private TheaterWithShowTimes[] theaters;

    public class IdInList {
     
        InOperator id = null;
 
        private IdInList(int[] values) {
            id = new InOperator(values);  
        }
    }
    
    public class ShowingsByMovieAndDate {

        private int movieId;
        private BetweenOperator startTime;

        public ShowingsByMovieAndDate(int movieId, Calendar date) {
            this.movieId = movieId;

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

    private class TheaterWithShowTimes {
        private Theater theater;
        private transient HashMap<Integer, Screen> screenList = new HashMap<Integer, Screen>();
        private Screen[] screens;

        private TheaterWithShowTimes(Theater theater) {
            this.theater = theater;
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
        for (int i = 0; i < theaters.length; i++) {
            theaters[i].fixLists();
        }
    }

    public TheaterWithShowTimes[] getShowTimesByMovieAndDate(OracleDatabase db, Date date) throws OracleException,
                                                                                                  SQLException,
                                                                                                  IOException {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);

        // Use QBE to get the set of showings for the specifed Theater on the specified Date.

        ShowingsByMovieAndDate qbeDefinition = (new ShowingsByMovieAndDate(this.movie.getMovieId(), cal));
        HashMap<Integer,TheaterWithShowTimes> theatersWithShowTimes = new HashMap<Integer,TheaterWithShowTimes>();
        OracleDocument [] screeningDocuments = Screening.searchScreenings(db,gson.toJson(qbeDefinition));
        if (screeningDocuments.length > 0) {
          Screening[] screenings = new Screening[screeningDocuments.length];
          ArrayList<Integer> theaterList = new ArrayList<Integer>();
          for (int i=0; i< screeningDocuments.length; i++) {
            screenings[i] = Screening.fromJSON(screeningDocuments[i].getContentAsString());
            if (!theaterList.contains(screenings[i].getTheaterId())) {
              theaterList.add(screenings[i].getTheaterId());
            }
          } 
        
          int[] theaterIds = theaterList.stream().mapToInt(Integer::intValue).toArray();                      
          Theater[] theaters = Theater.toTheaters(Theater.searchTheaters(db, gson.toJson(new IdInList(theaterIds))));                
        
          for (int i=0; i < theaters.length; i++) {
            theatersWithShowTimes.put(theaters[i].getTheaterId(),new TheaterWithShowTimes(theaters[i]));
          }
        
          for (int i=0; i < screenings.length;i++) {    
            theatersWithShowTimes.get(screenings[i].getTheaterId()).addScreening(screeningDocuments[i].getKey(),screenings[i]);
          }
        }
        db.admin().getConnection().close();
        return theatersWithShowTimes.values().toArray(new TheaterWithShowTimes[0]);
    }

    public TheatersByMovie(OracleDatabase db, String key, Date date) throws OracleException, IOException, SQLException {
        this.movie = Movie.fromJSON(Movie.getMovie(db, key).getContentAsString());
        this.theaters = getShowTimesByMovieAndDate(db, date);
        fixLists();
    }

    public String toJSON() {
        return gson.toJson(this);
    }

}
