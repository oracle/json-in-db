package com.oracle.st.pm.json.movieTicketing.test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.docStore.Theater;
import com.oracle.st.pm.json.movieTicketing.service.TheaterService;
import com.oracle.st.pm.json.movieTicketing.utilitiy.CollectionManager;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

import java.sql.Connection;

import java.util.Calendar;

import oracle.soda.OracleDatabase;
import oracle.soda.rdbms.OracleRDBMSClient;

public class searchTheaters {

    private static Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ssZ").create();

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
