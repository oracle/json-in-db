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

    public boolean $containsSupported = true;
    public boolean $nearSupported = true;
    public boolean nullOnEmptySupported = true;

    public CollectionManager() {
        super();
    }

    public void setDatabase(OracleDatabase db) throws OracleException {
        this.db = db;
        featureDetection(this);
    }

    public OracleDatabase getDatabase() {
        return this.db;
    }

    public OracleCollection recreateCollection(String name) throws OracleException {

        OracleCollection collection = this.db.openCollection(name);
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
                if ((indexDefinition.has("spatial")) && (!this.$nearSupported)) {
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

    public void featureDetection(CollectionManager collectionManager) throws OracleException {

        String collectionName = "TMP-" + UUID.randomUUID();
        OracleCollection col = this.recreateCollection(collectionName);

        /*
       ** Test for $CONTAINS support
       */

        String qbeDefinition = "{\"id\" : {\"$contains\" : \"XXX\"}}";
        OracleDocument qbe = db.createDocumentFromString(qbeDefinition);
        try {
            OracleOperationBuilder docs = col.find().filter(qbe);
            long theaterCount = docs.count();
        } catch (OracleException e) {
          Throwable cause = e.getCause();
          if ((cause instanceof QueryException) && (cause.getMessage().equalsIgnoreCase("The field name $contains is not a recognized operator."))) {
            this.$containsSupported = false;
          } 
          else {
            if (cause instanceof SQLException) {
              if (((SQLException) cause).getErrorCode() != 40467) {
                throw e;                                         
              }
            }
            else {
              throw e;
            }
          }
        }

        /*
        ** Test for $NEAR support and spatial indexes.
        */

        qbeDefinition = "{ \"geoCoding\" : { \"$near\" : { \"$geometry\"      : { \"type\" : \"Point\", \"coordinates\" : [-122.12469369777311,37.895215209615884]}, \"$distance\" : 5, \"$unit\" : \"mile\"}}}";

        qbe = db.createDocumentFromString(qbeDefinition);
        try {
            OracleOperationBuilder docs = col.find().filter(qbe);
            long theaterCount = docs.count();
        } catch (OracleException e) {
          Throwable cause = e.getCause();
          if ((cause instanceof QueryException) &&  (cause.getMessage().equalsIgnoreCase("The field name $near is not a recognized operator."))) {
            this.$nearSupported = false;
          } 
          else {
            if (cause instanceof SQLSyntaxErrorException) {
              if (((SQLException) cause).getErrorCode()== 904) {
                this.$nearSupported = false;
              }
              else {
                throw e;                                         
              }
            }
            else {
              throw e;
            }
          }
        }

        /*
        ** Test for 'singleton' support in index creation
        */

        String indexDefinition =
            "{\"name\" : \"TEST_IDX\", \"unique\" : true, \"fields\" : [{\"path\" : \"id\", \"datatype\" : \"number\", \"order\" : \"asc\"}]}";
        OracleDocument indexSpecification = db.createDocumentFromString(indexDefinition);

        try {
            col.admin().createIndex(indexSpecification);
        } catch (OracleException e) {
          Throwable cause = e.getCause();
          if (cause instanceof SQLSyntaxErrorException) {
            if (((SQLException) cause).getErrorCode()== 907) {
              this.nullOnEmptySupported = false;
            }
            else {
              throw e;                                         
            }
          }
        }

        col.admin().drop();

        // System.out.println(sdf.format(new Date()) + ": $contains operator supported:  " + $containsSupported);
        // System.out.println(sdf.format(new Date()) + ": $near operatator   supported:  " + $nearSupported);
        // System.out.println(sdf.format(new Date()) + ": \"NULL ON EMPTY\"    supported:  " + nullOnEmptySupported);

    }
}
