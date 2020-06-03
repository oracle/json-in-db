package com.oracle.st.pm.json.movieTicketing.utilitiy;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;

public class DataSources {

    public static final String DEFAULT_FILENAME = "dataSources.json";

    private static final Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();

    private Gson dataSources;

    private class Proxy {
        public String hostname;
        public int port;
    }

    public class TMDB {

        public class SearchCriteria {

            public class ReleaseDates {
                public String start;
                public String end;
            }

            public String language;
            public String country;
            public String certification;
            public int popularity;
            public ReleaseDates releaseDates;
            public int movieLimit;
        }

        public String protocol;
        public String hostname;
        public int port;
        public String apiPath;
        public String apiKey;
        public SearchCriteria searchCriteria;
    }

    public class Fandango {

        public class SearchCriteria {
            public int zipCode;
        }

        public String protocol;
        public String hostname;
        public int port;
        public String path;
        public SearchCriteria searchCriteria;
    }

    public class USCensus {
        public String protocol;
        public String hostname;
        public int port;
        public String path;
    }

    public class Google {
        public class Geocoding {
            public String protocol;
            public String hostname;
            public int port;
            public String path;
        };

        public String apiKey;
        public Geocoding geocoding;
    }
    
    public class Emulation  {
        public String theaters;
        public String movies;
        public String screenings;

    }

    public boolean useProxy;
    public Proxy proxy;
    public TMDB tmdb;
    public Fandango fandango;
    public USCensus usCensus;
    public String geocodingService;
    public String mappingService;
    public Google google;
    public boolean emulate;
    public Emulation emulation;

    public DataSources() {
        super();
    }

    public static DataSources loadDataSources() {
        try {
            String filename = System.getProperty("com.oracle.st.pm.json.dataSources", DataSources.DEFAULT_FILENAME);
            DataSources ds = gson.fromJson(new FileReader(filename), DataSources.class);
            return ds;
        } catch (FileNotFoundException fnf) {
            fnf.printStackTrace(System.out);
            System.exit(-1);
        }
        return null;
    }

    public void updateDataSources(String updatesJSON) throws IOException {

        JsonObject updates = new JsonParser().parse(updatesJSON).getAsJsonObject();
        if (updates.has("tmdb")) {
            this.tmdb.apiKey = updates.getAsJsonObject("tmdb").getAsJsonPrimitive("apiKey").getAsString();
        }

        if (updates.has("google")) {
            this.google.apiKey = updates.getAsJsonObject("google").getAsJsonPrimitive("apiKey").getAsString();
        }

        if (updates.has("geocodingService")) {
            this.geocodingService = updates.getAsJsonPrimitive("geocodingService").getAsString();
        }

        if (updates.has("mappingService")) {
            this.mappingService = updates.getAsJsonPrimitive("mappingService").getAsString();
        }

        String filename = System.getProperty("com.oracle.st.pm.json.dataSources", DataSources.DEFAULT_FILENAME);
        FileWriter fw = new FileWriter(filename);
        fw.write(gson.toJson(this));
        fw.close();

    }
}
