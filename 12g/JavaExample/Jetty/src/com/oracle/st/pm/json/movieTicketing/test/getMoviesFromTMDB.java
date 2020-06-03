package com.oracle.st.pm.json.movieTicketing.test;

import com.oracle.st.pm.json.movieTicketing.data.ExternalInterfaces;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

public class getMoviesFromTMDB {
    public getMoviesFromTMDB() {
        super();
    }

    public static void main(String[] args) {
        try {
            ExternalInterfaces.loadMoviesFromTMDB(DBConnection.getOracleDatabase());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
