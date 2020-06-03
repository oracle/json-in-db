package com.oracle.st.pm.json.movieTicketing.docStore;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DataSources;

import java.io.IOException;

import java.text.SimpleDateFormat;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleException;

public class ApplicationStatus {

    private static final DataSources dataSources = DataSources.loadDataSources();
    private static final Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();
    private static final SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);

    public String googleKey;
    public String tmdbKey;
    public SupportedFeatures supportedFeatures;
    public String geocodingService;
    public String mappingService;
    public long movieCount = 0;
    public long theaterCount = 0;
    public long screeningCount = 0;
    public long posterCount = 0;
    public Position currentPosition = new Position(0, 0);

    public static class SupportedFeatures {

        public boolean $near = true;
        public boolean $contains = true;

        public SupportedFeatures(boolean $near, boolean $contains) {
            this.$near = $near;
            this.$contains = $contains;
        }
    }

    public static class Position {

        public Position(double latitude, double longitude) {
            coords = new Coords(latitude, longitude);
        }

        public Coords coords;

        public class Coords {

            public double latitude;
            public double longitude;

            public Coords(double latitude, double longitude) {
                this.latitude = latitude;
                this.longitude = longitude;
            }
        }
    }

    public ApplicationStatus(OracleDatabase db) throws OracleException, IOException {
        super();
        this.googleKey = dataSources.google.apiKey;
        this.tmdbKey = dataSources.tmdb.apiKey;
        this.geocodingService = dataSources.geocodingService;
        this.supportedFeatures =
            new SupportedFeatures(DBConnection.isNearSupported(), DBConnection.isContainsSupported());
        this.mappingService = dataSources.mappingService;
        this.movieCount = Movie.getMovieCount(db);
        this.theaterCount = Theater.getTheaterCount(db);
        this.posterCount = Poster.getPosterCount(db);
        this.screeningCount = Screening.getScreeningCount(db);
        this.currentPosition = Theater.getTheaterCentroid(db);
    }

    public String toJson() {
        return gson.toJson(this);
    }
}

