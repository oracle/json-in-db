package com.oracle.st.pm.json.movieTicketing.test;

import com.oracle.st.pm.json.movieTicketing.data.ExternalInterfaces;

public class getPostersFromTMDB {
    public getPostersFromTMDB() {
        super();
    }

    public static void main(String[] args) {
        try {
            ExternalInterfaces ext = new ExternalInterfaces();
            // ext.loadPostersFromTMDB();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
