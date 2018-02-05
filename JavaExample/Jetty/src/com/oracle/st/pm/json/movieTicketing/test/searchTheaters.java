package com.oracle.st.pm.json.movieTicketing.test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;
import com.oracle.st.pm.json.movieTicketing.service.TheaterService;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

public class searchTheaters {

    private static Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();

    public searchTheaters() {
        super();
    }

    public static void main(String[] args) {
        try {
            System.out.println(TheaterService.searchTheaters(DBConnection.getOracleDatabase(),"{\"location.city\" : \"SAN FRANCISCO\"}"));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
