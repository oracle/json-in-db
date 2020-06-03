package com.oracle.st.pm.json.movieTicketing.test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.service.TheaterService;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

public class getMoviesByTheater {

    private static Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();

    public getMoviesByTheater() {
        super();
    }

    public static void main(String[] args) {
        try {
            System.out.println(TheaterService.getMoviesByTheater(DBConnection.getOracleDatabase(),
                                                                 "0720F2BCFD34495F8D05FA4DC65C30A9", "2016-08-11"));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
