package com.oracle.st.pm.json.movieTicketing.test;

import com.oracle.st.pm.json.movieTicketing.service.ApplicationStatusService;
import com.oracle.st.pm.json.movieTicketing.utilitiy.DBConnection;

public class getApplicationStatus {

    public getApplicationStatus() {
        super();
    }

    public static void main(String[] args) {
        try {
            System.out.println(ApplicationStatusService.getApplicationStatus(DBConnection.getOracleDatabase()));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
