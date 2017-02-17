package com.oracle.st.pm.json.movieTicketing.service;

import com.oracle.st.pm.json.movieTicketing.docStore.Movie;

import com.oracle.st.pm.json.movieTicketing.docStore.Poster;

import java.io.IOException;

import java.sql.SQLException;

import java.text.SimpleDateFormat;

import java.util.Date;

import oracle.soda.OracleDatabase;
import oracle.soda.OracleDocument;
import oracle.soda.OracleException;

public class PosterService {

    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ");

    public PosterService() {
        super();
    }

    public static byte[] getPoster(OracleDatabase db, String key) throws OracleException, IOException, SQLException {
        System.out.println(sdf.format(new Date()) + "[PosterService.getPoster()]: Started.");
        OracleDocument poster = Poster.getPoster(db, key);
        db.admin().getConnection().close();
        System.out.println(sdf.format(new Date()) + "[PosterService.getPoster()]: Completed.");
        return poster.getContentAsByteArray();
    }

}
