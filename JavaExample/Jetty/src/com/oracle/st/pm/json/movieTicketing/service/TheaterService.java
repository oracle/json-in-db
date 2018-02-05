package com.oracle.st.pm.json.movieTicketing.service;

import com.google.gson.Gson;

import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.docStore.Theater;
import com.oracle.st.pm.json.movieTicketing.transientObjects.MoviesByTheater;

import java.io.IOException;

import java.sql.SQLException;

import java.text.ParseException;
import java.text.SimpleDateFormat;

import java.util.Date;
import java.util.StringJoiner;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class TheaterService {

    private static final SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);

    public TheaterService() {
        super();
    }

    public static String getTheaters(OracleDatabase db) throws OracleException, IOException, SQLException {
        System.out.println(sdf.format(new Date()) + "[TheaterService.getTheaters()]: Started.");
        OracleDocument[] theaters = Theater.getTheaters(db);
        db.admin().getConnection().close();
        StringJoiner result = new StringJoiner(",", "[", "]");
        for (int i = 0; i < theaters.length; i++) {
            result.add(Item.serializeAsItem(theaters[i]));
        }
        System.out.println(sdf.format(new Date()) + "[TheaterService.getTheaters()]: Completed.");
        return result.toString();
    }

    public static String getTheater(OracleDatabase db, String key) throws OracleException, IOException, SQLException {
        System.out.println(sdf.format(new Date()) + "[TheaterService.getTheater()]: Started.");
        OracleDocument theater = Theater.getTheater(db, key);
        db.admin().getConnection().close();
        System.out.println(sdf.format(new Date()) + "[TheaterService.getTheaters()]: Completed.");
        return theater.getContentAsString();
    }

    public static String getTheaterById(OracleDatabase db, Gson gson, int id) throws OracleException, SQLException {
        System.out.println(sdf.format(new Date()) + "[TheaterService.getTheaterById()]: Started.");
        OracleDocument theater = Theater.getTheaterById(db, id);
        db.admin().getConnection().close();
        System.out.println(sdf.format(new Date()) + "[TheaterService.getTheaterById()]: Completed.");
        return theater.getContentAsString();
    }

    public static String getMoviesByTheater(OracleDatabase db, String key, String date) throws SQLException,
                                                                                               IOException,
                                                                                               OracleException,
                                                                                               ParseException {
        System.out.println(sdf.format(new Date()) + "[TheaterService.getMoviesByTheater()]: Started.");
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Date targetDate = sdf.parse(date);
        System.out.println(sdf.format(new Date()) + "[TheaterService.getMoviesByTheater()]: Completed.");
        return new MoviesByTheater(db, key, targetDate).toJSON();
    }

    public static String getTheatersByLocation(OracleDatabase db, double latitude, double longitude,
                                               int distance) throws OracleException, IOException, SQLException {
        System.out.println(sdf.format(new Date()) + "[TheaterService.getTheatersByLocation()]: Started.");
        OracleDocument[] theaters = Theater.getTheatersByLocation(db, latitude, longitude, distance);
        db.admin().getConnection().close();
        StringJoiner result = new StringJoiner(",", "[", "]");
        for (int i = 0; i < theaters.length; i++) {
            result.add(Item.serializeAsItem(theaters[i]));
        }
        System.out.println(sdf.format(new Date()) + "[TheaterService.getTheatersByLocation()]: Completed.");
        return result.toString();
    }

    public static String searchTheaters(OracleDatabase db, String qbe) throws OracleException, IOException,
                                                                              SQLException {
        System.out.println(sdf.format(new Date()) + "[TheaterService.searchTheaters()]: Completed.");
        OracleDocument[] theaters = Theater.searchTheaters(db, qbe);
        db.admin().getConnection().close();
        StringJoiner result = new StringJoiner(",", "[", "]");
        for (int i = 0; i < theaters.length; i++) {
            result.add(Item.serializeAsItem(theaters[i]));
        }
        System.out.println(sdf.format(new Date()) + "[TheaterService.searchTheaters()]: Completed.");
        return result.toString();
    }

}
