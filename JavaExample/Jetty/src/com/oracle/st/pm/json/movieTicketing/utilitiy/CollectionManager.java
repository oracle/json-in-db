package com.oracle.st.pm.json.movieTicketing.utilitiy;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.FileNotFoundException;
import java.io.FileReader;

import java.sql.SQLException;

import java.sql.SQLSyntaxErrorException;

import java.text.SimpleDateFormat;

import java.util.Date;
import java.util.UUID;

import oracle.json.parser.QueryException;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;
import oracle.soda.OracleOperationBuilder;

public class CollectionManager {

    public static final String DEFAULT_FILENAME = "collections.json";

    public static final JsonObject collectionMetadata = CollectionManager.getCollectionProperties();
    public static final DataSources dataSources = DataSources.loadDataSources();

    private static final Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ssZ").create();
    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ");

    private OracleDatabase db = null;
    
    public CollectionManager() {
        super();
    }

    public static OracleCollection recreateCollection(OracleDatabase db, String name) throws OracleException {

        OracleCollection collection = db.openCollection(name);
        if (collection != null) {
            collection.admin().drop();
        }
        JsonObject collectionDefinition = CollectionManager.collectionMetadata.getAsJsonObject(name);
        JsonArray indexMetadata = null;
        if ((collectionDefinition != null) && (collectionDefinition.has("indexes"))) {
            indexMetadata = collectionDefinition.getAsJsonArray("indexes");
            collectionDefinition.remove("indexes");
        }

        OracleDocument collectionProperties = null;
        if (collectionDefinition != null) {
            collectionProperties = db.createDocumentFromString(gson.toJson(collectionDefinition));
        }

        collection = db.admin().createCollection(name, collectionProperties);

        if (indexMetadata != null) {
            for (int i = 0; i < indexMetadata.size(); i++) {
                JsonObject indexDefinition = indexMetadata.get(i).getAsJsonObject();
                // System.out.println(indexDefinition.toString());
                if ((indexDefinition.has("spatial")) && (!DBConnection.isNearSupported())) {
                    System.out.println(sdf.format(new Date()) + ": Skipped creation of unsupported spatial index");
                } else {
                    collection.admin().createIndex(db.createDocumentFromString(gson.toJson(indexDefinition)));
                }
            }
        }
        return collection;
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
