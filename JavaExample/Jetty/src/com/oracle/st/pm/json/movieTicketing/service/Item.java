package com.oracle.st.pm.json.movieTicketing.service;

import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class Item {

    private static String makeKey(String key) {
        return "\"" + key + "\"" + ":";
    }

    private static String makeStringValue(String value) {
        return "\"" + value + "\"";
    }

    public static String serializeAsItem(OracleDocument doc) throws OracleException {

        StringBuilder sb = new StringBuilder("{");
        sb.append(makeKey("id"));
        sb.append(makeStringValue(doc.getKey()));
        sb.append(",");
        sb.append(makeKey("etag"));
        sb.append(makeStringValue(doc.getVersion()));
        sb.append(",");
        sb.append(makeKey("lastModified"));
        sb.append(makeStringValue(doc.getLastModified()));
        sb.append(",");
        sb.append(makeKey("created"));
        sb.append(makeStringValue(doc.getCreatedOn()));
        sb.append(",");
        sb.append(makeKey("value"));
        sb.append(doc.getContentAsString());
        sb.append("}");

        return sb.toString();
    }
}
