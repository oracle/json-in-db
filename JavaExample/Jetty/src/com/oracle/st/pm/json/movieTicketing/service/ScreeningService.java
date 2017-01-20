package com.oracle.st.pm.json.movieTicketing.service;

import com.google.gson.Gson;

import com.oracle.st.pm.json.movieTicketing.docStore.Movie;
import com.oracle.st.pm.json.movieTicketing.docStore.Screening;
import com.oracle.st.pm.json.movieTicketing.docStore.Theater;

import java.io.IOException;

import java.sql.SQLException;

import java.text.ParseException;
import java.text.SimpleDateFormat;

import java.util.Date;
import java.util.StringJoiner;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class ScreeningService {

    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ");

    public ScreeningService() {
        super();
    }

    public static String getScreening(OracleDatabase db, String key) throws OracleException, IOException {
        System.out.println(sdf.format(new Date()) + "[ScreeningService.getScreening()]: Started.");
        OracleDocument screening = Screening.getScreening(db, key);
        System.out.println(sdf.format(new Date()) + "[ScreeningService.getScreening()]: Completed.");
        return screening.getContentAsString();
    }

}
