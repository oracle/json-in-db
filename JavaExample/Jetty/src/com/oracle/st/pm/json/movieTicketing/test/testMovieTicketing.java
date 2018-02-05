package com.oracle.st.pm.json.movieTicketing.test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.data.ExternalInterfaces;
import com.oracle.st.pm.json.movieTicketing.docStore.Movie;
import com.oracle.st.pm.json.movieTicketing.docStore.Screening;
import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.docStore.Theater;
import com.oracle.st.pm.json.movieTicketing.service.ApplicationStatusService;
import com.oracle.st.pm.json.movieTicketing.service.BookingService;
import com.oracle.st.pm.json.movieTicketing.service.MovieService;
import com.oracle.st.pm.json.movieTicketing.service.ScreeningService;
import com.oracle.st.pm.json.movieTicketing.service.TheaterService;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

import java.io.IOException;

import java.sql.SQLException;

import java.text.ParseException;

import java.util.HashMap;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

import oracle.xml.parser.v2.XMLParseException;
import oracle.xml.parser.v2.XSLException;

import org.xml.sax.SAXException;

public class testMovieTicketing {
    
    public testMovieTicketing() {
        super();
    }

    protected static final Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();
    
    protected static final HashMap<Integer,String> theaterList = new HashMap<Integer,String>();

    protected static final HashMap<Integer,String> movieList = new HashMap<Integer,String>();
    
    protected static String screeningId;

    public static void testExternalInterfaces(OracleDatabase db) throws SQLException, IOException, XMLParseException, SAXException,
                                                XSLException, OracleException, InterruptedException {
        
      ExternalInterfaces.loadTheatersFromFandango(db);
      ExternalInterfaces.loadMoviesFromTMDB(db);
      // ExternalInterfaces.loadPostersFromTMDB(db);
      ExternalInterfaces.generateScreenings(db);
    }
    
    public static void loadReferenceData(OracleDatabase db) throws OracleException, IOException {

      OracleDocument [] theaters = Theater.getTheaters(db);
      for (int i=0; i < theaters.length; i++ ) {
         theaterList.put(Theater.fromJSON(theaters[i].getContentAsString()).getTheaterId(),theaters[i].getKey()); 
      }
      
      OracleDocument [] movies = Movie.getMovies(db);
        for (int i=0; i < movies.length; i++ ) {
           movieList.put(Movie.fromJSON(movies[i].getContentAsString()).getMovieId(),movies[i].getKey()); 
        }

      OracleDocument [] screenings = Screening.searchScreenings(db,"{\"theaterId\":28,\"movieId\":336843,\"screenId\":1,\"startTime\":\"2018-01-31T12:20:00-08:00\"}");
      screeningId = screenings[0].getKey();
    }
      
    public static void testMovieTicketing() throws OracleException, IOException, SQLException, ParseException {

        OracleDatabase db = DBConnection.getOracleDatabase();
        ApplicationStatusService.getApplicationStatus(db);

        db = DBConnection.getOracleDatabase();
        TheaterService.getTheater(db, theaterList.get(new Integer(4)));
        
        db = DBConnection.getOracleDatabase();
        TheaterService.getTheaters(db);

        db = DBConnection.getOracleDatabase();
        TheaterService.getTheaterById(db, gson, 10);

        db = DBConnection.getOracleDatabase();
        TheaterService.searchTheaters(db, "{\"name\":{\"$regex\":\".*Theater.*\"}}");

        db = DBConnection.getOracleDatabase();
        TheaterService.getMoviesByTheater(db, theaterList.get(new Integer(4)),  "2018-01-31T13:47:55-08:00");

        db = DBConnection.getOracleDatabase();
        MovieService.getMovies(db);

        db = DBConnection.getOracleDatabase();
        MovieService.getMovie(db, movieList.get(399035));

        db = DBConnection.getOracleDatabase();
        MovieService.getMovieById(db, 399035);

        // MovieService.getMoviesInTheaters(db);

        db = DBConnection.getOracleDatabase();
        MovieService.getMovies(db);

        db = DBConnection.getOracleDatabase();
        MovieService.getTheatersByMovie(db, movieList.get(399035),  "2018-01-31T13:47:55-08:00");

        db = DBConnection.getOracleDatabase();
        MovieService.searchMovies(db, "{\"plot\":{\"$regex\":\".*bird.*\"}}");

        db = DBConnection.getOracleDatabase();
        ScreeningService.getScreening(db, screeningId);

        db = DBConnection.getOracleDatabase();
        BookingService.bookTickets(db, "{ \"key\" : \"" + screeningId + "\", \"customerId\" : 1, \"adult\" : 2, \"senior\" : null, \"child\" : null }");

        db = DBConnection.getOracleDatabase();
        ScreeningService.getScreening(db, screeningId);

        db = DBConnection.getOracleDatabase();
        // movieTicketing.logRecordsByOperationService(db, bookingOperationId);
        
    }

    public static void testScreenings(OracleDatabase db) throws OracleException, IOException {

       long count = Screening.getScreeningCount(db);
       System.out.println("Counted " + count + " Screening Documents.");
       OracleDocument[] results = Screening.getScreenings(db);
       System.out.println("Retrieved " + results.length + " Screening Documents.");
       results = Screening.getScreenings(db,1024);
       System.out.println("Retrieved " + results.length + " Screening Documents.");
       results = Screening.getScreenings(db,1);
       System.out.println("Retrieved " + results.length + " Screening Documents.");
    }
    
    public static void main(String[] args) {
        try {
            OracleDatabase db = DBConnection.getOracleDatabase();
            testExternalInterfaces(db);
            loadReferenceData(db);
            testMovieTicketing();
            db = DBConnection.getOracleDatabase();
            testScreenings(db);
            // testSpatial(sessionState)
        } catch (Exception e) {
            e.printStackTrace();
        }       
    }
}

/*
async function testSpatial(sessionState) {
   
  let results = await dbAPI.queryTheaters(sessionState,{"location.geoCoding":{"$near":{"$geometry":{"type":"Point","coordinates":[-122.12501110000001,37.895906]},"$distance":5,"$unit":"mile"}}})
  console.log(results.json);
 
}

*/
 