package com.oracle.st.pm.json.movieTicketing.docStore;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import com.oracle.st.pm.json.movieTicketing.qbe.GetDocumentById;
import com.oracle.st.pm.json.movieTicketing.utilitiy.CollectionManager;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

import java.io.IOException;

import java.text.SimpleDateFormat;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import oracle.soda.OracleBatchException;
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

    protected static OracleDocument insertDocument(OracleDatabase db, String collectionName,OracleDocument doc) throws OracleException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        doc =  collection.insertAndGet(doc);
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.insertDocument(\"" + collectionName + "\"): Inserted 1 document in " + elapsedTime + " ms. ");
        return doc;
    }

    protected static OracleDocument insertDocument(OracleDatabase db, String collectionName,Object object) throws OracleException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        OracleDocument doc =  collection.insertAndGet(db.createDocumentFromString(gson.toJson(object)));
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.insertDocument(\"" + collectionName + "\"): Inserted 1 document in " + elapsedTime + " ms. ");
        return doc;
    }

    protected static List<OracleDocument> bulkInsert2(OracleCollection collection, List<OracleDocument> documents) throws OracleException {
        long startTime = System.currentTimeMillis();
        System.out.println("Invoking insertAndGet");
                List<OracleDocument> results = collection.insertAndGet(documents.iterator());
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.bulkInsert(\""+ collection.admin().getName() +"\"): Inserted " + documents.size() + " documents in " + elapsedTime + " ms.");
        return results;
    }

    protected static List<OracleDocument> bulkInsert1(OracleDatabase db, String collectionName, List<OracleDocument> documents) throws OracleException {
        OracleCollection collection = db.openCollection(collectionName);
        System.out.println("Obtained Soda Collection");
        return bulkInsert2(collection,documents);        
    }

    protected static List<OracleDocument> bulkInsert(OracleDatabase db, String collectionName, SodaCollection[] documents) throws OracleException {
        if (documents.length > 0) { 
          List<OracleDocument> documentList = new ArrayList<OracleDocument>();
          for (int i=0; i<documents.length;i++) {
            OracleDocument doc = db.createDocumentFromString(gson.toJson(documents[i]));
            documentList.add(doc);   
          }
          System.out.println("Converted Array to ArrayList");
          try {
              insertDocument(db,collectionName,documents[0]);
              System.out.println("Insert Succeeded");
            return bulkInsert1(db,collectionName,documentList);        
          } catch (OracleBatchException obe) {
              System.out.println(obe.getProcessedCount());
              System.out.println(gson.toJson(documents[obe.getProcessedCount()]));
              obe.printStackTrace();
                    
          }
        }
        return new ArrayList<OracleDocument>();
    }

    protected static boolean updateDocument(OracleDatabase db, String collectionName, String key, String version,
                                   OracleDocument newDocument) throws OracleException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        OracleOperationBuilder operation = collection.find().key(key).version(version);
        boolean status = operation.replaceOne(newDocument);
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.updateDocument(\"" + collectionName + "\"): Updated 1 document in " + elapsedTime + " ms. ");
        return status;
    }

    protected static OracleCollection createIndex(OracleCollection collection, OracleDocument indexDefinition) throws OracleException {
        System.out.println(indexDefinition.getContentAsString());
        long startTime = System.currentTimeMillis();
        collection.admin().createIndex(indexDefinition);
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.createIndex(\""+ collection.admin().getName() +"\"): Created Index in " + elapsedTime + " ms.");
        return collection;
    }

    protected static OracleCollection createCollection(OracleDatabase db, String collectionName) throws OracleException {
        
        JsonObject collectionDefinition = getCollectionProperties(collectionName);
        OracleDocument collectionProperties = null
;        if (collectionDefinition != null) {
          if (collectionDefinition.has("indexes")) {
            collectionDefinition.remove("indexes");
           }
           collectionProperties = db.createDocumentFromString(gson.toJson(collectionDefinition));
        }

        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.admin().createCollection(collectionName, collectionProperties);
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.createCollection(\""+ collectionName +"\"): Created collection in " + elapsedTime + " ms.");
        return collection;
    }

    protected static OracleCollection createCollection(OracleDatabase db, String collectionName, OracleDocument collectionProperties) throws OracleException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.admin().createCollection(collectionName, collectionProperties);
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.createCollection(\""+ collectionName +"\"): Created collection in " + elapsedTime + " ms.");
        return collection;
    }

    protected static void dropCollection(OracleDatabase db, String collectionName) throws OracleException {
        long startTime = System.currentTimeMillis();
        OracleCollection collection = db.openCollection(collectionName);
        if (collection != null) {
          collection.admin().drop();
        }
        long elapsedTime = System.currentTimeMillis() - startTime;
        System.out.println("MovieTicketing.dropCollection(\""+ collectionName +"\"): Dropped collection in " + elapsedTime + " ms.");
    }
    
    protected static OracleCollection recreateCollection(OracleDatabase db, String collectionName) throws OracleException {
         return recreateCollection(db,collectionName,null);
    }

    protected static OracleCollection recreateCollection(OracleDatabase db, String collectionName,
                                          List<OracleDocument> documents) throws OracleException {

        JsonObject collectionDefinition = getCollectionProperties(collectionName);

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
           bulkInsert2(collection,documents);     
        }

        if (indexMetadata != null) {
            for (int i = 0; i < indexMetadata.size(); i++) {   
                JsonObject indexDefinition = indexMetadata.get(i).getAsJsonObject();
                // System.out.println(indexDefinition.toString());
                if ((indexDefinition.has("spatial")) && (!DBConnection.isNearSupported())) {
                    System.out.println(sdf.format(new Date()) + ": Skipped creation of unsupported spatial index");
                } else {
                    createIndex(collection,db.createDocumentFromString(gson.toJson(indexDefinition)));
                }
            }
        }
        return collection;
    }

    protected static void createIndexes(OracleDatabase db, String collectionName, JsonArray indexMetadata) throws OracleException {
      OracleCollection collection = db.openCollection(collectionName);
      for (int i = 0; i < indexMetadata.size(); i++) {   
        JsonObject indexDefinition = indexMetadata.get(i).getAsJsonObject();
        // System.out.println(indexDefinition.toString());
        if ((indexDefinition.has("spatial")) && (!DBConnection.isNearSupported())) {
            System.out.println(sdf.format(new Date()) + ": Skipped creation of unsupported spatial index");
        } else {
            createIndex(collection,db.createDocumentFromString(gson.toJson(indexDefinition)));
        }
      }
    }

    protected static void createIndexes(OracleDatabase db, String collectionName) throws OracleException {

        JsonObject collectionDefinition = CollectionManager.collectionMetadata.getAsJsonObject(collectionName);
        if ((collectionDefinition == null) || (!collectionDefinition.has("indexes"))) {
          return;
        }

        JsonArray indexMetadata = indexMetadata = collectionDefinition.getAsJsonArray("indexes");
       createIndexes(db,collectionName,indexMetadata);
    }

    protected static JsonObject getCollectionProperties(String collectionName) {
      // Clone the collection Metadata
      JsonParser p = new JsonParser();
      JsonObject collectionDefinition = CollectionManager.collectionMetadata.getAsJsonObject(collectionName);
      if (collectionDefinition != null) {
        collectionDefinition = p.parse(gson.toJson(collectionDefinition)).getAsJsonObject();
      }
      return collectionDefinition;
    }
          
    public String toJSON() {
        return gson.toJson(this);
    }
 
    public static SodaCollection fromJSON(String json) {
        return gson.fromJson(json, SodaCollection.class);
    }
}
