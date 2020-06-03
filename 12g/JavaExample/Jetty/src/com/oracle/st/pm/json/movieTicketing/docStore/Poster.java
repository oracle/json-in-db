package com.oracle.st.pm.json.movieTicketing.docStore;

import java.io.IOException;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class Poster extends SodaCollection {

    public static final String COLLECTION_NAME = "Poster";

    public Poster() {
        super();
    }

    public static OracleDocument getPoster(OracleDatabase db, String key) throws OracleException, IOException {
        return getDocument(db,COLLECTION_NAME,key);
    }

    public static long getPosterCount(OracleDatabase db) throws OracleException {
        return getDocumentCount(db, COLLECTION_NAME);
    }
    
    public static OracleCollection recreatePosterCollection(OracleDatabase db) throws OracleException {

        // Create a collection with the name "THEATER" and store the documents
        return recreateCollection(db,COLLECTION_NAME);
    }
}
