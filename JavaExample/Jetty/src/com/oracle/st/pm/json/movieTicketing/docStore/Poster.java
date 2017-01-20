package com.oracle.st.pm.json.movieTicketing.docStore;

import java.io.IOException;

import oracle.soda.OracleCollection;
import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;
import oracle.soda.OracleOperationBuilder;

public class Poster {

    public static final String COLLECTION_NAME = "Poster";

    public Poster() {
        super();
    }

    public static OracleDocument getPoster(OracleDatabase db, String key) throws OracleException, IOException {
        OracleCollection posters = db.openCollection(Poster.COLLECTION_NAME);
        OracleDocument poster = posters.findOne(key);
        return poster;
    }

    public static long getPosterCount(OracleDatabase db) throws OracleException {
        OracleCollection posters = db.openCollection(COLLECTION_NAME);
        if (posters != null) {
            OracleOperationBuilder posterDocuments = posters.find();
            return posterDocuments.count();
        }
        else {
            return 0;
        }
    }
}
