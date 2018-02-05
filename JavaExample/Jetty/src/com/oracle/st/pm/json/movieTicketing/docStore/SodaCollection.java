package com.oracle.st.pm.json.movieTicketing.docStore;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import com.oracle.st.pm.json.movieTicketing.qbe.GetDocumentById;
import com.oracle.st.pm.json.movieTicketing.utilitiy.CollectionManager;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

import java.io.IOException;

import java.text.SimpleDateFormat;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import oracle.soda.OracleCollection;
import oracle.soda.OracleCursor;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;
import oracle.soda.OracleOperationBuilder;

public class SodaCollection {
    
    public static final String ISO_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX";

    protected static final Gson gson = new GsonBuilder().setDateFormat(ISO_DATE_FORMAT).create();
    
    private static final SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);

    public SodaCollection() {
        super();
    }

    protected static long getDocumentCount(OracleDatabase db, String collectionName) throws OracleException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        if (collection != null) {
            OracleOperationBuilder documents = collection.find();
            long result = documents.count();
            long elapsedTime = System.currentTimeMillis() - startTime;
            System.out.println("MovieTicketing.getDocumentCount(\"" + collectionName + "\"): Found " + result + " documents. Elapsed time " + elapsedTime + " ms.");
            return result;
        }
        else {
            long elapsedTime = System.currentTimeMillis() - startTime;
            System.out.println("MovieTicketing.getDocumentCount(\"" + collectionName + "\"): Collection not found. Elapsed time " + elapsedTime + " ms.");
            return 0;
        }
    }



   protected static OracleDocument[] getDocuments(OracleDatabase db, String collectionName, int limit) throws OracleException, IOException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        if (collection != null) {
          OracleOperationBuilder operation = collection.find();
          if (limit > -1) {
            operation.limit(limit);
          }
          OracleCursor cursor = operation.getCursor();
          ArrayList<OracleDocument> documentList = new ArrayList<OracleDocument>();
          while (cursor.hasNext()){
            documentList.add(cursor.next());  
          }
          cursor.close();
          OracleDocument[] documents = documentList.toArray(new OracleDocument[0]);
          long elapsedTime = System.currentTimeMillis() - startTime;
          System.out.println("MovieTicketing.getDocuments(\"" + collectionName + "\"): Returned " + documents.length + " documents in " + elapsedTime + " ms.");
          return documents;
        } 
        else {
          long elapsedTime = System.currentTimeMillis() - startTime;
          System.out.println("MovieTicketing.getDocuments(\"" + collectionName + "\"): Elapsed time " + elapsedTime + " ms.");
          return new OracleDocument[0];
        }
    }
    
    protected static OracleDocument getDocument(OracleDatabase db, String collectionName, String key) throws OracleException, IOException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        OracleDocument document = collection.findOne(key);
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.getDocument(\"" + collectionName + "\"): Elapsed time " + elapsedTime + " ms. Key = \"" + key + "\",");
        return document;
    }

    protected static OracleDocument getDocumentById(OracleDatabase db, String collectionName, int id) throws OracleException {
            long startTime = System.currentTimeMillis();
            OracleCollection collection = db.openCollection(collectionName);
            GetDocumentById qbeDefinition = new GetDocumentById(id);
            OracleDocument qbe = db.createDocumentFromString(gson.toJson(qbeDefinition));
            OracleOperationBuilder operation = collection.find().filter(qbe);
            OracleDocument doc = operation.getOne();
            long elapsedTime = System.currentTimeMillis() - startTime;
            System.out.println("MovieTicketing.getMovieById(\"" + collectionName + "\"): Returned 1 document in " + elapsedTime + " ms. QBE Expression: \"" + gson.toJson(qbeDefinition) + "\".");
            return doc;
        }
    
    protected static OracleDocument[] searchCollection(OracleDatabase db, String collectionName, String qbeDefinition) throws OracleException,
                                                                                                IOException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        OracleDocument qbe = db.createDocumentFromString(qbeDefinition);
        OracleOperationBuilder operation = collection.find().filter(qbe);
        OracleCursor cursor = operation.getCursor();
        ArrayList<OracleDocument> documentList = new ArrayList<OracleDocument>();
        while (cursor.hasNext()){
          documentList.add(cursor.next());  
        }
        cursor.close();
        OracleDocument[] documents = documentList.toArray(new OracleDocument[0]);
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.searchCollection(\""+ collectionName +"\"): Returned " + documents.length + " documents in " + elapsedTime + " ms. QBE Expression: \"" + qbeDefinition + "\".");
        return documents;
    }

    public static void insertDocument(OracleDatabase db, String collectionName,Object object) throws OracleException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        collection.insert(db.createDocumentFromString(gson.toJson(object)));
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.insertDocument(\"" + collectionName + "\"): Inserted 1 document in " + elapsedTime + " ms. ");
    }

    public static void bulkInsert(OracleDatabase db, String collectionName, List<OracleDocument> documents) throws OracleException {
        OracleCollection collection = db.openCollection(collectionName);
        bulkInsert(collection,documents);        
    }

    public static void bulkInsert(OracleCollection collection, List<OracleDocument> documents) throws OracleException {
        long startTime = System.currentTimeMillis();
        collection.insert(documents.iterator());
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.bulkInsert(\""+ collection.admin().getName() +"\"): Inserted " + documents.size() + " documents in " + elapsedTime + " ms.");
    }

    public boolean updateDocument(OracleDatabase db, String collectionName, String key, String version,
                                   OracleDocument newDocument) throws OracleException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        OracleOperationBuilder operation = collection.find().key(key).version(version);
        boolean status = operation.replaceOne(newDocument);
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.updateDocument(\"" + collectionName + "\"): Updated 1 document in " + elapsedTime + " ms. ");
        return status;
    }

    public static OracleCollection createCollection(OracleDatabase db, String collectionName, OracleDocument collectionProperties) throws OracleException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.admin().createCollection(collectionName, collectionProperties);
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.createCollection(\""+ collectionName +"\"): Created collection in " + elapsedTime + " ms.");
        return collection;
    }

    public static OracleCollection indexCollection(OracleCollection collection, OracleDocument indexDefinition) throws OracleException {
        long startTime = System.currentTimeMillis();
        collection.admin().createIndex(indexDefinition);
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.indexCollection(\""+ collection.admin().getName() +"\"): Created Index in " + elapsedTime + " ms.");
        return collection;
    }

    public static void dropCollection(OracleDatabase db, String collectionName) throws OracleException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        if (collection != null) {
          collection.admin().drop();
        }
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.dropCollection(\""+ collectionName +"\"): Dropped collection in " + elapsedTime + " ms.");
    }
    
    public static OracleCollection recreateCollection(OracleDatabase db, String collectionName) throws OracleException {
         return recreateCollection(db,collectionName,null);
    }

    public static OracleCollection recreateCollection(OracleDatabase db, String collectionName,
                                          List<OracleDocument> documents) throws OracleException {

        JsonObject collectionDefinition = CollectionManager.collectionMetadata.getAsJsonObject(collectionName);

        JsonArray indexMetadata = null;
        if ((collectionDefinition != null) && (collectionDefinition.has("indexes"))) {
          indexMetadata = collectionDefinition.getAsJsonArray("indexes");
          collectionDefinition.remove("indexes");
        }

        OracleDocument collectionProperties = null;
        if (collectionDefinition != null) {
           collectionProperties = db.createDocumentFromString(gson.toJson(collectionDefinition));
        }
            
        dropCollection(db,collectionName);

        OracleCollection collection = createCollection(db,collectionName,collectionProperties);

        if ((documents != null) && (documents.size() > 0)) {
           bulkInsert(collection,documents);     
        }

        if (indexMetadata != null) {
            for (int i = 0; i < indexMetadata.size(); i++) {   
                JsonObject indexDefinition = indexMetadata.get(i).getAsJsonObject();
                // System.out.println(indexDefinition.toString());
                if ((indexDefinition.has("spatial")) && (!DBConnection.isNearSupported())) {
                    System.out.println(sdf.format(new Date()) + ": Skipped creation of unsupported spatial index");
                } else {
                    indexCollection(collection,db.createDocumentFromString(gson.toJson(indexDefinition)));
                }
            }
        }
        return collection;
    }

    public String toJSON() {
        return gson.toJson(this);
    }
 
    protected static SodaCollection fromJSON(String json) {
        return gson.fromJson(json, SodaCollection.class);
    }
}
