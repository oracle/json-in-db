package com.oracle.st.pm.json.movieTicketing.utilitiy;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;

import java.io.FileNotFoundException;
import java.io.FileReader;

import java.text.SimpleDateFormat;

import oracle.soda.OracleDatabase;

public class CollectionManager {

    public static final String DEFAULT_FILENAME = "collections.json";

    public static final JsonObject collectionMetadata = CollectionManager.getCollectionProperties();
    public static final DataSources dataSources = DataSources.loadDataSources();

    private static final Gson gson = new GsonBuilder().setDateFormat(SodaCollection.ISO_DATE_FORMAT).create();
    private static final SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);

    private OracleDatabase db = null;
    
    public CollectionManager clone() {
       return new CollectionManager();
    }
    
    public static JsonObject getCollectionProperties() {
        String filename =
            System.getProperty("com.oracle.st.pm.json.collectionProperties", CollectionManager.DEFAULT_FILENAME);
        JsonParser p = new JsonParser();
        try {
            JsonElement je = p.parse(new FileReader(filename));
            return je.getAsJsonObject();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
            System.exit(-1);
        }
        return null;
    }
}
