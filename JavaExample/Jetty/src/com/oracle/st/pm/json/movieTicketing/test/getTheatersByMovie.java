package com.oracle.st.pm.json.movieTicketing.test;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.service.TheaterService;
import com.oracle.st.pm.json.movieTicketing.utilitiy.CollectionManager;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

public class getTheatersByMovie {

    private static Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ssZ").create();

    public getTheatersByMovie() {
        super();
    }

    public static void main(String[] args) {
        try {
          System.out.println(TheaterService.getMoviesByTheater(DBConnection.getOracleDatabase(),"B290C1D2A1E9456595F6CEC2A27640CC", "2016-08-10"));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
