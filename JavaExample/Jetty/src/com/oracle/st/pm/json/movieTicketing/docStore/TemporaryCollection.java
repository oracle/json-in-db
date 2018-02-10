package com.oracle.st.pm.json.movieTicketing.docStore;

import java.util.UUID;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleException;

public class TemporaryCollection extends SodaCollection{
    
    public static String COLLECTION_NAME = "TMP-" + UUID.randomUUID().toString();
    
    public TemporaryCollection() {
        super();
    }
    
    public static OracleCollection createTemporaryCollection(OracleDatabase db) throws OracleException {
        return createCollection(db,COLLECTION_NAME);
    }
    
    public static void dropTemporaryCollection(OracleDatabase db) throws OracleException {
        dropCollection(db,COLLECTION_NAME);
    }
}

