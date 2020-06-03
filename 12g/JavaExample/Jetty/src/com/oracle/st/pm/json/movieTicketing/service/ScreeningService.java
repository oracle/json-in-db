package com.oracle.st.pm.json.movieTicketing.service;

import com.oracle.st.pm.json.movieTicketing.docStore.Screening;
import com.oracle.st.pm.json.movieTicketing.docStore.SodaCollection;

import java.io.IOException;

import java.sql.SQLException;

import java.text.SimpleDateFormat;

import java.util.Date;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class ScreeningService {

    private static final SimpleDateFormat sdf = new SimpleDateFormat(SodaCollection.ISO_DATE_FORMAT);

    public ScreeningService() {
        super();
    }

    public static String getScreening(OracleDatabase db, String key) throws OracleException, IOException, SQLException {
        System.out.println(sdf.format(new Date()) + "[ScreeningService.getScreening()]: Started.");
        OracleDocument screening = Screening.getScreening(db, key);
        db.admin().getConnection().close();
        System.out.println(sdf.format(new Date()) + "[ScreeningService.getScreening()]: Completed.");
        return screening.getContentAsString();
    }

}
