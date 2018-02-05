package com.oracle.st.pm.json.movieTicketing.service;

import com.oracle.st.pm.json.movieTicketing.docStore.Movie;
import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.transientObjects.TheatersByMovie;

import java.io.IOException;

import java.sql.SQLException;

import java.text.ParseException;
import java.text.SimpleDateFormat;

import java.util.Date;
import java.util.StringJoiner;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class MovieService {

    private static final SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);

    public MovieService() {
        super();
    }

    public static String getMovies(OracleDatabase db) throws OracleException, IOException, SQLException {
        System.out.println(sdf.format(new Date()) + "[MovieService.getMovies()]: Started.");
        OracleDocument[] movies = Movie.getMovies(db);
        db.admin().getConnection().close();
        StringJoiner result = new StringJoiner(",", "[", "]");
        for (int i = 0; i < movies.length; i++) {
            result.add(Item.serializeAsItem(movies[i]));
        }
        System.out.println(sdf.format(new Date()) + "[MovieService.getMovies()]: Completed.");
        return result.toString();
    }

    public static String getMovie(OracleDatabase db, String key) throws OracleException, IOException, SQLException {
        System.out.println(sdf.format(new Date()) + "[MovieService.getMovie()]: Started.");
        OracleDocument movie = Movie.getMovie(db, key);
        db.admin().getConnection().close();
        System.out.println(sdf.format(new Date()) + "[MovieService.getMovie()]: Completed.");
        return movie.getContentAsString();
    }


    public static String getMovieById(OracleDatabase db, int id) throws OracleException, SQLException {
        System.out.println(sdf.format(new Date()) + "[MovieService.getMovieById()]: Started.");
        OracleDocument movie = Movie.getMovieById(db, id);
        db.admin().getConnection().close();
        System.out.println(sdf.format(new Date()) + "[MovieService.getMovieById()]: Completed.");
        return movie.getContentAsString();
    }

    public static String getTheatersByMovie(OracleDatabase db, String key, String date) throws SQLException,
                                                                                               IOException,
                                                                                               OracleException,
                                                                                               ParseException {
        System.out.println(sdf.format(new Date()) + "[MovieService.getTheatersByMovie()]: Started.");
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Date targetDate = sdf.parse(date);
        System.out.println(sdf.format(new Date()) + "[MovieService.getTheatersByMovie()]: Completed.");
        return new TheatersByMovie(db, key, targetDate).toJSON();
    }

    public static String searchMovies(OracleDatabase db, String qbe) throws OracleException, IOException, SQLException {
        System.out.println(sdf.format(new Date()) + "[MovieService.searchMovies()]: Started.");
        OracleDocument[] movies = Movie.searchMovies(db, qbe);
        db.admin().getConnection().close();
        StringJoiner result = new StringJoiner(",", "[", "]");
        for (int i = 0; i < movies.length; i++) {
            result.add(Item.serializeAsItem(movies[i]));
        }
        System.out.println(sdf.format(new Date()) + "[MovieService.searchMovies()]: Completed.");
        return result.toString();
    }


}
